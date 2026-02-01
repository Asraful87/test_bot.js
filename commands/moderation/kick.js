const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');

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
        const member = interaction.options.getMember('member');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        
        if (!member) {
            return interaction.reply({ 
                embeds: [errorEmbed('Error', 'Member not found in this server.')], 
                ephemeral: true 
            });
        }
        
        const target = member.user;

        if (!member.kickable) {
            return interaction.reply({ 
                embeds: [errorEmbed('Error', 'I cannot kick this member.')], 
                ephemeral: true 
            });
        }

        if (member.roles.highest.position >= interaction.member.roles.highest.position) {
            return interaction.reply({ 
                embeds: [errorEmbed('Error', 'You cannot kick a member with equal or higher role.')], 
                ephemeral: true 
            });
        }

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

            await interaction.reply({
                embeds: [successEmbed('Member Kicked', `${target.tag} has been kicked.\n**Reason:** ${reason}`)]
            });
        } catch (error) {
            console.error(error);
            await interaction.reply({ 
                embeds: [errorEmbed('Error', 'Failed to kick member.')], 
                ephemeral: true 
            });
        }
    }
};
