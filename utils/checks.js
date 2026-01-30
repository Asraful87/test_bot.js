const { PermissionFlagsBits } = require('discord.js');

function hasPermissions(member, permissions) {
    return member.permissions.has(permissions);
}

function isAdmin(member) {
    return member.permissions.has(PermissionFlagsBits.Administrator);
}

function isModerator(member) {
    return member.permissions.has([
        PermissionFlagsBits.KickMembers,
        PermissionFlagsBits.BanMembers,
        PermissionFlagsBits.ManageMessages
    ]);
}

function canManageRoles(member) {
    return member.permissions.has(PermissionFlagsBits.ManageRoles);
}

function canManageChannels(member) {
    return member.permissions.has(PermissionFlagsBits.ManageChannels);
}

async function checkPermissions(interaction, permission, errorMessage = null) {
    if (!interaction.member.permissions.has(permission)) {
        const msg = errorMessage || `You need the \`${permission}\` permission to use this command.`;
        await interaction.reply({ content: `❌ ${msg}`, ephemeral: true });
        return false;
    }
    return true;
}

module.exports = {
    hasPermissions,
    isAdmin,
    isModerator,
    canManageRoles,
    canManageChannels,
    checkPermissions
};
