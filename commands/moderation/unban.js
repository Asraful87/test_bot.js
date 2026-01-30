const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unban')
        .setDescription('Unban a user by their user ID')
        .addStringOption(option =>
            option.setName('user_id')
                .setDescription('User ID to unban')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

    async execute(interaction, bot) {
        const userId = interaction.options.getString('user_id');
        const cleaned = userId.trim().replace(/<@!?/g, '').replace(/>/g, '');

        if (!/^\d+$/.test(cleaned)) {
            return interaction.reply({
                embeds: [errorEmbed('Error', 'Please provide a valid user ID.')],
                ephemeral: true
            });
        }

        await interaction.deferReply({ ephemeral: true });

        try {
            const user = await bot.users.fetch(cleaned);
            await interaction.guild.members.unban(user);

            // Log to database
            try {
                bot.db.logAction(
                    interaction.guild.id,
                    'unban',
                    user.id,
                    interaction.user.id,
                    null
                );
            } catch (err) {
                console.error('Failed to log unban:', err);
            }

            const embed = successEmbed('User Unbanned', 
                `${user.tag} has been unbanned.\n**Moderator:** ${interaction.user}`);

            await interaction.followUp({ embeds: [embed] });
        } catch (error) {
            if (error.code === 10026) {
                return interaction.followUp({
                    embeds: [errorEmbed('Error', 'User not found or not banned.')],
                    ephemeral: true
                });
            }
            return interaction.followUp({
                embeds: [errorEmbed('Error', `Failed to unban: ${error.message}`)],
                ephemeral: true
            });
        }
    }
};
