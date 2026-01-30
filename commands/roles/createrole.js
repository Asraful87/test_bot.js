const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('createrole')
        .setDescription('Create a new role')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('Name of the role')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

    async execute(interaction, bot) {
        const name = interaction.options.getString('name');

        try {
            const role = await interaction.guild.roles.create({
                name: name,
                reason: `Role created by ${interaction.user.tag}`
            });

            await interaction.reply({
                embeds: [successEmbed('Role Created', `Role ${role} created successfully!`)]
            });
        } catch (error) {
            console.error('Create role error:', error);
            await interaction.reply({
                embeds: [errorEmbed('Error', `Failed to create role: ${error.message}`)],
                ephemeral: true
            });
        }
    }
};
