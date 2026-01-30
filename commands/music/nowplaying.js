const { SlashCommandBuilder } = require('discord.js');
const { AudioPlayerStatus } = require('@discordjs/voice');
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

function formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('nowplaying')
        .setDescription('Show the currently playing song'),

    async execute(interaction, bot) {
        const queue = getQueue(interaction.guild.id);

        if (!queue.current) {
            return interaction.reply({
                embeds: [errorEmbed('Error', 'Nothing is playing!')],
                ephemeral: true
            });
        }

        const embed = successEmbed('🎵 Now Playing', `[${queue.current.title}](${queue.current.url})`)
            .setThumbnail(queue.current.thumbnail)
            .setColor('#00ff00')
            .addFields(
                { name: 'Duration', value: formatDuration(queue.current.duration), inline: true },
                { name: 'Requested by', value: queue.current.requestedBy.toString(), inline: true },
                { name: 'Status', value: queue.player.state.status === AudioPlayerStatus.Paused ? '⏸️ Paused' : '▶️ Playing', inline: true }
            );

        await interaction.reply({ embeds: [embed] });
    }
};
