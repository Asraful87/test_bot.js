const { SlashCommandBuilder } = require('discord.js');
const { successEmbed } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('roleinfo')
        .setDescription('Get information about a role')
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('Role to get information for')
                .setRequired(true)),

    async execute(interaction, bot) {
        const role = interaction.options.getRole('role');

        const embed = successEmbed(`Role Information: ${role.name}`, '')
            .setColor(role.hexColor)
            .addFields(
                { name: 'ID', value: role.id, inline: true },
                { name: 'Color', value: role.hexColor, inline: true },
                { name: 'Position', value: role.position.toString(), inline: true },
                { name: 'Members', value: role.members.size.toString(), inline: true },
                { name: 'Mentionable', value: role.mentionable ? 'Yes' : 'No', inline: true },
                { name: 'Hoisted', value: role.hoist ? 'Yes' : 'No', inline: true },
                { name: 'Created At', value: `<t:${Math.floor(role.createdTimestamp / 1000)}:F>`, inline: false }
            );

        await interaction.reply({ embeds: [embed] });
    }
};
