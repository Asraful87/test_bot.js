const { SlashCommandBuilder } = require('discord.js');
const { successEmbed } = require('../../utils/embeds');
const os = require('os');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('botinfo')
        .setDescription('Display bot information'),

    async execute(interaction, bot) {
        const uptime = process.uptime();
        const days = Math.floor(uptime / 86400);
        const hours = Math.floor(uptime / 3600) % 24;
        const minutes = Math.floor(uptime / 60) % 60;
        const seconds = Math.floor(uptime) % 60;

        const embed = successEmbed('Bot Information', '')
            .setThumbnail(bot.user.displayAvatarURL())
            .addFields(
                { name: 'Bot Tag', value: bot.user.tag, inline: true },
                { name: 'Bot ID', value: bot.user.id, inline: true },
                { name: 'Servers', value: bot.guilds.cache.size.toString(), inline: true },
                { name: 'Uptime', value: `${days}d ${hours}h ${minutes}m ${seconds}s`, inline: true },
                { name: 'Node.js', value: process.version, inline: true },
                { name: 'Discord.js', value: require('discord.js').version, inline: true },
                { name: 'Memory Usage', value: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`, inline: true },
                { name: 'Platform', value: `${os.platform()} ${os.arch()}`, inline: true }
            )
            .setColor('#0099ff');

        await interaction.reply({ embeds: [embed] });
    }
};
