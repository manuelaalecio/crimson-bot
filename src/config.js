import 'dotenv/config';

const requiredEnv = ['DISCORD_TOKEN', 'CLIENT_ID', 'GUILD_ID'];

for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`[Config] Variável de ambiente obrigatória ausente: ${key}`);
  }
}

export const config = {
  DISCORD_TOKEN: process.env.DISCORD_TOKEN,
  CLIENT_ID: process.env.CLIENT_ID,
  GUILD_ID: process.env.GUILD_ID,
  WELCOME_CHANNEL_ID: process.env.WELCOME_CHANNEL_ID ?? null,
  LOGS_CHANNEL_ID: process.env.LOGS_CHANNEL_ID ?? null,
  REACTION_ROLE_MESSAGE_ID: process.env.REACTION_ROLE_MESSAGE_ID ?? null,
  REACTION_ROLE_ID: process.env.REACTION_ROLE_ID ?? null,
  TWITCH_CLIENT_ID: process.env.TWITCH_CLIENT_ID ?? null,
  TWITCH_CLIENT_SECRET: process.env.TWITCH_CLIENT_SECRET ?? null,
  STREAM_NOTIFICATION_CHANNEL_ID: process.env.STREAM_NOTIFICATION_CHANNEL_ID ?? null,
};
