const { SlashCommandBuilder } = require('discord.js');

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
        .setName('leave')
        .setDescription('Disconnect the bot from voice channel'),

    async execute(interaction, bot) {
        const queue = getQueue(interaction.guild.id);

        if (!queue.connection) {
            return interaction.reply({
                content: '❌ Not connected to a voice channel!',
                ephemeral: true
            });
        }

        queue.songs = [];
        queue.current = null;
        queue.connection.destroy();
        queues.delete(interaction.guild.id);

        await interaction.reply({
            content: '👋 Disconnected from voice channel!'
        });
    }
};
