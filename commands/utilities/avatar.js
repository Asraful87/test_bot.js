const { SlashCommandBuilder } = require('discord.js');
const { successEmbed } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('avatar')
        .setDescription("Display user's avatar")
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to view avatar for')
                .setRequired(false)),

    async execute(interaction, bot) {
        const user = interaction.options.getUser('user') || interaction.user;

        const embed = successEmbed(`${user.tag}'s Avatar`, '')
            .setImage(user.displayAvatarURL({ dynamic: true, size: 4096 }))
            .setColor('#0099ff');

        await interaction.reply({ embeds: [embed] });
    }
};
