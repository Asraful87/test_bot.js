const { errorEmbed, infoEmbed, successEmbed } = require('./embeds');
const { safeReply } = require('./respond');

function getMusicEnabled(bot, guildId) {
    const fromSettings = bot?.settings?.getModule?.(guildId, 'music', {}) || {};
    const fromConfig = bot?.config?.music;
    if (fromConfig?.enabled === false) return false;
    if (typeof fromSettings.enabled === 'boolean') return fromSettings.enabled;
    if (typeof fromConfig?.enabled === 'boolean') return fromConfig.enabled;

    return true;
}

function setMusicEnabled(bot, guildId, enabled) {
    if (!bot) return;
    if (!bot.config) bot.config = {};
    if (!bot.config.music) bot.config.music = {};

    bot.config.music.enabled = Boolean(enabled);

    if (bot?.settings && guildId) {
        bot.settings.setModule(guildId, 'music', { enabled: Boolean(enabled) });
    }
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
    getMusicEnabled,
    setMusicEnabled,
    ensureMusicEnabled,
    replyMusicStatus
};
