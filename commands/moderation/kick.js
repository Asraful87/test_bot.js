const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');
const { safeReply, safeError } = require('../../utils/respond');
const { requireGuild, requireUserPerms, requireBotPerms, roleHierarchyCheck, isKickable } = require('../../utils/permissions');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Kick a member from the server')
        .addUserOption(option =>
            option.setName('member')
                .setDescription('The member to kick')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for kicking')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

    async execute(interaction, bot) {
        // Validation using permission helpers
        if (!requireGuild(interaction)) return;
        if (!requireUserPerms(interaction, [PermissionFlagsBits.KickMembers], 'kick members')) return;
        if (!requireBotPerms(interaction, [PermissionFlagsBits.KickMembers], 'kick members')) return;

        const member = interaction.options.getMember('member');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        
        if (!member) {
            return interaction.reply({ 
                embeds: [errorEmbed('Error', 'Member not found in this server.')], 
                ephemeral: true 
            });
        }
        
        const target = member.user;

        if (!isKickable(member)) {
            return interaction.reply({ 
                embeds: [errorEmbed('Error', 'I cannot kick this member. They may have a higher role than me.')], 
                ephemeral: true 
            });
        }

        if (!roleHierarchyCheck(interaction, member, 'kick')) return;

        try {
            await member.kick(reason);

            // Log to database
            bot.db.logAction(
                interaction.guild.id,
                'kick',
                target.id,
                interaction.user.id,
                reason
            );

            await safeReply(interaction, {
                embeds: [successEmbed('Member Kicked', `${target.tag} has been kicked.\n**Reason:** ${reason}`)]
            });
        } catch (error) {
            await safeError(interaction, error, 'Failed to kick member');
        }
    }
};
