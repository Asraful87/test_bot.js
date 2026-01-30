const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Check the bot\'s latency'),

    async execute(interaction, bot) {
        const sent = await interaction.reply({ content: 'Pinging...', fetchReply: true });
        const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle('🏓 Pong!')
            .addFields(
                { name: 'Roundtrip Latency', value: `${sent.createdTimestamp - interaction.createdTimestamp}ms`, inline: true },
                { name: 'WebSocket Latency', value: `${Math.round(bot.ws.ping)}ms`, inline: true }
            )
            .setTimestamp();

        await interaction.editReply({ content: null, embeds: [embed] });
    }
};
