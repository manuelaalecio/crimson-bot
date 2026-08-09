import { EmbedBuilder } from 'discord.js';

export function createEmbed() {
  return new EmbedBuilder()
    .setTimestamp()
    .setFooter({ text: 'CRIMSON System Logs' });
}
