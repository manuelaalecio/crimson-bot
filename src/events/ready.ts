import { Events, REST, Routes } from 'discord.js';
import { CustomClient } from '../structures/CustomClient';
import { config } from '../config';

export function register(client: CustomClient): void {
  client.on(Events.ClientReady, async () => {
    console.log(`[CRIMSON] Online como ${client.user.tag}`);

    const rest = new REST().setToken(config.DISCORD_TOKEN);

    const commandsData = client.commands.map((cmd) => cmd.data.toJSON());

    try {
      await rest.put(Routes.applicationGuildCommands(config.CLIENT_ID, config.GUILD_ID), {
        body: commandsData,
      });

      console.log(`[CRIMSON] ${commandsData.length} slash command(s) registrado(s) na guild.`);
    } catch (error) {
      console.error('[CRIMSON] Erro ao registrar comandos:', error);
    }
  });
}
