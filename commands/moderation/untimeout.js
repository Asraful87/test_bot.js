const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('untimeout')
        .setDescription('Remove timeout from a member')
        .addUserOption(option =>
            option.setName('member')
                .setDescription('Member to remove timeout from')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction, bot) {
        const user = interaction.options.getUser('member');
        const member = await interaction.guild.members.fetch(user.id);

        await interaction.deferReply({ ephemeral: true });

        try {
            await member.timeout(null, `Timeout removed by ${interaction.user.tag}`);

            // Log to database
            try {
                bot.db.logAction(
                    interaction.guild.id,
                    'untimeout',
                    member.id,
                    interaction.user.id,
                    'Timeout removed'
                );
            } catch (err) {
                console.error('Failed to log untimeout:', err);
            }

            const embed = successEmbed('Timeout Removed', 
                `${member} timeout has been removed.\n**Moderator:** ${interaction.user}`);

            await interaction.followUp({ embeds: [embed] });
        } catch (error) {
            console.error('Untimeout command error:', error);
            await interaction.followUp({
                embeds: [errorEmbed('Error', `Failed to remove timeout: ${error.message}`)],
                ephemeral: true
            });
        }
    }
};
