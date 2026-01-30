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

            // Get the most recent warning (last in array)
            const lastWarning = warnings[warnings.length - 1];

            // Remove the warning from database
            // Note: This requires a removeWarning method in db_manager
            // For now, we'll use clearWarnings and re-add the others
            try {
                bot.db.clearWarnings(interaction.guild.id, member.id);

                // Re-add all warnings except the last one
                for (let i = 0; i < warnings.length - 1; i++) {
                    const w = warnings[i];
                    bot.db.addWarning(
                        interaction.guild.id,
                        member.id,
                        w.moderator_id,
                        w.reason || 'No reason provided'
                    );
                }

                const embed = successEmbed('Warning Removed', 
                    `Removed the most recent warning from ${member}\n` +
                    `**Warning Reason:** ${lastWarning.reason || 'No reason provided'}\n` +
                    `**Issued By:** <@${lastWarning.moderator_id}>\n` +
                    `**Remaining Warnings:** ${warnings.length - 1}`)
                    .setColor('Green');

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
