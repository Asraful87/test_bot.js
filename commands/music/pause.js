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

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pause')
        .setDescription('Pause the current song'),

    async execute(interaction, bot) {
        const queue = getQueue(interaction.guild.id);

        if (!queue.connection) {
            return interaction.reply({
                embeds: [errorEmbed('Error', 'Not connected to a voice channel!')],
                ephemeral: true
            });
        }

        if (queue.player.state.status === AudioPlayerStatus.Playing) {
            queue.player.pause();
            await interaction.reply({
                content: '⏸️ Paused the music!'
            });
        } else {
            await interaction.reply({
                embeds: [errorEmbed('Error', 'Nothing is playing!')],
                ephemeral: true
            });
        }
    }
};
