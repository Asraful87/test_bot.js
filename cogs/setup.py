"""
Setup Cog (SLASH COMMANDS)
Handles server configuration
"""
import discord
from discord.ext import commands
from discord import app_commands
from utils.embeds import create_success_embed, create_error_embed


class SetupCog(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot

    setup = app_commands.Group(name="setup", description="Server setup & configuration")

    @setup.command(name="logchannel", description="Set the mod log channel.")
    @app_commands.checks.has_permissions(administrator=True)
    @app_commands.guild_only()
    async def setup_logchannel(self, interaction: discord.Interaction, channel: discord.TextChannel):
        await self.bot.db.update_server_setting(interaction.guild.id, "log_channel", channel.id)
        await interaction.response.send_message(embed=create_success_embed(f"Mod log channel set to {channel.mention}!"), ephemeral=True)

    @setup.command(name="welcomechannel", description="Set the welcome channel.")
    @app_commands.checks.has_permissions(administrator=True)
    @app_commands.guild_only()
    async def setup_welcomechannel(self, interaction: discord.Interaction, channel: discord.TextChannel):
        await self.bot.db.update_server_setting(interaction.guild.id, "welcome_channel", channel.id)
        await interaction.response.send_message(embed=create_success_embed(f"Welcome channel set to {channel.mention}!"), ephemeral=True)

    @setup.command(name="config", description="View current server configuration.")
    @app_commands.checks.has_permissions(administrator=True)
    @app_commands.guild_only()
    async def setup_config(self, interaction: discord.Interaction):
        settings = await self.bot.db.get_server_settings(interaction.guild.id)

        log_channel = interaction.guild.get_channel(settings.get("log_channel")) if settings.get("log_channel") else None
        welcome_channel = interaction.guild.get_channel(settings.get("welcome_channel")) if settings.get("welcome_channel") else None

        embed = discord.Embed(title="⚙️ Server Configuration", color=discord.Color.blue())
        embed.add_field(name="Mod Log Channel", value=(log_channel.mention if log_channel else "Not set"), inline=False)
        embed.add_field(name="Welcome Channel", value=(welcome_channel.mention if welcome_channel else "Not set"), inline=False)

        await interaction.response.send_message(embed=embed, ephemeral=True)

    @app_commands.checks.has_permissions(administrator=True)
    async def setup_error(self, interaction: discord.Interaction, error: app_commands.AppCommandError):
        if isinstance(error, app_commands.MissingPermissions):
            return await interaction.response.send_message(embed=create_error_embed("You need Administrator permission."), ephemeral=True)
        await interaction.response.send_message(embed=create_error_embed(str(error)), ephemeral=True)


async def setup(bot: commands.Bot):
    await bot.add_cog(SetupCog(bot))
