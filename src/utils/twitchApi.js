import { config } from '../config.js';

/**
 * @typedef {Object} TwitchToken
 * @property {string} access_token
 * @property {number} expires_in
 * @property {string} token_type
 */

/**
 * @typedef {Object} TwitchStream
 * @property {string} id
 * @property {string} user_id
 * @property {string} user_login
 * @property {string} user_name
 * @property {string} game_id
 * @property {string} game_name
 * @property {string} type
 * @property {string} title
 * @property {number} viewer_count
 * @property {string} started_at
 * @property {string} thumbnail_url
 */

/**
 * @typedef {Object} TwitchUser
 * @property {string} id
 * @property {string} login
 * @property {string} display_name
 * @property {string} profile_image_url
 */

/** @type {TwitchToken | null} */
let cachedToken = null;
let tokenExpiresAt = 0;

/**
 * @returns {Promise<string>}
 */
async function getAccessToken() {
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

  /** @type {TwitchToken} */
  const data = await response.json();
  cachedToken = data;
  tokenExpiresAt = Date.now() + (data.expires_in * 1000) - 60000;

  return data.access_token;
}

/**
 * @param {string} userLogin
 * @returns {Promise<TwitchStream | null>}
 */
export async function getStreamByLogin(userLogin) {
  const token = await getAccessToken();

  const response = await fetch(
    `https://api.twitch.tv/helix/streams?user_login=${encodeURIComponent(userLogin)}`,
    {
      headers: {
        'Client-ID': config.TWITCH_CLIENT_ID,
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Erro na API da Twitch: ${response.status} ${response.statusText}`);
  }

  /** @type {{ data: TwitchStream[] }} */
  const data = await response.json();
  return data.data[0] ?? null;
}

/**
 * @param {string} userLogin
 * @returns {Promise<TwitchUser | null>}
 */
export async function getUserByLogin(userLogin) {
  const token = await getAccessToken();

  const response = await fetch(
    `https://api.twitch.tv/helix/users?login=${encodeURIComponent(userLogin)}`,
    {
      headers: {
        'Client-ID': config.TWITCH_CLIENT_ID,
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Erro na API da Twitch: ${response.status} ${response.statusText}`);
  }

  /** @type {{ data: TwitchUser[] }} */
  const data = await response.json();
  return data.data[0] ?? null;
}

/**
 * @param {string} userLogin
 * @returns {Promise<boolean>}
 */
export async function validateStreamerExists(userLogin) {
  const user = await getUserByLogin(userLogin);
  return user !== null;
}
