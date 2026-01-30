const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unlockchannel')
        .setDescription('Unlock a channel')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Channel to unlock (defaults to current channel)')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    async execute(interaction, bot) {
        const channel = interaction.options.getChannel('channel') || interaction.channel;

        try {
            await channel.permissionOverwrites.edit(interaction.guild.id, {
                SendMessages: null
            });

            await interaction.reply({
                embeds: [successEmbed('Channel Unlocked', `${channel} has been unlocked. 🔓`)]
            });
        } catch (error) {
            console.error('Unlock channel error:', error);
            await interaction.reply({
                embeds: [errorEmbed('Error', `Failed to unlock channel: ${error.message}`)],
                ephemeral: true
            });
        }
    }
};
