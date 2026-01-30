"""
Welcome Cog
Posts a welcome message when a member joins.
"""
import asyncio
import discord
from discord.ext import commands
import random


class Welcome(commands.Cog):
    def __init__(self, bot):
        self.bot = bot

    @commands.Cog.listener()
    async def on_member_join(self, member: discord.Member):
        try:
            settings = await asyncio.wait_for(self.bot.db.get_server_settings(member.guild.id), timeout=5.0)
            channel_id = settings.get("welcome_channel")
            if not channel_id:
                return

            channel = member.guild.get_channel(channel_id)
            if not channel:
                return

            # Create a beautiful welcome embed with emojis
            welcome_messages = [
                f"🎉 Welcome to **{member.guild.name}**, {member.mention}! We're happy to have you here! 🎊",
                f"👋 Hey {member.mention}! Welcome to our amazing community **{member.guild.name}**! 🌟",
                f"🎈 A wild {member.mention} appeared! Welcome to **{member.guild.name}**! 🎮",
                f"✨ {member.mention} just joined the server! Welcome to **{member.guild.name}**! 🚀",
                f"🌈 {member.mention} joined the party! Welcome to **{member.guild.name}**! 🎊"
            ]

            embed = discord.Embed(
                title="🎉 New Member Joined! 🎉",
                description=random.choice(welcome_messages),
                color=discord.Color.green(),
                timestamp=discord.utils.utcnow()
            )
            
            # Add member info
            embed.add_field(
                name="📊 Member Count",
                value=f"You are member **#{member.guild.member_count}**!",
                inline=True
            )
            
            embed.add_field(
                name="📅 Account Created",
                value=discord.utils.format_dt(member.created_at, 'R'),
                inline=True
            )
            
            # Set member's avatar as thumbnail
            if member.avatar:
                embed.set_thumbnail(url=member.avatar.url)
            
            embed.set_footer(
                text=f"Welcome to {member.guild.name}!",
                icon_url=member.guild.icon.url if member.guild.icon else None
            )
            
            await channel.send(content=member.mention, embed=embed)
            
        except Exception as e:
            # Log error but don't crash
            if hasattr(self.bot, 'logger'):
                self.bot.logger.error(f"Error in welcome message: {e}")


async def setup(bot):
    await bot.add_cog(Welcome(bot))
