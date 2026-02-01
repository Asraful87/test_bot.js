const { SlashCommandBuilder } = require('discord.js');
const { AudioPlayerStatus } = require('@discordjs/voice');
const { successEmbed, errorEmbed } = require('../../utils/embeds');

const { getQueue } = require('../../utils/music_state');

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

        if (!queue.player || queue.player.state.status === AudioPlayerStatus.Idle) {
            return interaction.reply({
                embeds: [errorEmbed('Error', 'Nothing is playing!')],
                ephemeral: true
            });
        }

        const resource = queue.player.state.resource;
        const meta = resource && resource.metadata ? resource.metadata : null;
        const current = meta || queue.current;

        if (!current) {
            return interaction.reply({
                embeds: [errorEmbed('Error', 'Nothing is playing!')],
                ephemeral: true
            });
        }

        const embed = successEmbed('🎵 Now Playing', `[${current.title}](${current.url})`)
            .setThumbnail(current.thumbnail)
            .setColor('#00ff00')
            .addFields(
                { name: 'Duration', value: formatDuration(current.duration || 0), inline: true },
                { name: 'Requested by', value: current.requestedBy ? current.requestedBy.toString() : 'Unknown', inline: true },
                { name: 'Status', value: queue.player.state.status === AudioPlayerStatus.Paused ? '⏸️ Paused' : '▶️ Playing', inline: true }
            );

        await interaction.reply({ embeds: [embed] });
    }
};
