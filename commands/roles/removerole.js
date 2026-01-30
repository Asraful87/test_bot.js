const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('removerole')
        .setDescription('Remove a role from a member')
        .addUserOption(option =>
            option.setName('member')
                .setDescription('Member to remove role from')
                .setRequired(true))
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('Role to remove')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

    async execute(interaction, bot) {
        const member = interaction.options.getMember('member');
        const role = interaction.options.getRole('role');

        // Permission checks
        if (role.position >= interaction.member.roles.highest.position && 
            interaction.guild.ownerId !== interaction.user.id) {
            return interaction.reply({
                embeds: [errorEmbed('Error', 'You cannot remove a role higher than or equal to your highest role.')],
                ephemeral: true
            });
        }

        if (role.position >= interaction.guild.members.me.roles.highest.position) {
            return interaction.reply({
                embeds: [errorEmbed('Error', 'I cannot remove a role higher than or equal to my highest role.')],
                ephemeral: true
            });
        }

        if (!member.roles.cache.has(role.id)) {
            return interaction.reply({
                embeds: [errorEmbed('Error', `${member} doesn't have the ${role} role.`)],
                ephemeral: true
            });
        }

        try {
            await member.roles.remove(role, `Role removed by ${interaction.user.tag}`);
            await interaction.reply({
                embeds: [successEmbed('Role Removed', `Removed ${role} from ${member}.`)]
            });
        } catch (error) {
            console.error('Remove role error:', error);
            await interaction.reply({
                embeds: [errorEmbed('Error', `Failed to remove role: ${error.message}`)],
                ephemeral: true
            });
        }
    }
};
