import { SlashCommandBuilder, ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { Command } from '../../@types/command';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Verifica a latência do bot.'),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    try {
      const sent = await interaction.reply({
        content: 'Calculando...',
        flags: MessageFlags.Ephemeral,
        fetchReply: true,
      });

      const latency = sent.createdTimestamp - interaction.createdTimestamp;
      const wsPing = Math.round(interaction.client.ws.ping);

      await interaction.editReply({
        content: `Pong! Latência da API: ${latency}ms | WebSocket: ${wsPing}ms`,
      });
    } catch (error) {
      console.error(`Erro ao executar o comando /ping por ${interaction.user.tag}:`, error);

      const errorMessage = 'Ocorreu um erro ao calcular o ping.';
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: errorMessage, flags: MessageFlags.Ephemeral });
      } else {
        await interaction.reply({ content: errorMessage, flags: MessageFlags.Ephemeral });
      }
    }
  },
};
