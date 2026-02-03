const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { requireGuild, requireUserPerms } = require('../../utils/permissions');
const { safeReply } = require('../../utils/respond');
const { getMusicEnabled, setMusicEnabled, replyMusicStatus } = require('../../utils/music_settings');
const { destroyQueue } = require('../../utils/music_state');
const { infoEmbed, successEmbed } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('music')
        .setDescription('Turn music on/off or check status')
        .addSubcommand(subcommand =>
            subcommand
                .setName('on')
                .setDescription('Enable music commands in this server'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('off')
                .setDescription('Disable music commands in this server'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('toggle')
                .setDescription('Toggle music commands on/off'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('status')
                .setDescription('Show current music status'))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async execute(interaction, bot) {
        if (!requireGuild(interaction)) return;
        if (!requireUserPerms(interaction, [PermissionFlagsBits.ManageGuild], 'manage music settings')) return;

        const subcommand = interaction.options.getSubcommand();
        const configHardOff = bot?.config?.music?.enabled === false;
        if (configHardOff && subcommand !== 'status') {
            const embed = infoEmbed(
                'Music Locked',
                'Music is disabled by server configuration. Enable it in `config.yaml` to allow toggling.'
            );
            await safeReply(interaction, { embeds: [embed], ephemeral: true });
            return;
        }

        const current = getMusicEnabled(bot, interaction.guildId);

        if (subcommand === 'status') {
            await replyMusicStatus(interaction, current);
            return;
        }

        const next =
            subcommand === 'toggle' ? !current
            : subcommand === 'on' ? true
            : subcommand === 'off' ? false
            : current;

        setMusicEnabled(bot, interaction.guildId, next);

        if (!next) {
            destroyQueue(interaction.guildId);
        }

        const embed = next
            ? successEmbed('Music Enabled', 'Music commands are now available in this server.')
            : infoEmbed('Music Disabled', 'Music commands are now disabled in this server.');

        await safeReply(interaction, { embeds: [embed], ephemeral: true });
    }
};
