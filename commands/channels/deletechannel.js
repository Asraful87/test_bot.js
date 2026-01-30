const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('deletechannel')
        .setDescription('Delete a channel')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Channel to delete (defaults to current channel)')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    async execute(interaction, bot) {
        const channel = interaction.options.getChannel('channel') || interaction.channel;

        try {
            await interaction.reply({
                content: `⚠️ Deleting channel ${channel}...`,
                ephemeral: true
            });

            const channelName = channel.name;
            await channel.delete(`Channel deleted by ${interaction.user.tag}`);

            // If we deleted the current channel, the reply won't go through
            // Find another channel to confirm
            if (channel.id === interaction.channel.id) {
                const confirmChannel = interaction.guild.channels.cache.find(
                    ch => ch.isTextBased() && ch.permissionsFor(interaction.guild.members.me).has(PermissionFlagsBits.SendMessages)
                );
                if (confirmChannel) {
                    await confirmChannel.send({
                        embeds: [successEmbed('Channel Deleted', `Channel **#${channelName}** deleted successfully!`)]
                    });
                }
            }
        } catch (error) {
            console.error('Delete channel error:', error);
            await interaction.followUp({
                embeds: [errorEmbed('Error', `Failed to delete channel: ${error.message}`)],
                ephemeral: true
            }).catch(() => {});
        }
    }
};
