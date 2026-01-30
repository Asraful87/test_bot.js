const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed } = require('../../utils/embeds');

function boolIcon(ok) {
    return ok ? '✅' : '❌';
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('diagnose')
        .setDescription('Check permissions, role position, and bot status'),

    async execute(interaction, bot) {
        const me = interaction.guild.members.me;
        const channel = interaction.channel;

        // Check required permissions
        const perms = channel.permissionsFor(me);
        const required = {
            'ViewChannel': perms.has(PermissionFlagsBits.ViewChannel),
            'SendMessages': perms.has(PermissionFlagsBits.SendMessages),
            'EmbedLinks': perms.has(PermissionFlagsBits.EmbedLinks),
            'ReadMessageHistory': perms.has(PermissionFlagsBits.ReadMessageHistory),
            'ManageMessages': perms.has(PermissionFlagsBits.ManageMessages),
            'ModerateMembers': perms.has(PermissionFlagsBits.ModerateMembers),
            'KickMembers': perms.has(PermissionFlagsBits.KickMembers),
            'BanMembers': perms.has(PermissionFlagsBits.BanMembers)
        };

        const missing = Object.entries(required)
            .filter(([name, has]) => !has)
            .map(([name]) => name);

        const roleOk = me.roles.highest.position > 1;

        const embed = successEmbed('🩺 Bot Diagnose Report', 
            'This report helps you find why features might fail.')
            .setColor('#5865F2')
            .addFields(
                {
                    name: 'Bot Role Position',
                    value: `${boolIcon(roleOk)} Top role: **${me.roles.highest.name}** (pos ${me.roles.highest.position})\nTip: Keep bot role near top for moderation.`,
                    inline: false
                },
                {
                    name: 'Channel Permissions',
                    value: missing.length === 0 
                        ? '✅ All permissions OK in this channel.'
                        : `❌ Missing: ${missing.join(', ')}`,
                    inline: false
                },
                {
                    name: 'Bot Status',
                    value: `Latency: ${Math.round(bot.ws.ping)}ms\nServers: ${bot.guilds.cache.size}\nCommands: ${bot.commands.size}`,
                    inline: false
                }
            )
            .setFooter({ text: 'If something fails, run /diagnose in the same channel it fails in.' });

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
};
