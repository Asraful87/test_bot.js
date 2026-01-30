const { SlashCommandBuilder } = require('discord.js');
const { successEmbed } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rolemembers')
        .setDescription('List all members with a specific role')
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('Role to list members for')
                .setRequired(true)),

    async execute(interaction, bot) {
        const role = interaction.options.getRole('role');
        const members = role.members;

        if (members.size === 0) {
            return interaction.reply({
                content: `No members have the ${role} role.`,
                ephemeral: true
            });
        }

        const embed = successEmbed(`Members with ${role.name}`, `Total: ${members.size}`)
            .setColor(role.hexColor);

        // Show first 25 members (Discord embed field limit)
        const memberList = members.first(25).map(m => m.toString()).join('\n');
        embed.addFields({ name: 'Members', value: memberList, inline: false });

        if (members.size > 25) {
            embed.setFooter({ text: `Showing 25 of ${members.size} members` });
        }

        await interaction.reply({ embeds: [embed] });
    }
};
