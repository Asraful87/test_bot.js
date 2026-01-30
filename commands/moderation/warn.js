const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Warn a member')
        .addUserOption(option =>
            option.setName('member')
                .setDescription('The member to warn')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for warning')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction, bot) {
        const target = interaction.options.getUser('member');
        const reason = interaction.options.getString('reason');
        const member = interaction.guild.members.cache.get(target.id);

        if (!member) {
            return interaction.reply({ 
                embeds: [errorEmbed('Error', 'Member not found in this server.')], 
                ephemeral: true 
            });
        }

        try {
            // Add warning to database
            const warningId = bot.db.addWarning(
                interaction.guild.id,
                target.id,
                interaction.user.id,
                reason
            );

            // Log action
            bot.db.logAction(
                interaction.guild.id,
                'warn',
                target.id,
                interaction.user.id,
                reason
            );

            const warningCount = bot.db.getWarningCount(interaction.guild.id, target.id);

            await interaction.reply({
                embeds: [successEmbed(
                    'Member Warned',
                    `${target.tag} has been warned.\n**Reason:** ${reason}\n**Total Warnings:** ${warningCount}`
                )]
            });

            // Try to DM the user
            try {
                await target.send(`You have been warned in **${interaction.guild.name}**\n**Reason:** ${reason}\n**Total Warnings:** ${warningCount}`);
            } catch (error) {
                // User has DMs disabled
            }
        } catch (error) {
            console.error(error);
            await interaction.reply({ 
                embeds: [errorEmbed('Error', 'Failed to warn member.')], 
                ephemeral: true 
            });
        }
    }
};
