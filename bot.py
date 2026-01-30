import discord
from discord.ext import commands
import os
import yaml
import asyncio
from dotenv import load_dotenv
from database.db_manager import DatabaseManager
from utils.logging import get_logger, setup_logging

load_dotenv()

with open("config.yaml", "r", encoding="utf-8-sig") as f:
    config = yaml.safe_load(f)

# Configure logging once, then get a named logger
setup_logging()
logger = get_logger("modbot")


class ModBot(commands.Bot):
    def __init__(self):
        intents = discord.Intents.default()
        intents.message_content = True
        intents.members = True
        intents.guilds = True

        super().__init__(
            command_prefix=config["bot"].get("command_prefix", "!"),  # ✅ enable prefix too
            intents=intents,
            help_command=None,
        )

        self.config = config
        self.db = DatabaseManager()
        self.synced = False # Prevent re-syncing

    async def setup_hook(self):
        # ✅ init DB once
        try:
            await self.db.init_db()
            logger.info("Database initialized")
        except Exception as e:
            logger.error(f"DB init failed: {e}")

        cogs = [
            "cogs.moderation",
            "cogs.channels",
            "cogs.messages",
            "cogs.roles",
            "cogs.utilities",
            "cogs.setup",
            "cogs.verification",
            "cogs.tickets",
            "cogs.antiraid",
            "cogs.antispam",
            "cogs.automod",
            "cogs.Welcome",
            "cogs.diagnostics",
            "cogs.music",
        ]

        for cog in cogs:
            try:
                await self.load_extension(cog)
                logger.info(f"Loaded cog: {cog}")
            except Exception as e:
                logger.exception(f"Failed to load cog: {cog}")
                continue

    async def on_ready(self):
        if not self.synced:
            guild_id = os.getenv("GUILD_ID")
            if guild_id and guild_id.isdigit():
                gid = int(guild_id)
                guild_obj = discord.Object(id=gid)
                self.tree.copy_global_to(guild=guild_obj)
                synced = await self.tree.sync(guild=guild_obj)
                logger.info(f"✅ Guild-synced {len(synced)} slash commands to guild {gid}")
            else:
                synced = await self.tree.sync()
                logger.info(f"✅ Globally synced {len(synced)} slash commands")
            self.synced = True

        logger.info(f"Logged in as {self.user} (ID: {self.user.id})")
        logger.info(f"Connected to {len(self.guilds)} guild(s)")

    async def on_app_command_error(self, interaction: discord.Interaction, error: Exception):
        """Global error handler for slash commands to prevent hanging interactions"""
        logger.error(f"Command error in {interaction.command.name if interaction.command else 'unknown'}: {error}", exc_info=error)
        
        # Unwrap the error if it's wrapped
        if hasattr(error, 'original'):
            error = error.original
        
        error_message = f"❌ An error occurred: {str(error)}"
        
        try:
            # Try to respond if we haven't already
            if not interaction.response.is_done():
                await interaction.response.send_message(error_message, ephemeral=True)
            else:
                # If we already responded, try followup
                await interaction.followup.send(error_message, ephemeral=True)
        except discord.HTTPException:
            # If all else fails, log it
            logger.error(f"Failed to send error message to user for interaction {interaction.id}")


async def main():
    bot = ModBot()
    async with bot:
        token = os.getenv("DISCORD_TOKEN")
        if not token:
            raise RuntimeError("DISCORD_TOKEN is not set. Add it to your .env file (DISCORD_TOKEN=...).")

        try:
            await bot.start(token)
        except KeyboardInterrupt:
            logger.info("Bot shutdown requested by user (Ctrl+C)")
        except discord.LoginFailure as exc:
            logger.error("Discord login failed: invalid DISCORD_TOKEN. Regenerate the bot token in the Developer Portal and update your .env file.")
            raise exc
        except Exception as e:
            logger.error(f"Unexpected error during bot execution: {e}", exc_info=True)
            raise


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Bot stopped")
    except Exception as e:
        logger.error(f"Fatal error: {e}", exc_info=True)
