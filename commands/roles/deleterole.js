const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('deleterole')
        .setDescription('Delete a role')
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('Role to delete')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

    async execute(interaction, bot) {
        const role = interaction.options.getRole('role');

        // Permission checks
        if (role.position >= interaction.member.roles.highest.position && 
            interaction.guild.ownerId !== interaction.user.id) {
            return interaction.reply({
                embeds: [errorEmbed('Error', 'You cannot delete a role higher than or equal to your highest role.')],
                ephemeral: true
            });
        }

        if (role.position >= interaction.guild.members.me.roles.highest.position) {
            return interaction.reply({
                embeds: [errorEmbed('Error', 'I cannot delete a role higher than or equal to my highest role.')],
                ephemeral: true
            });
        }

        try {
            const roleName = role.name;
            await role.delete(`Role deleted by ${interaction.user.tag}`);
            
            await interaction.reply({
                embeds: [successEmbed('Role Deleted', `Role **${roleName}** deleted successfully!`)]
            });
        } catch (error) {
            console.error('Delete role error:', error);
            await interaction.reply({
                embeds: [errorEmbed('Error', `Failed to delete role: ${error.message}`)],
                ephemeral: true
            });
        }
    }
};
