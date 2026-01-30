const { SlashCommandBuilder } = require('discord.js');
const { successEmbed } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('userinfo')
        .setDescription('Display user information')
        .addUserOption(option =>
            option.setName('member')
                .setDescription('Member to view information for')
                .setRequired(false)),

    async execute(interaction, bot) {
        const member = interaction.options.getMember('member') || interaction.member;

        const embed = successEmbed('User Information', '')
            .setColor(member.displayHexColor || '#0099ff')
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 512 }))
            .addFields(
                { name: 'Username', value: member.user.tag, inline: true },
                { name: 'Display Name', value: member.displayName, inline: true },
                { name: 'ID', value: member.id, inline: true },
                { name: 'Account Created', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:F>`, inline: false },
                { name: 'Joined Server', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>`, inline: false }
            );

        // Roles
        const roles = member.roles.cache
            .filter(role => role.id !== interaction.guild.id)
            .sort((a, b) => b.position - a.position)
            .map(role => role.toString());

        if (roles.length > 0) {
            const roleText = roles.length <= 10 
                ? roles.join(', ') 
                : `${roles.slice(0, 10).join(', ')}... and ${roles.length - 10} more`;
            
            embed.addFields({ name: `Roles (${roles.length})`, value: roleText, inline: false });
        }

        await interaction.reply({ embeds: [embed] });
    }
};
