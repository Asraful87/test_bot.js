"""
Utilities Cog
Handles utility commands like ping, info, etc.
"""
import discord
from discord.ext import commands
from discord import app_commands
import time
import platform

from utils.embeds import EmbedFactory


class Utilities(commands.Cog):
    def __init__(self, bot):
        self.bot = bot
    
    @app_commands.command(name='ping', description='Check bot latency')
    async def ping(self, interaction: discord.Interaction):
        """Check bot latency"""
        api_latency = round(self.bot.latency * 1000, 2)
        
        embed = discord.Embed(
            title="🏓 Pong!",
            color=discord.Color.green()
        )
        embed.add_field(name="API Latency", value=f"{api_latency}ms", inline=True)
        
        try:
            await interaction.response.send_message(embed=embed)
        except Exception as e:
            if not interaction.response.is_done():
                await interaction.response.send_message(f"❌ An error occurred: {e}", ephemeral=True)
    
    @app_commands.command(name='serverinfo', description='Display server information')
    @app_commands.guild_only()
    async def serverinfo(self, interaction: discord.Interaction):
        """Display server information"""
        guild = interaction.guild
        
        embed = discord.Embed(
            title=f"{guild.name}",
            description=guild.description if guild.description else "No description",
            color=discord.Color.blue()
        )
        
        if guild.icon:
            embed.set_thumbnail(url=guild.icon.url)
        
        # Basic info
        embed.add_field(name="Owner", value=guild.owner.mention, inline=True)
        embed.add_field(name="Server ID", value=guild.id, inline=True)
        embed.add_field(name="Created At", value=discord.utils.format_dt(guild.created_at, 'F'), inline=False)
        
        # Counts
        embed.add_field(name="Members", value=guild.member_count, inline=True)
        embed.add_field(name="Channels", value=len(guild.channels), inline=True)
        embed.add_field(name="Roles", value=len(guild.roles), inline=True)
        
        # Boosts
        embed.add_field(name="Boost Level", value=f"Level {guild.premium_tier}", inline=True)
        embed.add_field(name="Boosts", value=guild.premium_subscription_count, inline=True)
        
        try:
            await interaction.response.send_message(embed=embed)
        except Exception as e:
            if not interaction.response.is_done():
                await interaction.response.send_message(f"❌ An error occurred: {e}", ephemeral=True)
    
    @app_commands.command(name='userinfo', description='Display user information')
    @app_commands.guild_only()
    async def userinfo(self, interaction: discord.Interaction, member: discord.Member = None):
        """Display user information"""
        if member is None:
            member = interaction.user
        
        embed = discord.Embed(
            title=f"User Information",
            color=member.color if isinstance(member, discord.Member) else discord.Color.blue()
        )
        
        if member.avatar:
            embed.set_thumbnail(url=member.avatar.url)
        
        embed.add_field(name="Username", value=str(member), inline=True)
        embed.add_field(name="Display Name", value=member.display_name, inline=True)
        embed.add_field(name="ID", value=member.id, inline=True)
        
        embed.add_field(name="Account Created", value=discord.utils.format_dt(member.created_at, 'F'), inline=False)
        if hasattr(member, 'joined_at') and member.joined_at:
            embed.add_field(name="Joined Server", value=discord.utils.format_dt(member.joined_at, 'F'), inline=False)
        
        # Roles
        if isinstance(member, discord.Member):
            roles = [role.mention for role in member.roles[1:]]  # Exclude @everyone
            if roles:
                embed.add_field(
                    name=f"Roles ({len(roles)})",
                    value=', '.join(roles[:10]) if len(roles) <= 10 else f"{', '.join(roles[:10])}... and {len(roles) - 10} more",
                    inline=False
                )
            
            # Status
            status_emoji = {
                discord.Status.online: "🟢",
                discord.Status.idle: "🟡",
                discord.Status.dnd: "🔴",
                discord.Status.offline: "⚫"
            }
            embed.add_field(name="Status", value=f"{status_emoji.get(member.status, '⚫')} {str(member.status).title()}", inline=True)
        
        try:
            await interaction.response.send_message(embed=embed)
        except Exception as e:
            if not interaction.response.is_done():
                await interaction.response.send_message(f"❌ An error occurred: {e}", ephemeral=True)
    
    @app_commands.command(name='avatar', description="Display user's avatar")
    async def avatar(self, interaction: discord.Interaction, member: discord.Member = None):
        """Display user's avatar"""
        if member is None:
            member = interaction.user
        
        embed = discord.Embed(
            title=f"{member}'s Avatar",
            color=member.color if isinstance(member, discord.Member) else discord.Color.blue()
        )
        
        if member.avatar:
            embed.set_image(url=member.avatar.url)
            embed.add_field(name="Avatar URL", value=f"[Click here]({member.avatar.url})")
        else:
            embed.description = "This user has no custom avatar."
        
        try:
            await interaction.response.send_message(embed=embed)
        except Exception as e:
            if not interaction.response.is_done():
                await interaction.response.send_message(f"❌ An error occurred: {e}", ephemeral=True)
    
    @app_commands.command(name='botinfo', description='Display bot information')
    async def botinfo(self, interaction: discord.Interaction):
        """Display bot information"""
        embed = discord.Embed(
            title="Bot Information",
            description="Discord Moderation Bot",
            color=discord.Color.blue()
        )
        
        if self.bot.user.avatar:
            embed.set_thumbnail(url=self.bot.user.avatar.url)
        
        embed.add_field(name="Bot Name", value=self.bot.user.name, inline=True)
        embed.add_field(name="Bot ID", value=self.bot.user.id, inline=True)
        embed.add_field(name="Servers", value=len(self.bot.guilds), inline=True)
        embed.add_field(name="Users", value=sum(g.member_count for g in self.bot.guilds), inline=True)
        embed.add_field(name="Python Version", value=platform.python_version(), inline=True)
        embed.add_field(name="discord.py Version", value=discord.__version__, inline=True)
        
        try:
            await interaction.response.send_message(embed=embed)
        except Exception as e:
            if not interaction.response.is_done():
                await interaction.response.send_message(f"❌ An error occurred: {e}", ephemeral=True)


async def setup(bot):
    await bot.add_cog(Utilities(bot))
