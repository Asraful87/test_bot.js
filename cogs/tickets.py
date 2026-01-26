from __future__ import annotations

import io
import re
import discord
from discord.ext import commands
from discord import app_commands

from utils.embeds import create_success_embed, create_error_embed


def safe_name(s: str) -> str:
    s = s.lower().strip()
    s = re.sub(r"\s+", "-", s)
    s = re.sub(r"[^a-z0-9\-_]", "", s)
    return s[:90] if s else "user"


def build_topic(opener_id: int, ticket_type: str, status: str) -> str:
    # Keep it simple + parseable
    return f"ticket_opener={opener_id};ticket_type={ticket_type};status={status}"


def parse_topic(topic: str | None) -> dict:
    data = {}
    if not topic:
        return data
    parts = [p.strip() for p in topic.split(";") if p.strip()]
    for p in parts:
        if "=" in p:
            k, v = p.split("=", 1)
            data[k.strip()] = v.strip()
    return data


async def get_log_channel(bot: commands.Bot, guild: discord.Guild) -> discord.TextChannel | None:
    # Try DB config first (if you have it)
    channel_id = None

    # Some of your earlier code used get_server_settings(), some uses get_server_config()
    try:
        if hasattr(bot, "db") and hasattr(bot.db, "get_server_settings"):
            settings = await bot.db.get_server_settings(guild.id)
            if isinstance(settings, dict):
                channel_id = settings.get("log_channel") or settings.get("mod_log_channel_id")
    except Exception:
        pass

    try:
        if channel_id is None and hasattr(bot, "db") and hasattr(bot.db, "get_server_config"):
            cfg = await bot.db.get_server_config(guild.id)
            if isinstance(cfg, dict):
                channel_id = cfg.get("mod_log_channel_id")
    except Exception:
        pass

    if channel_id:
        ch = guild.get_channel(int(channel_id))
        if isinstance(ch, discord.TextChannel):
            return ch

    # Fallback by name
    fallback_name = bot.config.get("tickets", {}).get("transcript_channel_name", "mod-log")
    ch = discord.utils.get(guild.text_channels, name=fallback_name)
    return ch if isinstance(ch, discord.TextChannel) else None


async def make_transcript(channel: discord.TextChannel, limit: int = 200) -> bytes:
    lines = []
    async for msg in channel.history(limit=limit, oldest_first=True):
        author = f"{msg.author} ({msg.author.id})"
        content = msg.content or ""
        ts = msg.created_at.strftime("%Y-%m-%d %H:%M:%S UTC")
        lines.append(f"[{ts}] {author}: {content}")

        # attachments
        for a in msg.attachments:
            lines.append(f"    [attachment] {a.url}")

        # embeds
        if msg.embeds:
            lines.append("    [embed] (content omitted)")

    text = "\n".join(lines) if lines else "(no messages)"
    return text.encode("utf-8", errors="replace")


class TicketActionView(discord.ui.View):
    def __init__(self):
        super().__init__(timeout=None)

    @discord.ui.button(label="Close Ticket", style=discord.ButtonStyle.danger, emoji="🔒", custom_id="ticket:close")
    async def close_ticket(self, interaction: discord.Interaction, button: discord.ui.Button):
        if not interaction.guild or not isinstance(interaction.user, discord.Member):
            return await interaction.response.send_message("❌ Server only.", ephemeral=True)

        if not isinstance(interaction.channel, discord.TextChannel):
            return await interaction.response.send_message("❌ Invalid channel.", ephemeral=True)

        channel = interaction.channel
        meta = parse_topic(channel.topic)
        opener_id = int(meta.get("ticket_opener", "0") or 0)
        status = meta.get("status", "open")

        is_staff = interaction.user.guild_permissions.manage_channels
        is_opener = opener_id == interaction.user.id

        if not (is_staff or is_opener):
            return await interaction.response.send_message("❌ You can’t close this ticket.", ephemeral=True)

        if status == "closed":
            return await interaction.response.send_message("✅ This ticket is already closed.", ephemeral=True)

        await interaction.response.send_message("✅ Closing ticket (locking + transcript)...", ephemeral=True)

        # 1) Transcript to mod-log
        log_ch = await get_log_channel(interaction.client, interaction.guild)  # type: ignore
        if log_ch:
            data = await make_transcript(channel, limit=200)
            file = discord.File(fp=io.BytesIO(data), filename=f"ticket-{channel.id}-transcript.txt")

            embed = discord.Embed(
                title="🎫 Ticket Closed (Transcript)",
                description=f"Channel: {channel.mention}\nClosed by: {interaction.user.mention}",
                color=discord.Color.orange()
            )
            await log_ch.send(embed=embed, file=file)

        # 2) Lock channel (deny send)
        overwrites = channel.overwrites
        # deny @everyone
        overwrites[interaction.guild.default_role] = discord.PermissionOverwrite(view_channel=False)

        # opener keep view but cannot send
        opener = interaction.guild.get_member(opener_id)
        if opener:
            overwrites[opener] = discord.PermissionOverwrite(view_channel=True, send_messages=False, read_message_history=True)

        # bot + staff keep access
        me = interaction.guild.me or interaction.guild.get_member(interaction.client.user.id)  # type: ignore
        if me:
            overwrites[me] = discord.PermissionOverwrite(view_channel=True, send_messages=True, manage_channels=True, read_message_history=True)

        # optional staff role access
        cfg = interaction.client.config.get("tickets", {})  # type: ignore
        staff_role = discord.utils.get(interaction.guild.roles, name=cfg.get("support_role_name", "Moderator"))
        if staff_role:
            overwrites[staff_role] = discord.PermissionOverwrite(view_channel=True, send_messages=True, read_message_history=True)

        # update topic status
        ticket_type = meta.get("ticket_type", "support")
        await channel.edit(
            overwrites=overwrites,
            topic=build_topic(opener_id, ticket_type, "closed"),
            reason=f"Ticket closed by {interaction.user} ({interaction.user.id})"
        )

        # Rename (optional)
        try:
            if not channel.name.startswith("closed-"):
                await channel.edit(name=f"closed-{channel.name}"[:95])
        except Exception:
            pass

        await channel.send("🔒 Ticket closed. Staff can reopen if needed. (Use **Reopen Ticket** button)")

    @discord.ui.button(label="Reopen Ticket", style=discord.ButtonStyle.success, emoji="🔓", custom_id="ticket:reopen")
    async def reopen_ticket(self, interaction: discord.Interaction, button: discord.ui.Button):
        if not interaction.guild or not isinstance(interaction.user, discord.Member):
            return await interaction.response.send_message("❌ Server only.", ephemeral=True)

        if not isinstance(interaction.channel, discord.TextChannel):
            return await interaction.response.send_message("❌ Invalid channel.", ephemeral=True)

        channel = interaction.channel
        meta = parse_topic(channel.topic)
        opener_id = int(meta.get("ticket_opener", "0") or 0)
        status = meta.get("status", "open")

        is_staff = interaction.user.guild_permissions.manage_channels
        if not is_staff:
            return await interaction.response.send_message("❌ Staff only can reopen tickets.", ephemeral=True)

        if status != "closed":
            return await interaction.response.send_message("✅ This ticket is already open.", ephemeral=True)

        # restore opener send permissions
        overwrites = channel.overwrites
        opener = interaction.guild.get_member(opener_id)
        if opener:
            overwrites[opener] = discord.PermissionOverwrite(view_channel=True, send_messages=True, read_message_history=True)

        ticket_type = meta.get("ticket_type", "support")
        await channel.edit(
            overwrites=overwrites,
            topic=build_topic(opener_id, ticket_type, "open"),
            reason=f"Ticket reopened by {interaction.user} ({interaction.user.id})"
        )

        # rename back
        try:
            if channel.name.startswith("closed-"):
                await channel.edit(name=channel.name.replace("closed-", "", 1)[:95])
        except Exception:
            pass

        await interaction.response.send_message("🔓 Ticket reopened.", ephemeral=True)
        await channel.send(f"🔓 Ticket reopened by {interaction.user.mention}.")

    @discord.ui.button(label="Delete Ticket", style=discord.ButtonStyle.secondary, emoji="🗑️", custom_id="ticket:delete")
    async def delete_ticket(self, interaction: discord.Interaction, button: discord.ui.Button):
        if not interaction.guild or not isinstance(interaction.user, discord.Member):
            return await interaction.response.send_message("❌ Server only.", ephemeral=True)

        if not isinstance(interaction.channel, discord.TextChannel):
            return await interaction.response.send_message("❌ Invalid channel.", ephemeral=True)

        if not interaction.user.guild_permissions.manage_channels:
            return await interaction.response.send_message("❌ Staff only can delete tickets.", ephemeral=True)

        await interaction.response.send_message("🗑️ Deleting ticket channel...", ephemeral=True)
        try:
            await interaction.channel.delete(reason=f"Ticket deleted by {interaction.user} ({interaction.user.id})")
        except discord.Forbidden:
            await interaction.followup.send(embed=create_error_embed("I can’t delete this channel."), ephemeral=True)


class TicketSelect(discord.ui.Select):
    def __init__(self, options: list[discord.SelectOption]):
        super().__init__(
            placeholder="Select a ticket category…",
            min_values=1,
            max_values=1,
            options=options,
            custom_id="ticket:select"
        )

    async def callback(self, interaction: discord.Interaction):
        if not interaction.guild or not isinstance(interaction.user, discord.Member):
            return await interaction.response.send_message("❌ Server only.", ephemeral=True)

        bot: commands.Bot = interaction.client  # type: ignore
        cfg = bot.config.get("tickets", {})

        category_name = cfg.get("category_name", "🎫 TICKETS")
        support_role_name = cfg.get("support_role_name", "Moderator")
        one_per_cat = bool(cfg.get("one_ticket_per_category_per_user", True))
        ping_staff = bool(cfg.get("ping_staff_on_create", True))

        # category
        category = discord.utils.get(interaction.guild.categories, name=category_name)
        if not category:
            try:
                category = await interaction.guild.create_category(name=category_name, reason="Ticket system category")
            except discord.Forbidden:
                return await interaction.response.send_message(
                    embed=create_error_embed(f"Category `{category_name}` not found and I can’t create it."),
                    ephemeral=True
                )

        staff_role = discord.utils.get(interaction.guild.roles, name=support_role_name)

        ticket_type = self.values[0]
        username = safe_name(interaction.user.name)
        channel_name = f"ticket-{ticket_type}-{username}"

        # prevent duplicates
        if one_per_cat:
            for ch in category.text_channels:
                meta = parse_topic(ch.topic)
                if meta.get("status", "open") == "open":
                    if meta.get("ticket_opener") == str(interaction.user.id) and meta.get("ticket_type") == ticket_type:
                        return await interaction.response.send_message(
                            embed=create_error_embed("You already have an open ticket in this category."),
                            ephemeral=True
                        )

        # overwrites
        overwrites = {
            interaction.guild.default_role: discord.PermissionOverwrite(view_channel=False),
            interaction.user: discord.PermissionOverwrite(view_channel=True, send_messages=True, read_message_history=True),
        }

        me = interaction.guild.me or interaction.guild.get_member(bot.user.id)  # type: ignore
        if me:
            overwrites[me] = discord.PermissionOverwrite(
                view_channel=True,
                send_messages=True,
                manage_channels=True,
                read_message_history=True
            )

        if staff_role:
            overwrites[staff_role] = discord.PermissionOverwrite(view_channel=True, send_messages=True, read_message_history=True)

        # create channel
        try:
            ticket_channel = await interaction.guild.create_text_channel(
                name=channel_name,
                category=category,
                overwrites=overwrites,
                topic=build_topic(interaction.user.id, ticket_type, "open"),
                reason=f"Ticket opened by {interaction.user} ({interaction.user.id})"
            )
        except discord.Forbidden:
            return await interaction.response.send_message(embed=create_error_embed("I can’t create ticket channels."), ephemeral=True)

        # message inside ticket
        embed = discord.Embed(
            title="🎫 Ticket Opened",
            description=(
                f"Hello {interaction.user.mention}!\n"
                f"Category: **{ticket_type}**\n\n"
                f"Explain your issue and staff will respond."
            ),
            color=discord.Color.blurple()
        )

        ping = ""
        if ping_staff and staff_role:
            ping = staff_role.mention

        await ticket_channel.send(content=ping, embed=embed, view=TicketActionView())

        await interaction.response.send_message(
            embed=create_success_embed(f"Ticket created: {ticket_channel.mention}"),
            ephemeral=True
        )


class TicketPanelView(discord.ui.View):
    def __init__(self, options: list[discord.SelectOption]):
        super().__init__(timeout=None)
        self.add_item(TicketSelect(options))


class Tickets(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot

        # persistent views for buttons/select
        options_cfg = self.bot.config.get("tickets", {}).get("options", [])
        options: list[discord.SelectOption] = []
        for o in options_cfg:
            options.append(
                discord.SelectOption(
                    label=o.get("label", "Support"),
                    value=o.get("value", "support"),
                    description=o.get("description"),
                    emoji=o.get("emoji"),
                )
            )

        if not options:
            options = [
                discord.SelectOption(label="Support", value="support", description="General help", emoji="🛟"),
                discord.SelectOption(label="Report", value="report", description="Report a user", emoji="🚨"),
            ]

        self.bot.add_view(TicketPanelView(options))
        self.bot.add_view(TicketActionView())

    @app_commands.command(name="post_ticket_panel", description="Post the ticket dropdown panel.")
    @app_commands.checks.has_permissions(administrator=True)
    @app_commands.guild_only()
    async def post_ticket_panel(self, interaction: discord.Interaction, channel: discord.TextChannel | None = None):
        target_channel = channel or interaction.channel
        if not isinstance(target_channel, discord.TextChannel):
            return await interaction.response.send_message("❌ Invalid channel.", ephemeral=True)

        cfg = self.bot.config.get("tickets", {})
        title = cfg.get("panel_title", "🎫 Open a Ticket")
        desc = cfg.get("panel_description", "Choose a category from the dropdown to open a private ticket.")

        options_cfg = cfg.get("options", [])
        options: list[discord.SelectOption] = []
        for o in options_cfg:
            options.append(
                discord.SelectOption(
                    label=o.get("label", "Support"),
                    value=o.get("value", "support"),
                    description=o.get("description"),
                    emoji=o.get("emoji"),
                )
            )

        embed = discord.Embed(title=title, description=desc, color=discord.Color.blurple())
        await target_channel.send(embed=embed, view=TicketPanelView(options))
        await interaction.response.send_message("✅ Ticket panel posted.", ephemeral=True)

    @post_ticket_panel.error
    async def post_ticket_panel_error(self, interaction: discord.Interaction, error: app_commands.AppCommandError):
        if isinstance(error, app_commands.MissingPermissions):
            return await interaction.response.send_message("❌ Admin only.", ephemeral=True)
        await interaction.response.send_message(f"❌ Error: {error}", ephemeral=True)


async def setup(bot: commands.Bot):
    await bot.add_cog(Tickets(bot))
