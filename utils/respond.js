const { getLogger } = require('./logging');
const logger = getLogger('respond');

/**
 * Safely reply to an interaction, handling replied/deferred states
 * Prevents "Interaction already acknowledged" errors
 * 
 * @param {import('discord.js').Interaction} interaction
 * @param {import('discord.js').InteractionReplyOptions} payload
 * @returns {Promise<any>}
 */
async function safeReply(interaction, payload) {
    try {
        if (!interaction.deferred && !interaction.replied) {
            return await interaction.reply(payload);
        } else if (interaction.deferred) {
            return await interaction.editReply(payload);
        } else {
            return await interaction.followUp(payload);
        }
    } catch (error) {
        logger.error(`Failed to reply to interaction ${interaction.id}:`, error.message);
        throw error;
    }
}

/**
 * Reply with an error message, ensuring ephemeral delivery
 * 
 * @param {import('discord.js').Interaction} interaction
 * @param {Error|string} error - Error object or message
 * @param {string} fallbackMessage - User-friendly error context
 * @returns {Promise<any>}
 */
async function safeError(interaction, error, fallbackMessage = 'An error occurred') {
    const message = error instanceof Error ? error.message : String(error);
    const content = `❌ ${fallbackMessage}: ${message}`;
    
    try {
        return await safeReply(interaction, {
            content,
            ephemeral: true
        });
    } catch (replyError) {
        logger.error('Failed to send error message:', replyError.message);
    }
}

/**
 * Defer reply if not already deferred/replied
 * 
 * @param {import('discord.js').Interaction} interaction
 * @param {boolean} ephemeral - Whether reply should be ephemeral
 * @returns {Promise<void>}
 */
async function safeDefer(interaction, ephemeral = false) {
    if (!interaction.deferred && !interaction.replied) {
        return await interaction.deferReply({ ephemeral });
    }
}

module.exports = {
    safeReply,
    safeError,
    safeDefer
};
