const { SlashCommandBuilder } = require('discord.js');

const { getQueue, destroyQueue } = require('../../utils/music_state');
const { ensureMusicEnabled } = require('../../utils/music_settings');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leave')
        .setDescription('Disconnect the bot from voice channel'),

    async execute(interaction, bot) {
        if (!await ensureMusicEnabled(interaction, bot)) return;
        const queue = getQueue(interaction.guild.id);

        if (!queue.connection) {
            return interaction.reply({
                content: '❌ Not connected to a voice channel!',
                ephemeral: true
            });
        }

        queue.songs = [];
        queue.current = null;
        destroyQueue(interaction.guild.id);

        await interaction.reply({
            content: '👋 Disconnected from voice channel!'
        });
    }
};
