import { Client, Collection, GatewayIntentBits, Partials } from 'discord.js';

export class CustomClient extends Client {
  /** @type {Collection<string, import('../@types/command.js').Command>} */
  commands;

  constructor() {
    super({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions,
      ],
      partials: [
        Partials.Message,
        Partials.Channel,
        Partials.Reaction,
      ],
    });

    this.commands = new Collection();
  }
}
