const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('timeout')
        .setDescription('Timeout a member (mute)')
        .addUserOption(option =>
            option.setName('member')
                .setDescription('Member to timeout')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('duration')
                .setDescription('Duration in minutes')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(40320))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for timeout')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction, bot) {
        const member = interaction.options.getMember('member');
        const duration = interaction.options.getInteger('duration');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        // Permission checks
        if (member.roles.highest.position >= interaction.member.roles.highest.position && 
            interaction.guild.ownerId !== interaction.user.id) {
            return interaction.reply({
                embeds: [errorEmbed('Error', 'You cannot timeout someone with a higher or equal role.')],
                ephemeral: true
            });
        }

        await interaction.deferReply({ ephemeral: true });

        try {
            await member.timeout(duration * 60 * 1000, `${reason} | By ${interaction.user.tag}`);

            // Log to database
            try {
                bot.db.logAction(
                    interaction.guild.id,
                    'timeout',
                    member.id,
                    interaction.user.id,
                    reason,
                    null,
                    duration
                );
            } catch (err) {
                console.error('Failed to log timeout:', err);
            }

            const embed = successEmbed('Member Timed Out', 
                `${member} has been timed out for ${duration} minutes.\n**Moderator:** ${interaction.user}\n**Reason:** ${reason}`)
                .setColor('Orange');

            await interaction.followUp({ embeds: [embed] });
        } catch (error) {
            console.error('Timeout command error:', error);
            await interaction.followUp({
                embeds: [errorEmbed('Error', `Failed to timeout: ${error.message}`)],
                ephemeral: true
            });
        }
    }
};
