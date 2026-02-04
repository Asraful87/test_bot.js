const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { requireGuild, requireUserPerms } = require('../../utils/permissions');
const { safeReply } = require('../../utils/respond');
const {
    getMusicEnabled,
    setMusicEnabled,
    hideMusicCommands,
    showMusicCommands,
    replyMusicStatus
} = require('../../utils/music_settings');
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

        let visibilityMessage = '';
        try {
            if (next) {
                const { added } = await showMusicCommands(bot, interaction.guildId);
                if (added > 0) {
                    visibilityMessage = ` ${added} music command(s) are now visible.`;
                }
            } else {
                const { removed } = await hideMusicCommands(bot, interaction.guildId);
                if (removed > 0) {
                    visibilityMessage = ` ${removed} music command(s) are now hidden.`;
                }
            }
        } catch (error) {
            console.error('Failed to update music command visibility:', error);
        }

        const embed = next
            ? successEmbed('Music Enabled', `Music commands are now available in this server.${visibilityMessage}`)
            : infoEmbed('Music Disabled', `Music commands are now disabled in this server.${visibilityMessage}`);

        await safeReply(interaction, { embeds: [embed], ephemeral: true });
    }
};
