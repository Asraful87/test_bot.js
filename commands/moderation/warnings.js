const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warnings')
        .setDescription('View warnings for a member')
        .addUserOption(option =>
            option.setName('member')
                .setDescription('Member to view warnings for')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction, bot) {
        const member = interaction.options.getMember('member');

        await interaction.deferReply({ ephemeral: true });

        try {
            const warnings = bot.db.getWarnings(interaction.guild.id, member.id);

            if (warnings.length === 0) {
                return interaction.followUp({
                    content: `${member} has no warnings.`,
                    ephemeral: true
                });
            }

            const embed = successEmbed(`Warnings for ${member.user.tag}`, 
                `Total warnings: ${warnings.length}`)
                .setColor('Orange');

            warnings.slice(0, 10).forEach((warning, i) => {
                const modMention = `<@${warning.mod_id}>`;
                embed.addFields({
                    name: `Warning ${i + 1}`,
                    value: `**Reason:** ${warning.reason}\n**By:** ${modMention}\n**Date:** ${warning.timestamp}`,
                    inline: false
                });
            });

            await interaction.followUp({ embeds: [embed] });
        } catch (error) {
            console.error('Warnings command error:', error);
            await interaction.followUp({
                embeds: [errorEmbed('Error', `Failed to fetch warnings: ${error.message}`)],
                ephemeral: true
            });
        }
    }
};
