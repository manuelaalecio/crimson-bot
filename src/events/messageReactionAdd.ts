import { Events, TextChannel, ChannelType } from 'discord.js';
import { CustomClient } from '../structures/CustomClient';
import { config } from '../config';
import { createEmbed } from '../utils/createEmbed';

export function register(client: CustomClient): void {
  client.on(Events.MessageReactionAdd, async (reaction, user) => {
    if (!config.REACTION_ROLE_MESSAGE_ID || !config.REACTION_ROLE_ID) return;
    if (user.bot) return;

    try {
      if (reaction.partial) {
        await reaction.fetch();
      }

      if (reaction.message.id !== config.REACTION_ROLE_MESSAGE_ID) return;
      if (reaction.emoji.name !== '✅') return;

      const guild = reaction.message.guild;
      if (!guild) return;

      const member = await guild.members.fetch(user.id);
      const role = await guild.roles.fetch(config.REACTION_ROLE_ID);

      if (!role) {
        console.error(`[ReactionRole] Role com ID ${config.REACTION_ROLE_ID} não encontrada.`);
        return;
      }

      await member.roles.add(role);
      console.log(`[ReactionRole] Role '${role.name}' atribuída a ${user.tag}.`);

      if (!config.WELCOME_CHANNEL_ID) return;

      const welcomeChannel = await guild.channels.fetch(config.WELCOME_CHANNEL_ID);

      if (!welcomeChannel || welcomeChannel.type !== ChannelType.GuildText) {
        console.error(`[ReactionRole] Canal de boas-vindas inválido ou não encontrado.`);
        return;
      }

      const embed = createEmbed()
        .setColor(0xdc143c)
        .setTitle('Bem-vindo(a) ao servidor!')
        .setDescription(`Seja bem-vindo(a), ${member}! Aproveite sua estadia conosco.`);

      await welcomeChannel.send({ embeds: [embed] });
    } catch (error) {
      console.error(`[ReactionRole] Erro ao atribuir role a ${user.tag}:`, error);
    }
  });
}
