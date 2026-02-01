const { SlashCommandBuilder } = require('discord.js');
const { AudioPlayerStatus } = require('@discordjs/voice');
const { successEmbed, errorEmbed } = require('../../utils/embeds');

const { getQueue } = require('../../utils/music_state');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('volume')
        .setDescription('Set the music volume (0-100)')
        .addIntegerOption(option =>
            option.setName('level')
                .setDescription('Volume level (0-100)')
                .setRequired(true)
                .setMinValue(0)
                .setMaxValue(100)),

    async execute(interaction, bot) {
        const queue = getQueue(interaction.guild.id);
        const volume = interaction.options.getInteger('level');

        if (!queue.connection || !queue.player) {
            return interaction.reply({
                embeds: [errorEmbed('Error', 'Not connected to a voice channel!')],
                ephemeral: true
            });
        }

        if (queue.player.state.status === AudioPlayerStatus.Idle) {
            return interaction.reply({
                embeds: [errorEmbed('Error', 'Nothing is playing!')],
                ephemeral: true
            });
        }

        try {
            // Convert percentage to decimal for audio resource
            const volumeDecimal = volume / 100;
            
            const resource = queue.player.state.resource;
            if (!resource || !resource.volume) {
                return interaction.reply({
                    embeds: [errorEmbed('Error', 'Volume control is not available for the current stream.')],
                    ephemeral: true
                });
            }

            resource.volume.setVolume(volumeDecimal);

            await interaction.reply({
                embeds: [successEmbed('Volume Changed', `🔊 Volume set to **${volume}%**`)]
            });
        } catch (error) {
            console.error('Volume error:', error);
            await interaction.reply({
                embeds: [errorEmbed('Error', 'Failed to change volume. This feature may not be supported with the current audio setup.')],
                ephemeral: true
            });
        }
    }
};
