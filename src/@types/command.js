/**
 * @typedef {Object} Command
 * @property {import('discord.js').SlashCommandBuilder | import('discord.js').SlashCommandSubcommandsOnlyBuilder | import('discord.js').SlashCommandOptionsOnlyBuilder | Omit<import('discord.js').SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'>} data
 * @property {import('discord.js').PermissionResolvable[]} [userPermissions]
 * @property {import('discord.js').PermissionResolvable[]} [botPermissions]
 * @property {(interaction: import('discord.js').ChatInputCommandInteraction) => Promise<void>} execute
 */
