const { SlashCommandBuilder } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');

// Import queue from play.js
const queues = new Map();

function getQueue(guildId) {
    if (!queues.has(guildId)) {
        queues.set(guildId, {
            songs: [],
            current: null,
            player: null,
            connection: null,
            loopMode: false
        });
    }
    return queues.get(guildId);
}

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

        if (!queue.connection) {
            return interaction.reply({
                embeds: [errorEmbed('Error', 'Not connected to a voice channel!')],
                ephemeral: true
            });
        }

        if (!queue.current) {
            return interaction.reply({
                embeds: [errorEmbed('Error', 'Nothing is playing!')],
                ephemeral: true
            });
        }

        try {
            // Convert percentage to decimal for audio resource
            const volumeDecimal = volume / 100;
            
            // Set volume on the audio resource if available
            if (queue.current.resource && queue.current.resource.volume) {
                queue.current.resource.volume.setVolume(volumeDecimal);
            }

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
