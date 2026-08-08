import { config } from '../config';

interface TwitchToken {
  access_token: string;
  expires_in: number;
  token_type: string;
}

interface TwitchStream {
  id: string;
  user_id: string;
  user_login: string;
  user_name: string;
  game_id: string;
  game_name: string;
  type: string;
  title: string;
  viewer_count: number;
  started_at: string;
  thumbnail_url: string;
}

interface TwitchUser {
  id: string;
  login: string;
  display_name: string;
  profile_image_url: string;
}

let cachedToken: TwitchToken | null = null;
let tokenExpiresAt = 0;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken.access_token;
  }

  if (!config.TWITCH_CLIENT_ID || !config.TWITCH_CLIENT_SECRET) {
    throw new Error('Credenciais da Twitch não configuradas');
  }

  const response = await fetch('https://id.twitch.tv/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: config.TWITCH_CLIENT_ID,
      client_secret: config.TWITCH_CLIENT_SECRET,
      grant_type: 'client_credentials',
    }),
  });

  if (!response.ok) {
    throw new Error(`Falha ao obter token da Twitch: ${response.status} ${response.statusText}`);
  }

  const data = await response.json() as TwitchToken;
  cachedToken = data;
  tokenExpiresAt = Date.now() + (data.expires_in * 1000) - 60000;

  return data.access_token;
}

export async function getStreamByLogin(userLogin: string): Promise<TwitchStream | null> {
  const token = await getAccessToken();

  const response = await fetch(
    `https://api.twitch.tv/helix/streams?user_login=${encodeURIComponent(userLogin)}`,
    {
      headers: {
        'Client-ID': config.TWITCH_CLIENT_ID!,
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Erro na API da Twitch: ${response.status} ${response.statusText}`);
  }

  const data = await response.json() as { data: TwitchStream[] };
  return data.data[0] ?? null;
}

export async function getUserByLogin(userLogin: string): Promise<TwitchUser | null> {
  const token = await getAccessToken();

  const response = await fetch(
    `https://api.twitch.tv/helix/users?login=${encodeURIComponent(userLogin)}`,
    {
      headers: {
        'Client-ID': config.TWITCH_CLIENT_ID!,
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Erro na API da Twitch: ${response.status} ${response.statusText}`);
  }

  const data = await response.json() as { data: TwitchUser[] };
  return data.data[0] ?? null;
}

export async function validateStreamerExists(userLogin: string): Promise<boolean> {
  const user = await getUserByLogin(userLogin);
  return user !== null;
}
