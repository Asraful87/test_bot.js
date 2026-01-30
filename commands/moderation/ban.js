const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Ban a member from the server')
        .addUserOption(option =>
            option.setName('member')
                .setDescription('The member to ban')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for banning')
                .setRequired(false))
        .addIntegerOption(option =>
            option.setName('delete_days')
                .setDescription('Number of days of messages to delete (0-7)')
                .setMinValue(0)
                .setMaxValue(7)
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

    async execute(interaction, bot) {
        const target = interaction.options.getUser('member');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        const deleteDays = interaction.options.getInteger('delete_days') || 0;
        const member = interaction.guild.members.cache.get(target.id);

        if (member) {
            if (!member.bannable) {
                return interaction.reply({ 
                    embeds: [errorEmbed('Error', 'I cannot ban this member.')], 
                    ephemeral: true 
                });
            }

            if (member.roles.highest.position >= interaction.member.roles.highest.position) {
                return interaction.reply({ 
                    embeds: [errorEmbed('Error', 'You cannot ban a member with equal or higher role.')], 
                    ephemeral: true 
                });
            }
        }

        try {
            await interaction.guild.members.ban(target.id, {
                deleteMessageSeconds: deleteDays * 24 * 60 * 60,
                reason: reason
            });

            // Log to database
            bot.db.logAction(
                interaction.guild.id,
                'ban',
                target.id,
                interaction.user.id,
                reason,
                { delete_days: deleteDays }
            );

            await interaction.reply({
                embeds: [successEmbed('Member Banned', `${target.tag} has been banned.\n**Reason:** ${reason}`)]
            });
        } catch (error) {
            console.error(error);
            await interaction.reply({ 
                embeds: [errorEmbed('Error', 'Failed to ban member.')], 
                ephemeral: true 
            });
        }
    }
};
