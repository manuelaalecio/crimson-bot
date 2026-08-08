import { SlashCommandBuilder, SlashCommandSubcommandsOnlyBuilder, SlashCommandOptionsOnlyBuilder, ChatInputCommandInteraction, PermissionResolvable } from 'discord.js';

export interface Command {
  data: SlashCommandBuilder | SlashCommandSubcommandsOnlyBuilder | SlashCommandOptionsOnlyBuilder | Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'>;
  userPermissions?: PermissionResolvable[];
  botPermissions?: PermissionResolvable[];
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}
