import { TextChannel, EmbedBuilder } from 'discord.js';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getStreamByLogin, getUserByLogin } from './twitchApi';
import { config } from '../config';
import { CustomClient } from '../structures/CustomClient';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_FILE = join(__dirname, '..', 'data', 'streamers.json');

interface StreamersData {
  streamers: string[];
  lastChecked: Record<string, boolean>;
}

function ensureDataFile(): void {
  if (!existsSync(DATA_FILE)) {
    mkdirSync(dirname(DATA_FILE), { recursive: true });
    writeFileSync(DATA_FILE, JSON.stringify({ streamers: [], lastChecked: {} }, null, 2));
  }
}

function loadStreamersData(): StreamersData {
  ensureDataFile();
  const raw = readFileSync(DATA_FILE, 'utf-8');
  return JSON.parse(raw) as StreamersData;
}

function saveStreamersData(data: StreamersData): void {
  ensureDataFile();
  writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

export function addStreamer(login: string): boolean {
  const data = loadStreamersData();
  const normalized = login.toLowerCase();

  if (data.streamers.includes(normalized)) {
    return false;
  }

  data.streamers.push(normalized);
  data.lastChecked[normalized] = false;
  saveStreamersData(data);
  return true;
}

export function removeStreamer(login: string): boolean {
  const data = loadStreamersData();
  const normalized = login.toLowerCase();
  const index = data.streamers.indexOf(normalized);

  if (index === -1) {
    return false;
  }

  data.streamers.splice(index, 1);
  delete data.lastChecked[normalized];
  saveStreamersData(data);
  return true;
}

export function getStreamersList(): string[] {
  const data = loadStreamersData();
  return [...data.streamers];
}

export function startStreamPolling(client: CustomClient): void {
  const POLL_INTERVAL = 60_000;

  async function checkStreams(): Promise<void> {
    if (!config.STREAM_NOTIFICATION_CHANNEL_ID) {
      return;
    }

    const data = loadStreamersData();
    const channel = await client.channels.fetch(config.STREAM_NOTIFICATION_CHANNEL_ID);

    if (!channel || !channel.isTextBased() || channel.isDMBased()) {
      return;
    }

    const textChannel = channel as TextChannel;

    for (const login of data.streamers) {
      try {
        const stream = await getStreamByLogin(login);
        const wasLive = data.lastChecked[login] ?? false;

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

          await textChannel.send({
            content: '@everyone',
            embeds: [embed],
          });

          console.log(`[Stream] Notificação enviada para ${login}`);
        }

        data.lastChecked[login] = stream !== null;
      } catch (error) {
        console.error(`[Stream] Erro ao verificar streamer ${login}:`, error);
      }
    }

    saveStreamersData(data);
  }

  checkStreams().catch((error) => {
    console.error('[Stream] Erro na verificação inicial:', error);
  });

  setInterval(() => {
    checkStreams().catch((error) => {
      console.error('[Stream] Erro no polling:', error);
    });
  }, POLL_INTERVAL);

  console.log('[Stream] Polling iniciado (intervalo: 60s)');
}
