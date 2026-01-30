const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('serverinfo')
        .setDescription('Display server information'),

    async execute(interaction, bot) {
        const guild = interaction.guild;

        const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle(`${guild.name} Server Information`)
            .setThumbnail(guild.iconURL({ dynamic: true, size: 1024 }))
            .addFields(
                { name: '👑 Owner', value: `<@${guild.ownerId}>`, inline: true },
                { name: '📅 Created', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true },
                { name: '📊 Members', value: `${guild.memberCount}`, inline: true },
                { name: '📝 Channels', value: `${guild.channels.cache.size}`, inline: true },
                { name: '🎭 Roles', value: `${guild.roles.cache.size}`, inline: true },
                { name: '😀 Emojis', value: `${guild.emojis.cache.size}`, inline: true }
            )
            .setTimestamp();

        if (guild.description) {
            embed.setDescription(guild.description);
        }

        await interaction.reply({ embeds: [embed] });
    }
};
