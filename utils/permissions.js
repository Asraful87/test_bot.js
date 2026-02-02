const { PermissionsBitField } = require('discord.js');
const { errorEmbed } = require('./embeds');

/**
 * Ensure interaction is in a guild (not DM)
 * @param {import('discord.js').CommandInteraction} interaction
 * @returns {boolean} true if in guild, false otherwise (auto-replies)
 */
function requireGuild(interaction) {
    if (!interaction.guild) {
        interaction.reply({
            embeds: [errorEmbed('Error', 'This command can only be used in a server.')],
            ephemeral: true
        });
        return false;
    }
    return true;
}

/**
 * Check if user has required permissions
 * @param {import('discord.js').CommandInteraction} interaction
 * @param {bigint[]} permissions - Array of PermissionFlagsBits
 * @param {string} action - Human readable action name
 * @returns {boolean}
 */
function requireUserPerms(interaction, permissions, action = 'perform this action') {
    if (!interaction.member) return false;
    
    const hasPerms = permissions.every(perm =>
        interaction.member.permissions.has(perm)
    );
    
    if (!hasPerms) {
        interaction.reply({
            embeds: [errorEmbed('Permission Denied', `You need additional permissions to ${action}.`)],
            ephemeral: true
        });
        return false;
    }
    
    return true;
}

/**
 * Check if bot has required permissions
 * @param {import('discord.js').CommandInteraction} interaction
 * @param {bigint[]} permissions - Array of PermissionFlagsBits
 * @param {string} action - Human readable action name
 * @returns {boolean}
 */
function requireBotPerms(interaction, permissions, action = 'perform this action') {
    if (!interaction.guild.members.me) return false;
    
    const hasPerms = permissions.every(perm =>
        interaction.guild.members.me.permissions.has(perm)
    );
    
    if (!hasPerms) {
        const permNames = permissions.map(p => 
            Object.keys(PermissionsBitField.Flags).find(k => PermissionsBitField.Flags[k] === p)
        ).join(', ');
        
        interaction.reply({
            embeds: [errorEmbed('Bot Permission Denied', `I need the following permissions to ${action}: ${permNames}`)],
            ephemeral: true
        });
        return false;
    }
    
    return true;
}

/**
 * Check role hierarchy (executor must be higher than target)
 * Auto-replies with error message if check fails
 * 
 * @param {import('discord.js').CommandInteraction} interaction
 * @param {import('discord.js').GuildMember} targetMember
 * @param {string} action - Human readable action name
 * @returns {boolean}
 */
function roleHierarchyCheck(interaction, targetMember, action = 'moderate this member') {
    if (!targetMember) return true; // Target not in guild (e.g., already banned)
    
    // Can't moderate server owner
    if (targetMember.id === interaction.guild.ownerId) {
        interaction.reply({
            embeds: [errorEmbed('Error', 'You cannot moderate the server owner.')],
            ephemeral: true
        });
        return false;
    }
    
    // Check executor hierarchy
    if (targetMember.roles.highest.position >= interaction.member.roles.highest.position) {
        interaction.reply({
            embeds: [errorEmbed('Error', `You cannot ${action} with an equal or higher role.`)],
            ephemeral: true
        });
        return false;
    }
    
    // Check bot hierarchy
    if (targetMember.roles.highest.position >= interaction.guild.members.me.roles.highest.position) {
        interaction.reply({
            embeds: [errorEmbed('Error', `I cannot ${action} with an equal or higher role than mine.`)],
            ephemeral: true
        });
        return false;
    }
    
    return true;
}

/**
 * Check if member can be banned by the bot
 * @param {import('discord.js').GuildMember} member
 * @returns {boolean}
 */
function isBannable(member) {
    return member && member.bannable;
}

/**
 * Check if member can be kicked by the bot
 * @param {import('discord.js').GuildMember} member
 * @returns {boolean}
 */
function isKickable(member) {
    return member && member.kickable;
}

/**
 * Check if member can be moderated (timeout, mute, etc.)
 * @param {import('discord.js').GuildMember} member
 * @returns {boolean}
 */
function isModeratable(member) {
    return member && member.moderatable;
}

module.exports = {
    requireGuild,
    requireUserPerms,
    requireBotPerms,
    roleHierarchyCheck,
    isBannable,
    isKickable,
    isModeratable
};
