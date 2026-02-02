const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');
const { requireGuild } = require('../../utils/permissions');
const { safeDefer, safeError, safeReply } = require('../../utils/respond');

const DEFAULT_ANTIRAID = {
    enabled: false,
    join_threshold: 5,
    join_interval_seconds: 10,
    min_account_age_days: 7,
    auto_timeout_minutes: 10
};

function coerceNumber(value, fallback) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
}

function normalizeAntiRaidConfig(input) {
    const cfg = (input && typeof input === 'object') ? input : {};
    return {
        enabled: Boolean(cfg.enabled),
        join_threshold: coerceNumber(cfg.join_threshold, DEFAULT_ANTIRAID.join_threshold),
        join_interval_seconds: coerceNumber(cfg.join_interval_seconds, DEFAULT_ANTIRAID.join_interval_seconds),
        min_account_age_days: coerceNumber(cfg.min_account_age_days, DEFAULT_ANTIRAID.min_account_age_days),
        auto_timeout_minutes: coerceNumber(cfg.auto_timeout_minutes, DEFAULT_ANTIRAID.auto_timeout_minutes)
    };
}

function getEffectiveAntiRaidConfig(interaction, bot) {
    const fromBotConfig = normalizeAntiRaidConfig(bot?.config?.antiraid);

    // Optional: guild-scoped overrides persisted in DB.
    // This lets /setup_antiraid work even when config.yaml isn't present in production.
    const fromSettings = normalizeAntiRaidConfig(
        bot?.settings?.getModule?.(interaction.guildId, 'antiraid', {})
    );

    return {
        ...DEFAULT_ANTIRAID,
        ...fromBotConfig,
        ...fromSettings
    };
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup_antiraid')
        .setDescription('Configure Anti-Raid settings')
        .addSubcommand(subcommand =>
            subcommand
                .setName('toggle')
                .setDescription('Enable or disable Anti-Raid')
                .addBooleanOption(option =>
                    option.setName('enabled')
                        .setDescription('Enable Anti-Raid protection')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('status')
                .setDescription('Check Anti-Raid status'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('lockdown')
                .setDescription('Lock down the server to prevent raids'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('unlock')
                .setDescription('Remove server lockdown'))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction, bot) {
        if (!requireGuild(interaction)) return;

        const subcommand = interaction.options.getSubcommand();
        const configPath = path.join(__dirname, '../../config.yaml');

        if (subcommand === 'toggle') {
            const enabled = interaction.options.getBoolean('enabled');

            // Update in-memory config so runtime behavior changes immediately.
            if (!bot.config) bot.config = {};
            if (!bot.config.antiraid) bot.config.antiraid = { ...DEFAULT_ANTIRAID };
            bot.config.antiraid.enabled = enabled;

            // Persist guild override to DB when available.
            try {
                if (bot?.settings && interaction.guildId) {
                    const existing = getEffectiveAntiRaidConfig(interaction, bot);
                    bot.settings.setModule(interaction.guildId, 'antiraid', {
                        ...existing,
                        enabled
                    });
                }
            } catch (e) {
                // Non-fatal: DB persistence failure should not block the command.
                console.error('Failed to persist antiraid settings:', e);
            }

            // Best-effort: update config.yaml only if it exists.
            try {
                if (fs.existsSync(configPath)) {
                    const raw = fs.readFileSync(configPath, 'utf8');
                    const fileConfig = yaml.load(raw) || {};
                    if (!fileConfig.antiraid) fileConfig.antiraid = { ...DEFAULT_ANTIRAID };
                    fileConfig.antiraid.enabled = enabled;
                    fs.writeFileSync(configPath, yaml.dump(fileConfig));
                }
            } catch (e) {
                // Non-fatal in production environments with read-only filesystem.
                console.error('Failed to write config.yaml for antiraid:', e);
            }
            
            const embed = new EmbedBuilder()
                .setColor(enabled ? 0x00ff00 : 0xff0000)
                .setTitle('⚙️ Anti-Raid Configuration')
                .setDescription(`Anti-Raid protection has been **${enabled ? 'enabled' : 'disabled'}**`)
                .setTimestamp();
            
            await safeReply(interaction, { embeds: [embed] });
        } 
        else if (subcommand === 'status') {
            const antiraid = getEffectiveAntiRaidConfig(interaction, bot);
            
            const embed = new EmbedBuilder()
                .setColor(antiraid.enabled ? 0x00ff00 : 0xff0000)
                .setTitle('🛡️ Anti-Raid Status')
                .addFields(
                    { name: 'Status', value: antiraid.enabled ? '✅ Enabled' : '❌ Disabled', inline: true },
                    { name: 'Join Threshold', value: `${antiraid.join_threshold} users`, inline: true },
                    { name: 'Join Interval', value: `${antiraid.join_interval_seconds} seconds`, inline: true },
                    { name: 'Min Account Age', value: `${antiraid.min_account_age_days} days`, inline: true },
                    { name: 'Auto Timeout', value: `${antiraid.auto_timeout_minutes} minutes`, inline: true },
                    { name: '\u200B', value: '\u200B', inline: true }
                )
                .setDescription('Monitors for suspicious join patterns and new accounts')
                .setTimestamp();
            
            await safeReply(interaction, { embeds: [embed] });
        }
        else if (subcommand === 'lockdown') {
            await safeDefer(interaction);
            
            const guild = interaction.guild;
            let channelsLocked = 0;
            
            // Get @everyone role
            const everyoneRole = guild.roles.everyone;
            
            // Lock all text channels
            for (const [, channel] of guild.channels.cache) {
                if (channel.isTextBased() && !channel.isThread()) {
                    try {
                        await channel.permissionOverwrites.edit(everyoneRole, {
                            SendMessages: false,
                            AddReactions: false,
                            CreatePublicThreads: false,
                            CreatePrivateThreads: false
                        });
                        channelsLocked++;
                    } catch (error) {
                        console.error(`Failed to lock ${channel.name}:`, error);
                    }
                }
            }
            
            const embed = new EmbedBuilder()
                .setColor(0xff0000)
                .setTitle('🔒 Server Lockdown Activated')
                .setDescription(`Locked ${channelsLocked} channels to prevent raid damage`)
                .addFields(
                    { name: 'Locked Permissions', value: '• Send Messages\n• Add Reactions\n• Create Threads' }
                )
                .setFooter({ text: 'Use /setup_antiraid unlock to remove lockdown' })
                .setTimestamp();
            
            await safeReply(interaction, { embeds: [embed] });
        }
        else if (subcommand === 'unlock') {
            await safeDefer(interaction);
            
            const guild = interaction.guild;
            let channelsUnlocked = 0;
            
            // Get @everyone role
            const everyoneRole = guild.roles.everyone;
            
            // Unlock all text channels
            for (const [, channel] of guild.channels.cache) {
                if (channel.isTextBased() && !channel.isThread()) {
                    try {
                        await channel.permissionOverwrites.edit(everyoneRole, {
                            SendMessages: null,
                            AddReactions: null,
                            CreatePublicThreads: null,
                            CreatePrivateThreads: null
                        });
                        channelsUnlocked++;
                    } catch (error) {
                        console.error(`Failed to unlock ${channel.name}:`, error);
                    }
                }
            }
            
            const embed = new EmbedBuilder()
                .setColor(0x00ff00)
                .setTitle('🔓 Server Lockdown Removed')
                .setDescription(`Unlocked ${channelsUnlocked} channels`)
                .setFooter({ text: 'Normal server operations resumed' })
                .setTimestamp();
            
            await safeReply(interaction, { embeds: [embed] });
        }
    }
};
