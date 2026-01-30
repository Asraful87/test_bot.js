const { SlashCommandBuilder } = require('discord.js');
const { getVoiceConnection } = require('@discordjs/voice');
const { successEmbed, errorEmbed } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Skip the current song'),

    async execute(interaction, bot) {
        const connection = getVoiceConnection(interaction.guild.id);

        if (!connection) {
            return interaction.reply({
                embeds: [errorEmbed('Error', 'I am not in a voice channel!')],
                ephemeral: true
            });
        }

        const play = require('./play');
        const queues = new Map();
        const queue = queues.get(interaction.guild.id);

        if (!queue || !queue.player) {
            return interaction.reply({
                embeds: [errorEmbed('Error', 'Nothing is playing!')],
                ephemeral: true
            });
        }

        queue.player.stop();

        await interaction.reply({
            embeds: [successEmbed('Skipped', 'Skipped to the next song.')]
        });
    }
};
