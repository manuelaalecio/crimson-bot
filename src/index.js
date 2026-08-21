import { readdirSync } from 'node:fs';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Events, MessageFlags, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { CustomClient } from './structures/CustomClient.js';
import { config } from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const client = new CustomClient();

async function loadCommands() {
  const commandsPath = join(__dirname, 'commands');
  const categories = readdirSync(commandsPath, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

  for (const category of categories) {
    const categoryPath = join(commandsPath, category);
    const commandFiles = readdirSync(categoryPath).filter((file) => /\.(js|ts)$/.test(file));

    for (const file of commandFiles) {
      const filePath = join(categoryPath, file);
      const module = await import(filePath);
      const cmd = module.command;

      if (!cmd?.data?.name) {
        console.warn(`[Commands] Comando em ${filePath} ignorado: falta 'data.name'.`);
        continue;
      }

      client.commands.set(cmd.data.name, cmd);
      console.log(`[Commands] Carregado: /${cmd.data.name}`);
    }
  }
}

async function loadEvents() {
  const eventsPath = join(__dirname, 'events');
  const eventFiles = readdirSync(eventsPath).filter((file) => /\.(js|ts)$/.test(file));

  for (const file of eventFiles) {
    const filePath = join(eventsPath, file);
    const module = await import(filePath);

    if (typeof module.register === 'function') {
      module.register(client);
      console.log(`[Events] Registrado: ${file}`);
    }
  }
}

client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isModalSubmit()) {
    if (interaction.customId === 'say-texto' || interaction.customId === 'say-embed') {
      await handleSayModal(interaction);
      return;
    }
    return;
  }

  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    if (command.userPermissions) {
      const member = await interaction.guild?.members.fetch(interaction.user.id);
      if (member) {
        const missing = command.userPermissions.filter(
          (perm) => !member.permissions.has(perm),
        );
        if (missing.length > 0) {
          await interaction.reply({
            content: 'Você não possui permissão para executar este comando.',
            flags: 64,
          });
          return;
        }
      }
    }

    if (command.botPermissions) {
      const me = interaction.guild?.members.me;
      if (me) {
        const missing = command.botPermissions.filter(
          (perm) => !me.permissions.has(perm),
        );
        if (missing.length > 0) {
          await interaction.reply({
            content: 'O bot não possui permissão para executar este comando.',
            flags: 64,
          });
          return;
        }
      }
    }

    await command.execute(interaction);
  } catch (error) {
    console.error(`Erro ao processar interação /${interaction.commandName}:`, error);

    const reply = { content: 'Ocorreu um erro ao executar este comando.', flags: 64 };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(reply);
    } else {
      await interaction.reply(reply);
    }
  }
});

async function handleSayModal(interaction) {
  try {
    const channelId = interaction.fields.getTextInputValue('canal_id').trim();
    const channel = await interaction.client.channels.fetch(channelId);

    if (!channel || !channel.isTextBased() || channel.isDMBased()) {
      await interaction.reply({
        content: 'ID de canal inválido ou canal não é um canal de texto.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const botMember = interaction.guild?.members.me;

    if (!botMember) {
      await interaction.reply({
        content: 'Não foi possível verificar as permissões do bot.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const channelPerms = channel.permissionsFor(botMember);
    if (!channelPerms?.has(PermissionFlagsBits.SendMessages)) {
      await interaction.reply({
        content: 'Não tenho permissão para enviar mensagens nesse canal.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (interaction.customId === 'say-texto') {
      const mensagem = interaction.fields.getTextInputValue('mensagem');
      await channel.send(mensagem);

      await interaction.reply({
        content: `Mensagem enviada com sucesso em ${channel}.`,
        flags: MessageFlags.Ephemeral,
      });
    } else if (interaction.customId === 'say-embed') {
      const titulo = interaction.fields.getTextInputValue('titulo');
      const descricao = interaction.fields.getTextInputValue('descricao');
      const corInput = interaction.fields.getTextInputValue('cor');
      const footer = interaction.fields.getTextInputValue('footer');

      if (!channelPerms.has(PermissionFlagsBits.EmbedLinks)) {
        await interaction.reply({
          content: 'Não tenho permissão para enviar embeds nesse canal.',
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      let cor = 0xdc143c;
      if (corInput) {
        const cleaned = corInput.replace('#', '').trim();
        const parsed = parseInt(cleaned, 16);
        if (!isNaN(parsed) && cleaned.length >= 3 && cleaned.length <= 6) {
          cor = parsed;
        }
      }

      const embed = new EmbedBuilder()
        .setTitle(titulo)
        .setDescription(descricao)
        .setColor(cor)
        .setTimestamp();

      if (footer) {
        embed.setFooter({ text: footer });
      }

      await channel.send({ embeds: [embed] });

      await interaction.reply({
        content: `Embed enviada com sucesso em ${channel}.`,
        flags: MessageFlags.Ephemeral,
      });
    }
  } catch (error) {
    console.error(`Erro ao processar modal say por ${interaction.user.tag}:`, error);

    const errorMessage = 'Ocorreu um erro ao processar o formulário.';
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: errorMessage, flags: MessageFlags.Ephemeral });
    } else {
      await interaction.reply({ content: errorMessage, flags: MessageFlags.Ephemeral });
    }
  }
}

async function main() {
  await loadCommands();
  await loadEvents();

  await client.login(config.DISCORD_TOKEN);
}

async function sendErrorLog(error, context) {
  if (!config.LOGS_CHANNEL_ID) return;

  try {
    const channel = await client.channels.fetch(config.LOGS_CHANNEL_ID);
    if (!channel || !channel.isTextBased() || channel.isDMBased()) return;

    const message = String(error?.stack || error || 'Erro desconhecido');
    const truncated = message.length > 1900 ? message.slice(0, 1900) + '...' : message;

    await channel.send(
      `<@${config.ERROR_REPORT_USER_ID}> **CRIMSON - Erro ${context}:**\n` +
      '```js\n' + truncated + '\n```'
    );
  } catch (e) {
    console.error('[Logs] Falha ao enviar erro:', e);
  }
}

process.on('unhandledRejection', (reason, promise) => {
  console.error('[CRIMSON] Unhandled Rejection:', reason);
  sendErrorLog(reason, 'Unhandled Rejection');
});

process.on('uncaughtException', (error) => {
  console.error('[CRIMSON] Uncaught Exception:', error);
  sendErrorLog(error, 'Uncaught Exception').finally(() => {
    process.exit(1);
  });
});

main().catch((error) => {
  console.error('[CRIMSON] Erro fatal na inicialização:', error);
  process.exit(1);
});
