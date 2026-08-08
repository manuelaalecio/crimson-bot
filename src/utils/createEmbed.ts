import { EmbedBuilder } from 'discord.js';

export function createEmbed(): EmbedBuilder {
  return new EmbedBuilder()
    .setTimestamp()
    .setFooter({ text: 'CRIMSON System Logs' });
}
