const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('createchannel')
        .setDescription('Create a new channel')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('Name of the channel')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('type')
                .setDescription('Type of channel')
                .setRequired(true)
                .addChoices(
                    { name: 'Text', value: 'text' },
                    { name: 'Voice', value: 'voice' }
                ))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    async execute(interaction, bot) {
        const name = interaction.options.getString('name').toLowerCase().replace(/ /g, '-');
        const type = interaction.options.getString('type');

        try {
            let channel;
            if (type === 'text') {
                channel = await interaction.guild.channels.create({
                    name: name,
                    type: ChannelType.GuildText,
                    reason: `Channel created by ${interaction.user.tag}`
                });
                await interaction.reply({
                    embeds: [successEmbed('Channel Created', `Text channel ${channel} created successfully!`)]
                });
            } else if (type === 'voice') {
                channel = await interaction.guild.channels.create({
                    name: name,
                    type: ChannelType.GuildVoice,
                    reason: `Channel created by ${interaction.user.tag}`
                });
                await interaction.reply({
                    embeds: [successEmbed('Channel Created', `Voice channel **${channel.name}** created successfully!`)]
                });
            }
        } catch (error) {
            console.error('Create channel error:', error);
            await interaction.reply({
                embeds: [errorEmbed('Error', `Failed to create channel: ${error.message}`)],
                ephemeral: true
            });
        }
    }
};
