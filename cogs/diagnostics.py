from __future__ import annotations

import discord
from discord.ext import commands
from discord import app_commands
from typing import List


def _bool_icon(ok: bool) -> str:
    return "✅" if ok else "❌"


class Diagnostics(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot

    # -------------------------
    # Core checks
    # -------------------------
    def _missing_perms_in_channel(self, me: discord.Member, ch: discord.abc.GuildChannel) -> List[str]:
        perms = ch.permissions_for(me)
        required = {
            "view_channel": True,
            "send_messages": True,
            "embed_links": True,
            "read_message_history": True,
            "manage_messages": True,  # needed for antispam delete
            "moderate_members": True, # needed for timeouts
            "kick_members": True,
            "ban_members": True,
        }
        missing = [name for name, need in required.items() if getattr(perms, name) != need]
        return missing

    def _role_position_ok(self, me: discord.Member) -> bool:
        # Bot must be above members it moderates; minimum sanity: not bottom role
        # Better: keep bot role near top.
        return me.top_role is not None and me.top_role.position > 1

    def _intents_ok(self) -> dict:
        intents = getattr(self.bot, "intents", None)
        if intents is None:
            return {"members": False, "message_content": False, "guilds": False}
        return {
            "guilds": bool(intents.guilds),
            "members": bool(intents.members),
            "message_content": bool(intents.message_content),
        }

    def _config_ok(self) -> dict:
        cfg = getattr(self.bot, "config", {}) or {}
        bot_cfg = cfg.get("bot", {}) or {}
        return {
            "has_config": bool(cfg),
            "has_command_prefix": bool(bot_cfg.get("command_prefix")),
            "prefix_value": str(bot_cfg.get("command_prefix", "!")),
        }

    # -------------------------
    # Slash: /health
    # -------------------------
    @app_commands.command(name="health", description="Check if the bot is alive and show latency.")
    @app_commands.guild_only()
    async def health(self, interaction: discord.Interaction):
        latency_ms = round(self.bot.latency * 1000)
        await interaction.response.send_message(f"✅ Bot is running. Latency: **{latency_ms}ms**")

    # -------------------------
    # Slash: /diagnose
    # -------------------------
    @app_commands.command(name="diagnose", description="Check permissions, role position, intents, and config.")
    @app_commands.guild_only()
    async def diagnose(self, interaction: discord.Interaction):
        if not interaction.guild:
            return await interaction.response.send_message("❌ Use this in a server.", ephemeral=True)

        me = interaction.guild.me
        if me is None:
            return await interaction.response.send_message("❌ Could not read bot member in this guild.", ephemeral=True)

        # Check channel perms where command is used
        channel = interaction.channel
        missing = []
        if isinstance(channel, (discord.TextChannel, discord.Thread)):
            missing = self._missing_perms_in_channel(me, channel)

        intents_ok = self._intents_ok()
        cfg_ok = self._config_ok()
        role_ok = self._role_position_ok(me)

        embed = discord.Embed(
            title="🩺 Bot Diagnose Report",
            description="This report helps you find why features fail (delete, timeout, embeds, etc).",
            color=discord.Color.blurple(),
        )

        embed.add_field(
            name="Config",
            value=(
                f"{_bool_icon(cfg_ok['has_config'])} config.yaml loaded\n"
                f"{_bool_icon(cfg_ok['has_command_prefix'])} command_prefix set\n"
                f"Prefix: `{cfg_ok['prefix_value']}`"
            ),
            inline=False,
        )

        embed.add_field(
            name="Intents (code-side)",
            value=(
                f"{_bool_icon(intents_ok['guilds'])} guilds\n"
                f"{_bool_icon(intents_ok['members'])} members\n"
                f"{_bool_icon(intents_ok['message_content'])} message_content"
            ),
            inline=True,
        )

        embed.add_field(
            name="Bot Role Position",
            value=(
                f"{_bool_icon(role_ok)} bot top role: **{me.top_role.name}** (pos {me.top_role.position})\n"
                "Tip: keep bot role near top for kick/ban/timeout."
            ),
            inline=True,
        )

        if missing:
            embed.add_field(
                name=f"Missing perms in #{channel.name}",
                value="❌ " + ", ".join(missing),
                inline=False,
            )
        else:
            embed.add_field(
                name="Channel Permissions",
                value="✅ Looks OK in this channel.",
                inline=False,
            )

        embed.set_footer(text="If something fails, run /diagnose in the same channel it fails in.")
        await interaction.response.send_message(embed=embed, ephemeral=True)

    # -------------------------
    # Prefix fallback: !health / !diagnose
    # -------------------------
    @commands.command(name="diaghealth", aliases=["healthdiag"])  # renamed to avoid collision with Utilities.health
    @commands.guild_only()
    async def health_prefix(self, ctx: commands.Context):
        latency_ms = round(self.bot.latency * 1000)
        await ctx.send(f"✅ Bot is running. Latency: **{latency_ms}ms**")

    @commands.command(name="diagnose")
    @commands.guild_only()
    async def diagnose_prefix(self, ctx: commands.Context):
        me = ctx.guild.me
        if me is None:
            return await ctx.send("❌ Could not read bot member in this guild.")

        missing = self._missing_perms_in_channel(me, ctx.channel)
        intents_ok = self._intents_ok()
        cfg_ok = self._config_ok()
        role_ok = self._role_position_ok(me)

        lines = []
        lines.append(f"Config loaded: {_bool_icon(cfg_ok['has_config'])}")
        lines.append(f"Prefix set: {_bool_icon(cfg_ok['has_command_prefix'])} ({cfg_ok['prefix_value']})")
        lines.append(f"Intents: guilds={_bool_icon(intents_ok['guilds'])}, members={_bool_icon(intents_ok['members'])}, msg_content={_bool_icon(intents_ok['message_content'])}")
        lines.append(f"Bot role ok: {_bool_icon(role_ok)} ({me.top_role.name} pos {me.top_role.position})")

        if missing:
            lines.append("Missing perms here: ❌ " + ", ".join(missing))
        else:
            lines.append("Channel perms: ✅ OK")

        await ctx.send("🩺 **Diagnose**\n" + "\n".join(lines))


async def setup(bot: commands.Bot):
    await bot.add_cog(Diagnostics(bot))
