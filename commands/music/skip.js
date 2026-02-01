const { SlashCommandBuilder } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');
const { getQueue } = require('../../utils/music_state');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Skip the current song'),

    async execute(interaction, bot) {
        const queue = getQueue(interaction.guild.id);
        if (!queue.connection || !queue.player) {
            return interaction.reply({
                embeds: [errorEmbed('Error', 'Nothing is playing!')],
                ephemeral: true
            });
        }

        // stopping the player will trigger the Idle handler in play.js and move to the next track
        queue.player.stop(true);

        await interaction.reply({
            embeds: [successEmbed('Skipped', 'Skipped to the next song.')]
        });
    }
};
