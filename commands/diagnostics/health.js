const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('health')
        .setDescription('Check if the bot is alive and show latency'),

    async execute(interaction, bot) {
        const latency = Math.round(bot.ws.ping);

        await interaction.reply({
            content: `✅ Bot is running. Latency: **${latency}ms**`
        });
    }
};
