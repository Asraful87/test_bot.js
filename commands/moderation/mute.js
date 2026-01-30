const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mute')
        .setDescription('Mute a member (alias for timeout)')
        .addUserOption(option =>
            option.setName('member')
                .setDescription('Member to mute')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('duration')
                .setDescription('Duration in minutes')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(40320))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for mute')
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
                embeds: [errorEmbed('Error', 'You cannot mute someone with a higher or equal role.')],
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
                    'mute',
                    member.id,
                    interaction.user.id,
                    reason,
                    null,
                    duration
                );
            } catch (err) {
                console.error('Failed to log mute:', err);
            }

            const embed = successEmbed('Member Muted', 
                `🔇 ${member} has been muted for ${duration} minutes.\n**Moderator:** ${interaction.user}\n**Reason:** ${reason}`)
                .setColor('Orange');

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Mute error:', error);
            await interaction.editReply({
                embeds: [errorEmbed('Error', `Failed to mute member: ${error.message}`)]
            });
        }
    }
};
