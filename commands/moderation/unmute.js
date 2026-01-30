const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unmute')
        .setDescription('Unmute a member (alias for untimeout)')
        .addUserOption(option =>
            option.setName('member')
                .setDescription('Member to unmute')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for unmute')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction, bot) {
        const member = interaction.options.getMember('member');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        await interaction.deferReply({ ephemeral: true });

        try {
            await member.timeout(null, `${reason} | By ${interaction.user.tag}`);

            // Log to database
            try {
                bot.db.logAction(
                    interaction.guild.id,
                    'unmute',
                    member.id,
                    interaction.user.id,
                    reason
                );
            } catch (err) {
                console.error('Failed to log unmute:', err);
            }

            const embed = successEmbed('Member Unmuted', 
                `🔊 ${member} has been unmuted.\n**Moderator:** ${interaction.user}\n**Reason:** ${reason}`)
                .setColor('Green');

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Unmute error:', error);
            await interaction.editReply({
                embeds: [errorEmbed('Error', `Failed to unmute member: ${error.message}`)]
            });
        }
    }
};
