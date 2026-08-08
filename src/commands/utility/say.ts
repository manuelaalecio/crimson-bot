import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, MessageFlags, TextChannel, EmbedBuilder, ChannelType, Channel } from 'discord.js';
import { Command } from '../../@types/command';

async function validateChannel(interaction: ChatInputCommandInteraction): Promise<TextChannel | null> {
  const channel = interaction.options.getChannel('canal', true) as Channel;

  if (!channel || !channel.isTextBased() || channel.isDMBased()) {
    await interaction.reply({
      content: 'O canal selecionado não é um canal de texto válido.',
      flags: MessageFlags.Ephemeral,
    });
    return null;
  }

  const textChannel = channel as TextChannel;
  const botMember = interaction.guild?.members.me;

  if (!botMember) {
    await interaction.reply({
      content: 'Não foi possível verificar as permissões do bot.',
      flags: MessageFlags.Ephemeral,
    });
    return null;
  }

  const channelPerms = textChannel.permissionsFor(botMember);
  if (!channelPerms?.has(PermissionFlagsBits.SendMessages)) {
    await interaction.reply({
      content: 'Não tenho permissão para enviar mensagens nesse canal.',
      flags: MessageFlags.Ephemeral,
    });
    return null;
  }

  return textChannel;
}

function parseColor(input: string | null): number {
  if (!input) return 0xdc143c;
  const cleaned = input.replace('#', '').trim();
  const parsed = parseInt(cleaned, 16);
  if (!isNaN(parsed) && cleaned.length >= 3 && cleaned.length <= 6) {
    return parsed;
  }
  return 0xdc143c;
}

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('say')
    .setDescription('Envia uma mensagem ou embed em um canal específico.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addSubcommand(subcommand =>
      subcommand
        .setName('texto')
        .setDescription('Abre um formulário para enviar mensagem de texto.')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('embed')
        .setDescription('Abre um formulário para enviar uma embed formatada.')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('texto-simples')
        .setDescription('Envia uma mensagem de texto rápido.')
        .addChannelOption(option =>
          option.setName('canal')
            .setDescription('Canal de destino.')
            .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
            .setRequired(true)
        )
        .addStringOption(option =>
          option.setName('mensagem')
            .setDescription('Conteúdo da mensagem.')
            .setRequired(true)
            .setMaxLength(2000)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('embed-simples')
        .setDescription('Envia uma embed rápida.')
        .addChannelOption(option =>
          option.setName('canal')
            .setDescription('Canal de destino.')
            .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
            .setRequired(true)
        )
        .addStringOption(option =>
          option.setName('titulo')
            .setDescription('Título da embed.')
            .setRequired(true)
            .setMaxLength(256)
        )
        .addStringOption(option =>
          option.setName('descricao')
            .setDescription('Descrição da embed.')
            .setRequired(true)
            .setMaxLength(4096)
        )
        .addStringOption(option =>
          option.setName('cor')
            .setDescription('Cor em hex (ex: dc143c). Padrão: crimson.')
            .setRequired(false)
        )
        .addStringOption(option =>
          option.setName('footer')
            .setDescription('Texto do rodapé.')
            .setRequired(false)
            .setMaxLength(2048)
        )
    ),

  botPermissions: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks],

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    try {
      const subcommand = interaction.options.getSubcommand();

      if (subcommand === 'texto') {
        const modal = new ModalBuilder()
          .setCustomId('say-texto')
          .setTitle('Enviar Mensagem de Texto');

        const canalInput = new TextInputBuilder()
          .setCustomId('canal_id')
          .setLabel('ID do canal de destino')
          .setPlaceholder('Cole o ID do canal aqui')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(30);

        const mensagemInput = new TextInputBuilder()
          .setCustomId('mensagem')
          .setLabel('Conteúdo da mensagem')
          .setPlaceholder('Cole ou digite a mensagem aqui. Suporta quebras de linha.')
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true)
          .setMaxLength(4000);

        modal.addComponents(
          new ActionRowBuilder<TextInputBuilder>().addComponents(canalInput),
          new ActionRowBuilder<TextInputBuilder>().addComponents(mensagemInput),
        );

        await interaction.showModal(modal);
      } else if (subcommand === 'embed') {
        const modal = new ModalBuilder()
          .setCustomId('say-embed')
          .setTitle('Enviar Embed');

        const canalInput = new TextInputBuilder()
          .setCustomId('canal_id')
          .setLabel('ID do canal de destino')
          .setPlaceholder('Cole o ID do canal aqui')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(30);

        const tituloInput = new TextInputBuilder()
          .setCustomId('titulo')
          .setLabel('Título da embed')
          .setPlaceholder('Título')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(256);

        const descricaoInput = new TextInputBuilder()
          .setCustomId('descricao')
          .setLabel('Descrição da embed')
          .setPlaceholder('Cole ou digite a descrição aqui. Suporta quebras de linha.')
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true)
          .setMaxLength(4000);

        const corInput = new TextInputBuilder()
          .setCustomId('cor')
          .setLabel('Cor (hex, opcional)')
          .setPlaceholder('Ex: dc143c ou #dc143c')
          .setStyle(TextInputStyle.Short)
          .setRequired(false)
          .setMaxLength(10);

        const footerInput = new TextInputBuilder()
          .setCustomId('footer')
          .setLabel('Footer (opcional)')
          .setPlaceholder('Texto do rodapé')
          .setStyle(TextInputStyle.Short)
          .setRequired(false)
          .setMaxLength(2048);

        modal.addComponents(
          new ActionRowBuilder<TextInputBuilder>().addComponents(canalInput),
          new ActionRowBuilder<TextInputBuilder>().addComponents(tituloInput),
          new ActionRowBuilder<TextInputBuilder>().addComponents(descricaoInput),
          new ActionRowBuilder<TextInputBuilder>().addComponents(corInput),
          new ActionRowBuilder<TextInputBuilder>().addComponents(footerInput),
        );

        await interaction.showModal(modal);
      } else if (subcommand === 'texto-simples') {
        const textChannel = await validateChannel(interaction);
        if (!textChannel) return;

        const mensagem = interaction.options.getString('mensagem', true);
        await textChannel.send(mensagem);

        await interaction.reply({
          content: `Mensagem enviada com sucesso em ${textChannel}.`,
          flags: MessageFlags.Ephemeral,
        });
      } else if (subcommand === 'embed-simples') {
        const textChannel = await validateChannel(interaction);
        if (!textChannel) return;

        const channelPerms = textChannel.permissionsFor(interaction.guild!.members.me!);
        if (!channelPerms.has(PermissionFlagsBits.EmbedLinks)) {
          await interaction.reply({
            content: 'Não tenho permissão para enviar embeds nesse canal.',
            flags: MessageFlags.Ephemeral,
          });
          return;
        }

        const titulo = interaction.options.getString('titulo', true);
        const descricao = interaction.options.getString('descricao', true);
        const corInput = interaction.options.getString('cor');
        const footer = interaction.options.getString('footer');

        const cor = parseColor(corInput);

        const embed = new EmbedBuilder()
          .setTitle(titulo)
          .setDescription(descricao)
          .setColor(cor)
          .setTimestamp();

        if (footer) {
          embed.setFooter({ text: footer });
        }

        await textChannel.send({ embeds: [embed] });

        await interaction.reply({
          content: `Embed enviada com sucesso em ${textChannel}.`,
          flags: MessageFlags.Ephemeral,
        });
      }
    } catch (error) {
      console.error(`Erro ao executar o comando /say por ${interaction.user.tag}:`, error);

      const errorMessage = 'Ocorreu um erro ao executar o comando.';
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: errorMessage, flags: MessageFlags.Ephemeral });
      } else {
        await interaction.reply({ content: errorMessage, flags: MessageFlags.Ephemeral });
      }
    }
  },
};
