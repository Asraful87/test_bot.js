const { SlashCommandBuilder } = require('discord.js');
const { getVoiceConnection } = require('@discordjs/voice');
const { successEmbed, errorEmbed } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stop')
        .setDescription('Stop music and clear the queue'),

    async execute(interaction, bot) {
        const connection = getVoiceConnection(interaction.guild.id);

        if (!connection) {
            return interaction.reply({
                embeds: [errorEmbed('Error', 'I am not in a voice channel!')],
                ephemeral: true
            });
        }

        connection.destroy();

        // Clear queue
        const queues = require('./play').queues || new Map();
        queues.delete(interaction.guild.id);

        await interaction.reply({
            embeds: [successEmbed('Stopped', 'Music stopped and queue cleared.')]
        });
    }
};
