import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags,
} from 'discord.js';

/** @type {import('../../@types/command.js').Command} */
export const command = {
  data: new SlashCommandBuilder()
    .setName('stream')
    .setDescription('Gerencia streamers monitorados para notificações de live.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(subcommand =>
      subcommand
        .setName('add')
        .setDescription('Adiciona um streamer da Twitch para monitoramento.')
        .addStringOption(option =>
          option.setName('login')
            .setDescription('Login do canal da Twitch (ex: xstreamer)')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('remove')
        .setDescription('Remove um streamer do monitoramento.')
        .addStringOption(option =>
          option.setName('login')
            .setDescription('Login do canal da Twitch a ser removido')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('Lista todos os streamers sendo monitorados.')
    ),

  botPermissions: [PermissionFlagsBits.SendMessages],

  async execute(interaction) {
    try {
      const subcommand = interaction.options.getSubcommand();

      if (subcommand === 'add') {
        await handleAdd(interaction);
      } else if (subcommand === 'remove') {
        await handleRemove(interaction);
      } else if (subcommand === 'list') {
        await handleList(interaction);
      }
    } catch (error) {
      console.error(`Erro ao executar o comando /stream por ${interaction.user.tag}:`, error);

      const errorMessage = 'Ocorreu um erro ao executar o comando.';
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: errorMessage, flags: MessageFlags.Ephemeral });
      } else {
        await interaction.reply({ content: errorMessage, flags: MessageFlags.Ephemeral });
      }
    }
  },
};

async function handleAdd(interaction) {
  const login = interaction.options.getString('login', true).toLowerCase();

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const exists = await import('../../utils/twitchApi.js').then(m => m.validateStreamerExists(login));
  if (!exists) {
    await interaction.editReply({
      content: `O canal "${login}" não foi encontrado na Twitch. Verifique o login e tente novamente.`,
    });
    return;
  }

  const { addStreamer } = await import('../../utils/streamNotifier.js');
  const added = addStreamer(login);
  if (!added) {
    await interaction.editReply({
      content: `O streamer "${login}" já está sendo monitorado.`,
    });
    return;
  }

  await interaction.editReply({
    content: `Streamer "${login}" adicionado com sucesso! Notificações serão enviadas quando ficar ao vivo.`,
  });
}

async function handleRemove(interaction) {
  const login = interaction.options.getString('login', true).toLowerCase();

  const { removeStreamer } = await import('../../utils/streamNotifier.js');
  const removed = removeStreamer(login);
  if (!removed) {
    await interaction.reply({
      content: `O streamer "${login}" não está sendo monitorado.`,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  await interaction.reply({
    content: `Streamer "${login}" removido do monitoramento.`,
    flags: MessageFlags.Ephemeral,
  });
}

async function handleList(interaction) {
  const { getStreamersList } = await import('../../utils/streamNotifier.js');
  const streamers = getStreamersList();

  if (streamers.length === 0) {
    await interaction.reply({
      content: 'Nenhum streamer está sendo monitorado no momento.',
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const list = streamers.map(s => `• ${s}`).join('\n');
  await interaction.reply({
    content: `**Streamers monitorados (${streamers.length}):**\n${list}`,
    flags: MessageFlags.Ephemeral,
  });
}
