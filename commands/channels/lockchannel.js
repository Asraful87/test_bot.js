const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lockchannel')
        .setDescription('Lock a channel (prevent @everyone from sending messages)')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Channel to lock (defaults to current channel)')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    async execute(interaction, bot) {
        const channel = interaction.options.getChannel('channel') || interaction.channel;

        try {
            await channel.permissionOverwrites.edit(interaction.guild.id, {
                SendMessages: false
            });

            await interaction.reply({
                embeds: [successEmbed('Channel Locked', `${channel} has been locked. 🔒`)]
            });
        } catch (error) {
            console.error('Lock channel error:', error);
            await interaction.reply({
                embeds: [errorEmbed('Error', `Failed to lock channel: ${error.message}`)],
                ephemeral: true
            });
        }
    }
};
