const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unwarn')
        .setDescription('Remove the most recent warning from a member')
        .addUserOption(option =>
            option.setName('member')
                .setDescription('Member to remove warning from')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction, bot) {
        const member = interaction.options.getMember('member');

        await interaction.deferReply({ ephemeral: true });

        try {
            // Get warnings
            const warnings = bot.db.getWarnings(interaction.guild.id, member.id);

            if (!warnings || warnings.length === 0) {
                return interaction.editReply({
                    embeds: [errorEmbed('No Warnings', `${member} has no warnings to remove.`)]
                });
            }

            // getWarnings() orders timestamp DESC, so most recent is first
            const lastWarning = warnings[0];

            try {
                const removed = bot.db.removeWarningById(interaction.guild.id, lastWarning.id);
                if (!removed) {
                    throw new Error('Warning was not removed (already inactive?)');
                }

                const remaining = bot.db.getWarningCount(interaction.guild.id, member.id);

                const embed = successEmbed(
                    'Warning Removed',
                    `Removed the most recent warning from ${member}\n` +
                    `**Warning Reason:** ${lastWarning.reason || 'No reason provided'}\n` +
                    `**Issued By:** <@${lastWarning.mod_id}>\n` +
                    `**Remaining Warnings:** ${remaining}`
                ).setColor('Green');

                await interaction.editReply({ embeds: [embed] });
            } catch (dbError) {
                console.error('Database error:', dbError);
                throw new Error('Failed to remove warning from database');
            }
        } catch (error) {
            console.error('Unwarn error:', error);
            await interaction.editReply({
                embeds: [errorEmbed('Error', `Failed to remove warning: ${error.message}`)]
            });
        }
    }
};
