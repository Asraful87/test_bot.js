const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('features')
        .setDescription('List available moderation features in this bot'),

    async execute(interaction, bot) {
        const embed = new EmbedBuilder()
            .setTitle('📋 Moderation Features')
            .setColor('Blue')
            .setDescription('Here are all the moderation features available:')
            .addFields(
                {
                    name: '👤 Member Management',
                    value: '`/kick` - Kick a member\n' +
                           '`/ban` - Ban a member\n' +
                           '`/unban` - Unban a user\n' +
                           '`/timeout` - Timeout a member\n' +
                           '`/untimeout` - Remove timeout\n' +
                           '`/mute` - Mute a member (alias)\n' +
                           '`/unmute` - Unmute a member (alias)',
                    inline: false
                },
                {
                    name: '⚠️ Warning System',
                    value: '`/warn` - Warn a member\n' +
                           '`/warnings` - View warnings\n' +
                           '`/clearwarnings` - Clear all warnings\n' +
                           '`/unwarn` - Remove last warning',
                    inline: false
                },
                {
                    name: '🗑️ Message Management',
                    value: '`/purge` - Delete messages in bulk\n' +
                           '`/say` - Make the bot send a message',
                    inline: false
                },
                {
                    name: '🎭 Role Management',
                    value: '`/addrole` - Add role to member\n' +
                           '`/removerole` - Remove role from member\n' +
                           '`/createrole` - Create a new role\n' +
                           '`/deleterole` - Delete a role\n' +
                           '`/rolecolor` - Change role color\n' +
                           '`/roleinfo` - View role information\n' +
                           '`/rolemembers` - List role members',
                    inline: false
                },
                {
                    name: '📢 Channel Management',
                    value: '`/createchannel` - Create a channel\n' +
                           '`/deletechannel` - Delete a channel\n' +
                           '`/lockchannel` - Lock a channel\n' +
                           '`/unlockchannel` - Unlock a channel\n' +
                           '`/slowmode` - Set slowmode\n' +
                           '`/setchannelname` - Change channel name\n' +
                           '`/setchanneltopic` - Change channel topic',
                    inline: false
                },
                {
                    name: '🎵 Music System',
                    value: '`/play` - Play music from YouTube\n' +
                           '`/pause` - Pause music\n' +
                           '`/resume` - Resume music\n' +
                           '`/skip` - Skip current song\n' +
                           '`/stop` - Stop music and clear queue\n' +
                           '`/queue` - View music queue\n' +
                           '`/nowplaying` - Current song info\n' +
                           '`/volume` - Set music volume\n' +
                           '`/leave` - Disconnect from voice',
                    inline: false
                },
                {
                    name: '🔧 Utilities',
                    value: '`/ping` - Check bot latency\n' +
                           '`/serverinfo` - Server information\n' +
                           '`/userinfo` - User information\n' +
                           '`/avatar` - View user avatar\n' +
                           '`/botinfo` - Bot information\n' +
                           '`/health` - Bot health check\n' +
                           '`/diagnose` - Permission diagnostics',
                    inline: false
                }
            )
            .setFooter({ text: `Requested by ${interaction.user.tag}` })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
