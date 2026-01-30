from __future__ import annotations

import discord
from discord.ext import commands
from discord import app_commands

from utils.embeds import create_success_embed, create_error_embed


class VerifyView(discord.ui.View):
    def __init__(self, role_name: str):
        super().__init__(timeout=None)
        self.role_name = role_name

    @discord.ui.button(
        label="Verify",
        style=discord.ButtonStyle.success,
        emoji="✅",
        custom_id="verify:button"
    )
    async def verify_button(self, interaction: discord.Interaction, button: discord.ui.Button):
        try:
            if not interaction.guild or not isinstance(interaction.user, discord.Member):
                return await interaction.response.send_message("❌ Server only.", ephemeral=True)

            role = discord.utils.get(interaction.guild.roles, name=self.role_name)
            if not role:
                return await interaction.response.send_message(
                    embed=create_error_embed(f"Role `{self.role_name}` not found. Create it first."),
                    ephemeral=True
                )

            member = interaction.user

            if role in member.roles:
                return await interaction.response.send_message("✅ You are already verified.", ephemeral=True)

            try:
                await member.add_roles(role, reason="User verified via bot")
                await interaction.response.send_message(embed=create_success_embed("You are verified!"), ephemeral=True)
            except discord.Forbidden:
                await interaction.response.send_message(
                    embed=create_error_embed("I can't assign that role. Move my bot role above the Verified role."),
                    ephemeral=True
                )
        except Exception as e:
            # Catch any unexpected errors to prevent hanging
            try:
                if not interaction.response.is_done():
                    await interaction.response.send_message(f"❌ An error occurred: {e}", ephemeral=True)
                else:
                    await interaction.followup.send(f"❌ An error occurred: {e}", ephemeral=True)
            except Exception:
                pass


class Verification(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot
        role_name = self.bot.config.get("verification", {}).get("role_name", "Verified")
        self.bot.add_view(VerifyView(role_name))

    @app_commands.command(name="post_verify", description="Post the verification panel (button).")
    @app_commands.checks.has_permissions(administrator=True)
    @app_commands.guild_only()
    async def post_verify(self, interaction: discord.Interaction, channel: discord.TextChannel | None = None):
        target_channel = channel or interaction.channel
        if not isinstance(target_channel, discord.TextChannel):
            return await interaction.response.send_message("❌ Invalid channel.", ephemeral=True)

        cfg = self.bot.config.get("verification", {})
        title = cfg.get("panel_title", "✅ Verification")
        desc = cfg.get("panel_description", "Click **Verify** to unlock the server.")
        role_name = cfg.get("role_name", "Verified")

        embed = discord.Embed(title=title, description=desc, color=discord.Color.green())
        view = VerifyView(role_name)

        await target_channel.send(embed=embed, view=view)
        await interaction.response.send_message("✅ Verification panel posted.", ephemeral=True)

    @post_verify.error
    async def post_verify_error(self, interaction: discord.Interaction, error: app_commands.AppCommandError):
        try:
            send = interaction.followup.send if interaction.response.is_done() else interaction.response.send_message
            if isinstance(error, app_commands.MissingPermissions):
                return await send("❌ Admin only.", ephemeral=True)
            await send(f"❌ Error: {error}", ephemeral=True)
        except Exception:
            pass


async def setup(bot: commands.Bot):
    await bot.add_cog(Verification(bot))
