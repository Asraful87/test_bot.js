const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rolecolor')
        .setDescription("Change a role's color")
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('Role to change color')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('color')
                .setDescription('Hex color (e.g., #FF0000 or FF0000)')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

    async execute(interaction, bot) {
        const role = interaction.options.getRole('role');
        let color = interaction.options.getString('color');

        // Permission checks
        if (role.position >= interaction.member.roles.highest.position && 
            interaction.guild.ownerId !== interaction.user.id) {
            return interaction.reply({
                embeds: [errorEmbed('Error', 'You cannot edit a role higher than or equal to your highest role.')],
                ephemeral: true
            });
        }

        if (role.position >= interaction.guild.members.me.roles.highest.position) {
            return interaction.reply({
                embeds: [errorEmbed('Error', 'I cannot edit a role higher than or equal to my highest role.')],
                ephemeral: true
            });
        }

        // Remove # if present
        color = color.replace('#', '');

        // Validate hex color
        if (!/^[0-9A-F]{6}$/i.test(color)) {
            return interaction.reply({
                embeds: [errorEmbed('Error', 'Invalid color format. Use hex format like #FF0000')],
                ephemeral: true
            });
        }

        try {
            const colorInt = parseInt(color, 16);
            await role.edit({ color: colorInt }, `Color changed by ${interaction.user.tag}`);
            
            await interaction.reply({
                embeds: [successEmbed('Role Color Changed', `Changed color of ${role} to #${color}.`)]
            });
        } catch (error) {
            console.error('Role color error:', error);
            await interaction.reply({
                embeds: [errorEmbed('Error', `Failed to change role color: ${error.message}`)],
                ephemeral: true
            });
        }
    }
};
