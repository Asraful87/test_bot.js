const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Warn a member')
        .addUserOption(option =>
            option.setName('member')
                .setDescription('The member to warn')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for warning')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction, bot) {
        const user = interaction.options.getUser('member');
        const reason = interaction.options.getString('reason');

        const moderationConfig = bot?.config?.moderation || {};
        const warnThreshold = Number.isFinite(Number(moderationConfig.warn_threshold))
            ? Number(moderationConfig.warn_threshold)
            : 0;
        const warnAction = (moderationConfig.warn_threshold_action || '').toString().trim().toLowerCase();
        const warnTimeoutRaw = Number(moderationConfig.warn_threshold_timeout_duration);
        const warnTimeoutMinutes = Number.isFinite(warnTimeoutRaw) && warnTimeoutRaw > 0
            ? warnTimeoutRaw
            : 60;
        
        let member;
        try {
            member = await interaction.guild.members.fetch(user.id);
        } catch (error) {
            return interaction.reply({ 
                embeds: [errorEmbed('Error', 'Member not found in this server.')], 
                ephemeral: true 
            });
        }
        
        if (!member) {
            return interaction.reply({ 
                embeds: [errorEmbed('Error', 'Member not found in this server.')], 
                ephemeral: true 
            });
        }
        
        const target = member.user;

        try {
            // Add warning to database
            const warningId = bot.db.addWarning(
                interaction.guild.id,
                target.id,
                interaction.user.id,
                reason
            );

            // Log action
            bot.db.logAction(
                interaction.guild.id,
                'warn',
                target.id,
                interaction.user.id,
                reason
            );

            const warningCount = bot.db.getWarningCount(interaction.guild.id, target.id);

            let autoActionResult = null;
            let autoActionError = null;
            const disabledActions = new Set(['none', 'off', 'disabled']);

            if (warnThreshold > 0 && warningCount >= warnThreshold && warnAction && !disabledActions.has(warnAction)) {
                const actionReason = `Auto-action: reached ${warnThreshold} warnings`;
                try {
                    if (warnAction === 'timeout') {
                        if (member.moderatable) {
                            await member.timeout(warnTimeoutMinutes * 60 * 1000, actionReason);
                            autoActionResult = `Timeout for ${warnTimeoutMinutes} minute(s)`;
                        } else {
                            autoActionError = 'Auto-timeout failed (missing permissions).';
                        }
                    } else if (warnAction === 'kick') {
                        if (member.kickable) {
                            await member.kick(actionReason);
                            autoActionResult = 'Kicked from server';
                        } else {
                            autoActionError = 'Auto-kick failed (missing permissions).';
                        }
                    } else if (warnAction === 'ban') {
                        if (member.bannable) {
                            await member.ban({ reason: actionReason });
                            autoActionResult = 'Banned from server';
                        } else {
                            autoActionError = 'Auto-ban failed (missing permissions).';
                        }
                    }
                } catch (autoErr) {
                    autoActionError = `Auto-action failed: ${autoErr.message || autoErr}`;
                }
            }

            const autoActionLine = autoActionResult
                ? `\n**Auto-Action:** ${autoActionResult}`
                : autoActionError
                    ? `\n**Auto-Action:** ${autoActionError}`
                    : '';

            await interaction.reply({
                embeds: [successEmbed(
                    'Member Warned',
                    `${target.tag} has been warned.\n**Reason:** ${reason}\n**Total Warnings:** ${warningCount}${autoActionLine}`
                )]
            });

            // Try to DM the user
            try {
                await target.send(`You have been warned in **${interaction.guild.name}**\n**Reason:** ${reason}\n**Total Warnings:** ${warningCount}`);
            } catch (error) {
                // User has DMs disabled
            }
        } catch (error) {
            console.error(error);
            await interaction.reply({ 
                embeds: [errorEmbed('Error', 'Failed to warn member.')], 
                ephemeral: true 
            });
        }
    }
};
