const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clearwarnings')
        .setDescription('Clear all warnings for a member')
        .addUserOption(option =>
            option.setName('member')
                .setDescription('Member to clear warnings for')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction, bot) {
        const member = interaction.options.getMember('member');

        await interaction.deferReply({ ephemeral: true });

        try {
            const cleared = bot.db.clearWarnings(interaction.guild.id, member.id);

            await interaction.followUp({
                content: `✅ Cleared ${cleared} warning(s) for ${member}.`,
                ephemeral: true
            });
        } catch (error) {
            console.error('Clear warnings command error:', error);
            await interaction.followUp({
                embeds: [errorEmbed('Error', `Failed to clear warnings: ${error.message}`)],
                ephemeral: true
            });
        }
    }
};
