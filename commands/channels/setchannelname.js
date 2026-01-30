const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setchannelname')
        .setDescription("Change a channel's name")
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Channel to rename')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('name')
                .setDescription('New channel name')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    async execute(interaction, bot) {
        const channel = interaction.options.getChannel('channel');
        const name = interaction.options.getString('name').toLowerCase().replace(/ /g, '-');

        const oldName = channel.name;

        try {
            await channel.setName(name, `Channel renamed by ${interaction.user.tag}`);

            await interaction.reply({
                embeds: [successEmbed('Channel Renamed', `Channel name changed from **#${oldName}** to ${channel}.`)]
            });
        } catch (error) {
            console.error('Set channel name error:', error);
            await interaction.reply({
                embeds: [errorEmbed('Error', `Failed to rename channel: ${error.message}`)],
                ephemeral: true
            });
        }
    }
};
