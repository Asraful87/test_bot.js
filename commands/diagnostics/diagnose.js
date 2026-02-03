const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');
const { getQueue } = require('../../utils/music_state');

function boolIcon(ok) {
    return ok ? '✅' : '❌';
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('diagnose')
        .setDescription('Check permissions, role position, and bot status'),

    async execute(interaction, bot) {
        if (!interaction.guild) {
            return interaction.reply({
                embeds: [errorEmbed('Error', 'This command can only be used in a server.')],
                ephemeral: true
            });
        }

        const me = interaction.guild.members.me || await interaction.guild.members.fetchMe().catch(() => null);
        if (!me) {
            return interaction.reply({
                embeds: [errorEmbed('Error', 'Could not resolve bot member in this guild.')],
                ephemeral: true
            });
        }

        const channel = interaction.channel;
        if (!channel) {
            return interaction.reply({
                embeds: [errorEmbed('Error', 'Channel context is missing for this interaction.')],
                ephemeral: true
            });
        }

        // Check required permissions
        const perms = channel.permissionsFor(me);
        const required = {
            'ViewChannel': perms?.has(PermissionFlagsBits.ViewChannel) ?? false,
            'SendMessages': perms?.has(PermissionFlagsBits.SendMessages) ?? false,
            'EmbedLinks': perms?.has(PermissionFlagsBits.EmbedLinks) ?? false,
            'ReadMessageHistory': perms?.has(PermissionFlagsBits.ReadMessageHistory) ?? false,
            'ManageMessages': perms?.has(PermissionFlagsBits.ManageMessages) ?? false,
            'ModerateMembers': perms?.has(PermissionFlagsBits.ModerateMembers) ?? false,
            'KickMembers': perms?.has(PermissionFlagsBits.KickMembers) ?? false,
            'BanMembers': perms?.has(PermissionFlagsBits.BanMembers) ?? false
        };

        const missing = Object.entries(required)
            .filter(([name, has]) => !has)
            .map(([name]) => name);

        const roleOk = me.roles.highest.position > 1;

        const memberVoiceChannel = interaction.member?.voice?.channel ?? null;
        const botVoiceState = me.voice;

        let voiceFieldValue = 'User is not in a voice/stage channel.';
        if (memberVoiceChannel) {
            const voicePerms = memberVoiceChannel.permissionsFor(me);
            const voiceRequired = {
                'Connect': voicePerms?.has(PermissionFlagsBits.Connect) ?? false,
                'Speak': voicePerms?.has(PermissionFlagsBits.Speak) ?? false,
                'UseVAD': voicePerms?.has(PermissionFlagsBits.UseVAD) ?? false,
                'RequestToSpeak': voicePerms?.has(PermissionFlagsBits.RequestToSpeak) ?? false
            };

            const voiceMissing = Object.entries(voiceRequired)
                .filter(([, has]) => !has)
                .map(([name]) => name);

            const isStage = memberVoiceChannel.type === ChannelType.GuildStageVoice;
            const botInSame = botVoiceState?.channelId === memberVoiceChannel.id;

            voiceFieldValue = [
                `Channel: **${memberVoiceChannel.name}** (${isStage ? 'Stage' : 'Voice'})`,
                `Bot in channel: ${boolIcon(!!botInSame)}`,
                voiceMissing.length === 0 ? '✅ Voice perms OK in that channel.' : `❌ Missing: ${voiceMissing.join(', ')}`,
                `Bot voice state: serverMute=${botVoiceState?.serverMute ? 'yes' : 'no'}, selfMute=${botVoiceState?.selfMute ? 'yes' : 'no'}, suppressed=${botVoiceState?.suppress ? 'yes' : 'no'}`
            ].join('\n');
        }

        const queue = getQueue(interaction.guild.id);
        const musicStatus = [
            `Player: ${queue.player?.state?.status ?? 'none'}`,
            `Connection: ${queue.connection?.state?.status ?? 'none'}`,
            `Current: ${queue.current?.title ? `**${queue.current.title}**` : 'none'}`
        ].join('\n');

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
                    name: 'Voice / Stage Checks',
                    value: voiceFieldValue,
                    inline: false
                },
                {
                    name: 'Music State (This Server)',
                    value: musicStatus,
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
