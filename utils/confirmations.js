const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

async function confirm(interaction, message, timeout = 30000) {
    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('confirm')
                .setLabel('Confirm')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('cancel')
                .setLabel('Cancel')
                .setStyle(ButtonStyle.Danger)
        );

    const response = await interaction.reply({
        content: message,
        components: [row],
        ephemeral: true,
        fetchReply: true
    });

    try {
        const confirmation = await response.awaitMessageComponent({
            filter: i => i.user.id === interaction.user.id,
            time: timeout
        });

        if (confirmation.customId === 'confirm') {
            await confirmation.update({ components: [] });
            return true;
        } else {
            await confirmation.update({ 
                content: '❌ Action cancelled.', 
                components: [] 
            });
            return false;
        }
    } catch (error) {
        await interaction.editReply({ 
            content: '❌ Confirmation timed out.', 
            components: [] 
        });
        return false;
    }
}

module.exports = { confirm };
