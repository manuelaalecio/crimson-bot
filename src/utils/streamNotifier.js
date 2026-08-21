import { EmbedBuilder } from 'discord.js';
import { getStreamByLogin, getUserByLogin } from './twitchApi.js';
import { config } from '../config.js';

const MONITORED_STREAMERS = ['titiotks'];

/**
 * @typedef {Object} StreamerStatus
 * @property {boolean} wasLive
 */

/**
 * @returns {Record<string, StreamerStatus>}
 */
function createInitialStatus() {
  const status = {};
  for (const login of MONITORED_STREAMERS) {
    status[login] = { wasLive: false };
  }
  return status;
}

/**
 * @param {import('../structures/CustomClient.js').CustomClient} client
 */
export function startStreamPolling(client) {
  const POLL_INTERVAL = 60_000;
  const streamStatus = createInitialStatus();

  async function checkStreams() {
    if (!config.STREAM_NOTIFICATION_CHANNEL_ID) {
      return;
    }

    const channel = await client.channels.fetch(config.STREAM_NOTIFICATION_CHANNEL_ID);

    if (!channel || !channel.isTextBased() || channel.isDMBased()) {
      return;
    }

    for (const login of MONITORED_STREAMERS) {
      try {
        const stream = await getStreamByLogin(login);
        const wasLive = streamStatus[login]?.wasLive ?? false;

        if (stream && !wasLive) {
          const user = await getUserByLogin(login);
          const thumbnailUrl = stream.thumbnail_url
            .replace('{width}', '320')
            .replace('{height}', '180');

          const embed = new EmbedBuilder()
            .setTitle('🔴 AO VIVO AGORA!')
            .setDescription(
              `**${stream.user_name}** está ao vivo!\n` +
              `🎮 **Jogo:** ${stream.game_name}\n` +
              `👥 **Espectadores:** ${stream.viewer_count}\n` +
              `📝 **Título:** ${stream.title}\n\n` +
              `[Assistir agora](https://twitch.tv/${stream.user_login})`
            )
            .setColor(0xdc143c)
            .setThumbnail(user?.profile_image_url ?? null)
            .setTimestamp()
            .setFooter({ text: 'CRIMSON Stream Notifications' });

          await channel.send({
            content: '@everyone',
            embeds: [embed],
          });

          console.log(`[Stream] Notificação enviada para ${login}`);
        }

        streamStatus[login] = { wasLive: stream !== null };
      } catch (error) {
        console.error(`[Stream] Erro ao verificar streamer ${login}:`, error);
      }
    }
  }

  checkStreams().catch((error) => {
    console.error('[Stream] Erro na verificação inicial:', error);
  });

  setInterval(() => {
    checkStreams().catch((error) => {
      console.error('[Stream] Erro no polling:', error);
    });
  }, POLL_INTERVAL);

  console.log(`[Stream] Polling iniciado para: ${MONITORED_STREAMERS.join(', ')} (intervalo: 60s)`);
}
