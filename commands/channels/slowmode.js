const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('slowmode')
        .setDescription('Set slowmode for a channel')
        .addIntegerOption(option =>
            option.setName('seconds')
                .setDescription('Slowmode delay in seconds (0 to disable, max 21600)')
                .setRequired(true)
                .setMinValue(0)
                .setMaxValue(21600))
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Channel to set slowmode for (defaults to current channel)')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    async execute(interaction, bot) {
        const seconds = interaction.options.getInteger('seconds');
        const channel = interaction.options.getChannel('channel') || interaction.channel;

        try {
            await channel.setRateLimitPerUser(seconds);

            if (seconds === 0) {
                await interaction.reply({
                    embeds: [successEmbed('Slowmode Disabled', `Slowmode disabled in ${channel}.`)]
                });
            } else {
                await interaction.reply({
                    embeds: [successEmbed('Slowmode Set', `Slowmode set to ${seconds} seconds in ${channel}.`)]
                });
            }
        } catch (error) {
            console.error('Slowmode error:', error);
            await interaction.reply({
                embeds: [errorEmbed('Error', `Failed to set slowmode: ${error.message}`)],
                ephemeral: true
            });
        }
    }
};
