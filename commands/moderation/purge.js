const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('purge')
        .setDescription('Delete messages in bulk')
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Number of messages to delete (1-100)')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(100))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    async execute(interaction, bot) {
        const amount = interaction.options.getInteger('amount');

        const moderationConfig = bot?.config?.moderation || {};
        const maxPurge = Number.isFinite(Number(moderationConfig.max_purge_amount))
            ? Number(moderationConfig.max_purge_amount)
            : 100;

        if (maxPurge > 0 && amount > maxPurge) {
            return interaction.reply({
                embeds: [errorEmbed('Error', `Max purge amount is ${maxPurge} messages.`)],
                ephemeral: true
            });
        }

        await interaction.deferReply({ ephemeral: true });

        try {
            const deleted = await interaction.channel.bulkDelete(amount, true);

            await interaction.followUp({
                content: `✅ Successfully deleted ${deleted.size} message(s).`,
                ephemeral: true
            });

            // Log to database
            try {
                bot.db.logAction(
                    interaction.guild.id,
                    'purge',
                    interaction.channel.id,
                    interaction.user.id,
                    `Deleted ${deleted.size} messages`
                );
            } catch (err) {
                console.error('Failed to log purge:', err);
            }
        } catch (error) {
            console.error('Purge command error:', error);
            await interaction.followUp({
                embeds: [errorEmbed('Error', `Failed to delete messages: ${error.message}`)],
                ephemeral: true
            });
        }
    }
};
