const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setchanneltopic')
        .setDescription("Change a channel's topic")
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Channel to set topic for')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('topic')
                .setDescription('New channel topic')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    async execute(interaction, bot) {
        const channel = interaction.options.getChannel('channel');
        const topic = interaction.options.getString('topic');

        try {
            await channel.setTopic(topic, `Topic changed by ${interaction.user.tag}`);

            await interaction.reply({
                embeds: [successEmbed('Topic Updated', `Topic updated for ${channel}.`)]
            });
        } catch (error) {
            console.error('Set channel topic error:', error);
            await interaction.reply({
                embeds: [errorEmbed('Error', `Failed to set topic: ${error.message}`)],
                ephemeral: true
            });
        }
    }
};
