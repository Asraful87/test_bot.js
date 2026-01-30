const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('say')
        .setDescription('Make the bot send a message')
        .addStringOption(option =>
            option.setName('message')
                .setDescription('Message to send')
                .setRequired(true))
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Channel to send message in (defaults to current)')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    async execute(interaction, bot) {
        const message = interaction.options.getString('message');
        const channel = interaction.options.getChannel('channel') || interaction.channel;

        if (!channel.isTextBased()) {
            return interaction.reply({
                embeds: [errorEmbed('Error', 'Can only send messages in text channels.')],
                ephemeral: true
            });
        }

        try {
            const sent = await channel.send({
                content: message,
                allowedMentions: { parse: [] } // Prevent @everyone/@here mentions
            });

            await interaction.reply({
                embeds: [successEmbed('Message Sent', `[Jump to message](${sent.url})`)],
                ephemeral: true
            });
        } catch (error) {
            console.error('Say command error:', error);
            await interaction.reply({
                embeds: [errorEmbed('Error', `Failed to send message: ${error.message}`)],
                ephemeral: true
            });
        }
    }
};
