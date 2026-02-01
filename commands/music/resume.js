const { SlashCommandBuilder } = require('discord.js');
const { AudioPlayerStatus } = require('@discordjs/voice');
const { successEmbed, errorEmbed } = require('../../utils/embeds');

const { getQueue } = require('../../utils/music_state');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('resume')
        .setDescription('Resume the paused song'),

    async execute(interaction, bot) {
        const queue = getQueue(interaction.guild.id);

        if (!queue.connection || !queue.player) {
            return interaction.reply({
                embeds: [errorEmbed('Error', 'Not connected to a voice channel!')],
                ephemeral: true
            });
        }

        if (queue.player.state.status === AudioPlayerStatus.Paused) {
            queue.player.unpause();
            await interaction.reply({
                content: '▶️ Resumed the music!'
            });
        } else {
            await interaction.reply({
                embeds: [errorEmbed('Error', 'Music is not paused!')],
                ephemeral: true
            });
        }
    }
};
