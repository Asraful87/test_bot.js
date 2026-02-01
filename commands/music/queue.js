const { SlashCommandBuilder } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');

const { getQueue } = require('../../utils/music_state');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('Show the music queue'),

    async execute(interaction, bot) {
        const queue = getQueue(interaction.guild.id);

        if (!queue.current && queue.songs.length === 0) {
            return interaction.reply({
                content: '📝 The queue is empty!',
                ephemeral: true
            });
        }

        const embed = successEmbed('🎵 Music Queue', '')
            .setColor('#0099ff');

        if (queue.current) {
            embed.addFields({
                name: '🎵 Now Playing',
                value: `[${queue.current.title}](${queue.current.url})`,
                inline: false
            });
        }

        if (queue.songs.length > 0) {
            const queueText = queue.songs.slice(0, 10).map((song, i) => {
                return `\`${i + 1}.\` [${song.title}](${song.url})`;
            }).join('\n');

            const moreText = queue.songs.length > 10 ? `\n*...and ${queue.songs.length - 10} more*` : '';
            
            embed.addFields({
                name: '📝 Up Next',
                value: queueText + moreText,
                inline: false
            });
        }

        embed.setFooter({ text: `Total songs in queue: ${queue.songs.length}` });

        await interaction.reply({ embeds: [embed] });
    }
};
