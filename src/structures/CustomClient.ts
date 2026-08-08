import { Client, Collection, GatewayIntentBits, Partials } from 'discord.js';
import { Command } from '../@types/command';

export class CustomClient extends Client<true> {
  public commands: Collection<string, Command>;

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
