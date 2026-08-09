import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags, EmbedBuilder, ChannelType } from 'discord.js';

/** @type {import('../../@types/command.js').Command} */
export const command = {
  data: new SlashCommandBuilder()
    .setName('regras')
    .setDescription('Envia as regras da comunidade em um canal específico.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addChannelOption(option =>
      option.setName('canal')
        .setDescription('Canal de destino para enviar as regras.')
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
        .setRequired(true)
    ),

  botPermissions: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks],

  async execute(interaction) {
    try {
      const channel = interaction.options.getChannel('canal', true);

      if (!channel || !channel.isTextBased() || channel.isDMBased()) {
        await interaction.reply({
          content: 'O canal selecionado não é um canal de texto válido.',
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

      if (!channelPerms.has(PermissionFlagsBits.EmbedLinks)) {
        await interaction.reply({
          content: 'Não tenho permissão para enviar embeds nesse canal.',
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      const embed = new EmbedBuilder()
        .setTitle(REGRAS_EMBED.title)
        .setDescription(REGRAS_EMBED.description)
        .setColor(0xdc143c)
        .setTimestamp()
        .setFooter({ text: REGRAS_EMBED.footer });

      await channel.send({ embeds: [embed] });

      await interaction.reply({
        content: `Regras enviadas com sucesso em ${channel}.`,
        flags: MessageFlags.Ephemeral,
      });
    } catch (error) {
      console.error(`Erro ao executar o comando /regras por ${interaction.user.tag}:`, error);

      const errorMessage = 'Ocorreu um erro ao tentar enviar as regras.';
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: errorMessage, flags: MessageFlags.Ephemeral });
      } else {
        await interaction.reply({ content: errorMessage, flags: MessageFlags.Ephemeral });
      }
    }
  },
};

const REGRAS_EMBED = {
  title: '🐉 REGRAS DA COMUNIDADE TKS',
  description: `Seja bem-vindo à comunidade **DEXTERRO SC**! 🔥

Este servidor foi criado para reunir a galera das lives, TikTok e demais conteúdos do TKS em um ambiente divertido, amigável e seguro.

Ao permanecer no servidor, você concorda em respeitar estas regras e os Termos de Serviço do Discord.

━━━━━━━━━━━━━━━━━━━━━━

**🛡️ 1. RESPEITO ACIMA DE TUDO**
Trate todos com respeito. Não são permitidos: ofensas, bullying, assédio, perseguição, provocações insistentes ou discriminação. Brincadeiras são bem-vindas, falta de respeito não.

**🚫 2. PRECONCEITO E DISCURSO DE ÓDIO**
Zero tolerância com preconceito ou ataques relacionados a raça, nacionalidade, religião, gênero, orientação sexual, deficiência ou qualquer característica pessoal. Infrações graves podem resultar em punição imediata sem aviso prévio.

**🔞 3. CONTEÚDO IMPRÓPRIO**
Servidor destinado à comunidade. Não envie: pornografia, gore, conteúdo gráfico chocante, conteúdo ilegal ou material que cause desconforto aos membros.

**📢 4. SPAM E DIVULGAÇÃO**
Não envie mensagens repetitivas ou conteúdo para incomodar. Não é permitido: spam, flood, divulgação de servidores/canais/produtos sem autorização, ou links maliciosos. Quer divulgar? Fale com um moderador primeiro.

** 5. USE CADA CANAL PARA SUA FINALIDADE**
Procure o canal adequado antes de enviar mensagens. Evite transformar todos os canais em um segundo chat-geral.

**🎙️ 6. SALAS DE VOZ**
Respeite quem está falando. Evite gritaria, sons irritantes, soundboards para atrapalhar, ou entrar/sair repetidamente. A moderação poderá remover quem estiver atrapalhando a experiência dos demais.

**🍿 7. CINEMA DO DRAGÃO**
Respeite quem está assistindo. Não dê spoilers sem autorização, não interrompa a transmissão, não use o microfone para atrapalhar. Use o canal de chat do cinema para comentar. Após o conteúdo, debata à vontade.

**🎮 8. JOGOS E COMPETITIVIDADE**
Não transforme discussões em ataques pessoais. Sem toxicidade proposicional, trapaças ou atividades ilegais. GG é GG. Perdeu? Respira e tenta de novo. 😂

**🔗 9. LINKS E ARQUIVOS**
Não envie links maliciosos, arquivos suspeitos, phishing ou conteúdo que comprometa a segurança de outros membros. Viu algo suspeito? Não clique e avise um moderador.

**🤖 10. BOTS**
Não abuse ou explore bots de forma a prejudicar o servidor. Não explore vulnerabilidades. Encontrou algum problema? Avise a moderação.

** 11. RESPEITE A MODERAÇÃO**
Os moderadores existem para manter o servidor agradável. Caso discorde de uma decisão, não crie discussões públicas — converse com um moderador de forma privada e respeitosa. Decisões podem ser revistas com justificativa válida.

**⚖️ 12. PUNIÇÕES**
As punições serão aplicadas conforme gravidade e frequência:
🟡 Advertência → 🟠 Timeout →  Expulsão → ⛔ Banimento

Infrações graves podem resultar em banimento imediato. A moderação pode agir em situações que prejudiquem a comunidade mesmo que não estejam descritas literalmente nestas regras.

**🐉 13. BOM SENSO**
Se você sabe que determinada atitude vai estragar a experiência dos outros, provavelmente não deveria fazê-la. Use o bom senso e ajude a manter o servidor como um lugar que todos tenham vontade de frequentar.

━━━━━━━━━━━━━━━━━━━━━━

**🔥 ENTRE, DIVIRTA-SE E FAÇA PARTE DA COMUNIDADE!**

🎮 Jogar • 🍿 Assistir • 😂 Dar risada • 💬 Conversar • 🐉 Fazer amizades • 🔥 Acompanhar o TiTioTKS

**Bem-vindo ao DEXTERRO SC. 🔥**

━━━━━━━━━━━━━━━━━━━━━━

✅ **LIBERAÇÃO DE ACESSO AO SERVIDOR**

Para confirmar que leu e concorda com todas as regras acima, **reaja a esta mensagem com o emoji de check (✅)** para liberar seu acesso completo aos demais canais do servidor!`,
  footer: 'CRIMSON System Logs',
};
