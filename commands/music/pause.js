const { SlashCommandBuilder } = require('discord.js');
const { AudioPlayerStatus } = require('@discordjs/voice');
const { successEmbed, errorEmbed } = require('../../utils/embeds');

const { getQueue } = require('../../utils/music_state');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pause')
        .setDescription('Pause the current song'),

    async execute(interaction, bot) {
        const queue = getQueue(interaction.guild.id);

        if (!queue.connection || !queue.player) {
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
