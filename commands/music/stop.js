const { SlashCommandBuilder } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');
const { getQueue, destroyQueue } = require('../../utils/music_state');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stop')
        .setDescription('Stop music and clear the queue'),

    async execute(interaction, bot) {
        const queue = getQueue(interaction.guild.id);
        if (!queue.connection) {
            return interaction.reply({
                embeds: [errorEmbed('Error', 'I am not in a voice channel!')],
                ephemeral: true
            });
        }

        destroyQueue(interaction.guild.id);

        await interaction.reply({
            embeds: [successEmbed('Stopped', 'Music stopped and queue cleared.')]
        });
    }
};
