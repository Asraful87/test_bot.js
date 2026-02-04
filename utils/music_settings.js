const { errorEmbed, infoEmbed, successEmbed } = require('./embeds');
const { safeReply } = require('./respond');

const MUSIC_CONTROL_COMMAND_NAME = 'music';
const MUSIC_PLAYBACK_COMMAND_NAMES = Object.freeze([
    'play',
    'pause',
    'resume',
    'skip',
    'stop',
    'queue',
    'nowplaying',
    'volume',
    'leave'
]);
const MUSIC_COMMAND_NAMES = Object.freeze([
    MUSIC_CONTROL_COMMAND_NAME,
    ...MUSIC_PLAYBACK_COMMAND_NAMES
]);

function getMusicEnabled(bot, guildId) {
    const fromConfig = bot?.config?.music;
    const fromSettings = guildId
        ? bot?.settings?.getModule?.(guildId, 'music', {}) || {}
        : {};

    if (fromConfig?.enabled === false) return false;
    if (typeof fromSettings.enabled === 'boolean') return fromSettings.enabled;
    if (typeof fromConfig?.enabled === 'boolean') return fromConfig.enabled;

    return true;
}

function setMusicEnabled(bot, guildId, enabled) {
    if (bot?.settings && guildId) {
        bot.settings.setModule(guildId, 'music', { enabled: Boolean(enabled) });
    }
}

async function resolveGuild(bot, guildId) {
    if (!bot?.guilds || !guildId) return null;
    const cached = bot.guilds.cache.get(guildId);
    if (cached) return cached;

    try {
        return await bot.guilds.fetch(guildId);
    } catch {
        return null;
    }
}

async function hideMusicCommands(bot, guildId, options = {}) {
    const includeControl = options.includeControl === true;
    const names = new Set(includeControl ? MUSIC_COMMAND_NAMES : MUSIC_PLAYBACK_COMMAND_NAMES);
    const guild = await resolveGuild(bot, guildId);
    if (!guild) return { removed: 0 };

    const existing = await guild.commands.fetch();
    const targets = existing.filter(command => names.has(command.name));

    for (const command of targets.values()) {
        await guild.commands.delete(command.id);
    }

    return { removed: targets.size };
}

async function showMusicCommands(bot, guildId, options = {}) {
    const includeControl = options.includeControl === true;
    const names = new Set(includeControl ? MUSIC_COMMAND_NAMES : MUSIC_PLAYBACK_COMMAND_NAMES);
    const guild = await resolveGuild(bot, guildId);
    if (!guild) return { added: 0 };

    const existing = await guild.commands.fetch();
    const existingNames = new Set(existing.map(command => command.name));
    const loadedCommands = bot?.commands ? [...bot.commands.values()] : [];

    let added = 0;
    for (const command of loadedCommands) {
        const name = command?.data?.name;
        if (!name || !names.has(name) || existingNames.has(name)) continue;
        await guild.commands.create(command.data.toJSON());
        added += 1;
    }

    return { added };
}

async function ensureMusicEnabled(interaction, bot) {
    const enabled = getMusicEnabled(bot, interaction.guildId);
    if (enabled) return true;

    const configHardOff = bot?.config?.music?.enabled === false;
    const message = configHardOff
        ? 'Music is disabled by server configuration. An admin can re-enable it in config or ask the owner.'
        : 'Music is currently disabled by an administrator. Use `/music on` to enable it.';

    const embed = errorEmbed('Music Disabled', message);

    await safeReply(interaction, { embeds: [embed], ephemeral: true });
    return false;
}

async function replyMusicStatus(interaction, enabled) {
    const embed = enabled
        ? successEmbed('Music Enabled', 'Music commands are available.')
        : infoEmbed('Music Disabled', 'Music commands are temporarily disabled.');
    await safeReply(interaction, { embeds: [embed], ephemeral: true });
}

module.exports = {
    MUSIC_CONTROL_COMMAND_NAME,
    MUSIC_PLAYBACK_COMMAND_NAMES,
    MUSIC_COMMAND_NAMES,
    getMusicEnabled,
    setMusicEnabled,
    hideMusicCommands,
    showMusicCommands,
    ensureMusicEnabled,
    replyMusicStatus
};
