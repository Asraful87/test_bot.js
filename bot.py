"""
Discord Moderation Bot
Main entry point for the bot
"""

import os
import asyncio
import logging
import yaml
import discord
from discord.ext import commands
from dotenv import load_dotenv

from database.db_manager import DatabaseManager

load_dotenv()

TOKEN = os.getenv("DISCORD_TOKEN")
if not TOKEN:
    raise RuntimeError("DISCORD_TOKEN not found. Create a .env file in project root.")

with open("config.yaml", "r") as f:
    config = yaml.safe_load(f)

BOT_PREFIX = config.get("bot", {}).get("command_prefix", "!")
GUILD_ID = config.get("bot", {}).get("guild_id", None)
GUILD_ID = int(GUILD_ID) if GUILD_ID else None

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("modbot")


class ModBot(commands.Bot):
    def __init__(self):
        intents = discord.Intents.default()
        intents.members = True
        intents.guilds = True
        intents.message_content = True

        super().__init__(
            command_prefix=BOT_PREFIX,   # allows ! commands IF your cogs use @commands.command
            intents=intents,
            help_command=None
        )

        self.config = config
        self.db = DatabaseManager()

    async def setup_hook(self):
        await self.db.init_db()
        logger.info("Database initialized")

        cogs = [
            "cogs.moderation",
            "cogs.channels",
            "cogs.messages",
            "cogs.roles",
            "cogs.utilities",
            "cogs.setup",
        ]

        for cog in cogs:
            try:
                await self.load_extension(cog)
                logger.info(f"Loaded cog: {cog}")
            except Exception:
                logger.exception(f"Failed to load cog: {cog}")

        # ✅ FAST: Guild sync (shows in seconds)
        if GUILD_ID:
            try:
                guild = discord.Object(id=GUILD_ID)
                synced = await self.tree.sync(guild=guild)
                logger.info(f"✅ Guild-synced {len(synced)} slash commands to guild {GUILD_ID}")
            except Exception:
                logger.exception("❌ Guild sync failed")
        else:
            logger.warning("⚠️ No guild_id in config.yaml -> guild sync skipped (slash commands may take long).")

        # ✅ Global sync (can take time to appear)
        try:
            synced_global = await self.tree.sync()
            logger.info(f"✅ Globally synced {len(synced_global)} slash commands")
        except Exception:
            logger.exception("❌ Global sync failed")

    async def on_ready(self):
        logger.info(f"Logged in as {self.user} (ID: {self.user.id})")
        logger.info(f"Connected to {len(self.guilds)} guild(s)")

        await self.change_presence(
            activity=discord.Activity(
                type=discord.ActivityType.watching,
                name="/help"
            )
        )


async def main():
    bot = ModBot()
    async with bot:
        await bot.start(TOKEN)


if __name__ == "__main__":
    asyncio.run(main())
