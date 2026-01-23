"""
Setup Cog
Handles server setup wizard (SLASH COMMANDS)
"""
from __future__ import annotations

import discord
from discord.ext import commands
from discord import app_commands

from utils.embeds import create_success_embed, create_error_embed


class Setup(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot

    @app_commands.command(name="setup-wizard", description="Show the setup wizard steps.")
    @app_commands.checks.has_permissions(administrator=True)
    async def wizard(self, interaction: discord.Interaction):
        if not interaction.guild:
            return await interaction.response.send_message("❌ This command can only be used in a server.", ephemeral=True)

        embed = discord.Embed(
            title="🛠️ Server Setup Wizard",
            description="Welcome! Use the commands below to configure the bot.",
            color=discord.Color.blue()
        )

        embed.add_field(
            name="Step 1: Mod Log Channel",
            value="Set a channel where moderation actions will be logged.",
            inline=False
        )
        embed.add_field(
            name="Step 2: Welcome Channel",
            value="Set a channel for welcome messages (optional).",
            inline=False
        )

        embed.add_field(
            name="Commands",
            value=(
                "`/setup-logchannel #channel` - Set mod log channel\n"
                "`/setup-welcomechannel #channel` - Set welcome channel\n"
                "`/setup-config` - View current configuration"
            ),
            inline=False
        )

        await interaction.response.send_message(embed=embed, ephemeral=True)

    @app_commands.command(name="setup-logchannel", description="Set the mod log channel.")
    @app_commands.checks.has_permissions(administrator=True)
    async def setlogchannel(self, interaction: discord.Interaction, channel: discord.TextChannel):
        if not interaction.guild:
            return await interaction.response.send_message("❌ This command can only be used in a server.", ephemeral=True)

        await self.bot.db.update_server_config(
            guild_id=interaction.guild.id,
            mod_log_channel_id=channel.id
        )

        embed = create_success_embed("Config Updated", f"Mod log channel set to {channel.mention}.")
        await interaction.response.send_message(embed=embed, ephemeral=True)

    @app_commands.command(name="setup-welcomechannel", description="Set the welcome channel.")
    @app_commands.checks.has_permissions(administrator=True)
    async def setwelcomechannel(self, interaction: discord.Interaction, channel: discord.TextChannel):
        if not interaction.guild:
            return await interaction.response.send_message("❌ This command can only be used in a server.", ephemeral=True)

        # Save in config_data so your DB schema stays consistent
        existing = await self.bot.db.get_server_config(interaction.guild.id) or {}
        config_data = existing.get("config_data") or {}
        config_data["welcome_channel_id"] = channel.id

        await self.bot.db.update_server_config(
            guild_id=interaction.guild.id,
            config_data=config_data
        )

        embed = create_success_embed("Config Updated", f"Welcome channel set to {channel.mention}.")
        await interaction.response.send_message(embed=embed, ephemeral=True)

    @app_commands.command(name="setup-config", description="View current server configuration.")
    @app_commands.checks.has_permissions(administrator=True)
    async def config(self, interaction: discord.Interaction):
        if not interaction.guild:
            return await interaction.response.send_message("❌ This command can only be used in a server.", ephemeral=True)

        settings = await self.bot.db.get_server_config(interaction.guild.id)

        embed = discord.Embed(
            title="⚙️ Server Configuration",
            color=discord.Color.blue()
        )

        if settings:
            log_channel_id = settings.get("mod_log_channel_id")
            log_channel = interaction.guild.get_channel(log_channel_id) if log_channel_id else None

            config_data = settings.get("config_data") or {}
            welcome_channel_id = config_data.get("welcome_channel_id")
            welcome_channel = interaction.guild.get_channel(welcome_channel_id) if welcome_channel_id else None

            embed.add_field(
                name="Mod Log Channel",
                value=log_channel.mention if log_channel else "Not set",
                inline=True
            )
            embed.add_field(
                name="Welcome Channel",
                value=welcome_channel.mention if welcome_channel else "Not set",
                inline=True
            )
        else:
            embed.description = "No configuration found yet. Run `/setup-wizard` to get started."

        await interaction.response.send_message(embed=embed, ephemeral=True)

    @wizard.error
    @setlogchannel.error
    @setwelcomechannel.error
    @config.error
    async def on_app_command_error(self, interaction: discord.Interaction, error: app_commands.AppCommandError):
        if isinstance(error, app_commands.MissingPermissions):
            return await interaction.response.send_message("❌ You need **Administrator** permission to use this.", ephemeral=True)
        await interaction.response.send_message(f"❌ Error: {error}", ephemeral=True)


async def setup(bot: commands.Bot):
    cog = Setup(bot)
    await bot.add_cog(cog)
    
    # Sync commands to guild for instant testing (if guild_id is configured)
    if hasattr(bot, 'config'):
        guild_id = bot.config.get('bot', {}).get('guild_id')
        if guild_id:
            guild = discord.Object(id=guild_id)
            bot.tree.copy_global_to(guild=guild)
            await bot.tree.sync(guild=guild)
