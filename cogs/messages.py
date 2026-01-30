"""
Messages Cog
Handles message purging and message utilities
"""
from __future__ import annotations

import asyncio
import discord
from discord.ext import commands
from discord import app_commands
from utils.embeds import create_success_embed, create_error_embed


class Messages(commands.Cog):
    def __init__(self, bot):
        self.bot = bot

    def _max_purge_amount(self) -> int:
        try:
            return int(self.bot.config.get("moderation", {}).get("max_purge_amount", 100))
        except Exception:
            return 100


class ModGroup(app_commands.Group):
    """Slash commands: /mod ..."""
    def __init__(self, bot):
        super().__init__(name="mod", description="Moderation commands")
        self.bot = bot

    async def _defer(self, interaction: discord.Interaction, *, ephemeral: bool = True) -> None:
        if interaction.response.is_done():
            return
        try:
            await interaction.response.defer(ephemeral=ephemeral)
        except Exception:
            pass

    def _max_purge_amount(self) -> int:
        try:
            return int(self.bot.config.get("moderation", {}).get("max_purge_amount", 100))
        except Exception:
            return 100

    @app_commands.command(name="say", description="Make the bot send a message.")
    @app_commands.checks.has_permissions(manage_messages=True)
    @app_commands.guild_only()
    async def say(
        self,
        interaction: discord.Interaction,
        message: str,
        channel: discord.TextChannel | None = None,
    ):
        await self._defer(interaction, ephemeral=True)

        target_channel = channel or interaction.channel
        if target_channel is None or not isinstance(target_channel, discord.TextChannel):
            return await interaction.followup.send(
                embed=create_error_embed("This command can only target a server text channel."),
                ephemeral=True,
            )

        if interaction.guild is None:
            return await interaction.followup.send(
                embed=create_error_embed("This command can only be used in a server."),
                ephemeral=True,
            )

        me = interaction.guild.me
        if me is None:
            return await interaction.followup.send(
                embed=create_error_embed("Bot member not ready yet. Try again."),
                ephemeral=True,
            )

        perms = target_channel.permissions_for(me)
        if not (perms.view_channel and perms.send_messages):
            return await interaction.followup.send(
                embed=create_error_embed(f"I can't send messages in {target_channel.mention}."),
                ephemeral=True,
            )

        # Safety: avoid accidental @everyone/@here/role pings
        allowed_mentions = discord.AllowedMentions.none()

        try:
            sent = await target_channel.send(content=message, allowed_mentions=allowed_mentions)
        except discord.Forbidden:
            return await interaction.followup.send(
                embed=create_error_embed("I don't have permission to send messages there."),
                ephemeral=True,
            )
        except discord.HTTPException:
            return await interaction.followup.send(
                embed=create_error_embed("Failed to send message due to a Discord API error."),
                ephemeral=True,
            )

        await interaction.followup.send(
            embed=create_success_embed(f"Sent. {sent.jump_url}"),
            ephemeral=True,
        )

    @say.error
    async def say_error(self, interaction: discord.Interaction, error: app_commands.AppCommandError):
        send = interaction.followup.send if interaction.response.is_done() else interaction.response.send_message
        if isinstance(error, app_commands.MissingPermissions):
            return await send(embed=create_error_embed("You need Manage Messages permission."), ephemeral=True)
        await send(embed=create_error_embed(str(error)), ephemeral=True)


async def setup(bot):
    await bot.add_cog(Messages(bot))

    # Reload-safe: remove existing group if present, then add
    try:
        bot.tree.remove_command("mod")
    except Exception:
        pass
    bot.tree.add_command(ModGroup(bot))


async def teardown(bot):
    # Reload-safe cleanup
    try:
        bot.tree.remove_command("mod")
    except Exception:
        pass

