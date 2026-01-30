"""
Channels Cog
Handles channel creation, deletion, and management
"""
import discord
from discord.ext import commands
from discord import app_commands
from utils.embeds import create_success_embed, create_error_embed


class Channels(commands.Cog):
    def __init__(self, bot):
        self.bot = bot
    
    @app_commands.command(name='createchannel', description='Create a new channel (text or voice)')
    @app_commands.checks.has_permissions(manage_channels=True)
    @app_commands.guild_only()
    async def createchannel(self, interaction: discord.Interaction, name: str, channel_type: str = "text"):
        """Create a new channel (text or voice)"""
        name = name.lower().replace(' ', '-')
        
        try:
            if channel_type.lower() in ['text', 't']:
                channel = await interaction.guild.create_text_channel(name)
                embed = create_success_embed(f"Text channel {channel.mention} created successfully!")
            elif channel_type.lower() in ['voice', 'v']:
                channel = await interaction.guild.create_voice_channel(name)
                embed = create_success_embed(f"Voice channel **{channel.name}** created successfully!")
            else:
                await interaction.response.send_message(embed=create_error_embed("Invalid channel type. Use 'text' or 'voice'."), ephemeral=True)
                return
            
            await interaction.response.send_message(embed=embed)
        except discord.Forbidden:
            await interaction.response.send_message(embed=create_error_embed("I don't have permission to create channels."), ephemeral=True)
        except Exception as e:
            if not interaction.response.is_done():
                await interaction.response.send_message(f"❌ An error occurred: {e}", ephemeral=True)
    
    @app_commands.command(name='deletechannel', description='Delete a channel')
    @app_commands.checks.has_permissions(manage_channels=True)
    @app_commands.guild_only()
    async def deletechannel(self, interaction: discord.Interaction, channel: discord.TextChannel = None):
        """Delete a channel"""
        if channel is None:
            channel = interaction.channel
        
        try:
            await interaction.response.send_message(f"⚠️ Deleting channel {channel.mention}...", ephemeral=True)
            channel_name = channel.name
            await channel.delete()
            
            # If we deleted the current channel, find another to confirm
            if channel == interaction.channel:
                for ch in interaction.guild.text_channels:
                    if ch.permissions_for(interaction.guild.me).send_messages:
                        await ch.send(embed=create_success_embed(f"Channel **#{channel_name}** deleted successfully!"))
                        break
            else:
                await interaction.followup.send(embed=create_success_embed(f"Channel **#{channel_name}** deleted successfully!"), ephemeral=True)
        except discord.Forbidden:
            if not interaction.response.is_done():
                await interaction.response.send_message(embed=create_error_embed("I don't have permission to delete that channel."), ephemeral=True)
            else:
                await interaction.followup.send(embed=create_error_embed("I don't have permission to delete that channel."), ephemeral=True)
        except Exception as e:
            if not interaction.response.is_done():
                await interaction.response.send_message(f"❌ An error occurred: {e}", ephemeral=True)
            else:
                await interaction.followup.send(f"❌ An error occurred: {e}", ephemeral=True)
    
    @app_commands.command(name='lockchannel', description='Lock a channel (prevent @everyone from sending messages)')
    @app_commands.checks.has_permissions(manage_channels=True)
    @app_commands.guild_only()
    async def lockchannel(self, interaction: discord.Interaction, channel: discord.TextChannel = None):
        """Lock a channel (prevent @everyone from sending messages)"""
        if channel is None:
            channel = interaction.channel
        
        try:
            overwrite = channel.overwrites_for(interaction.guild.default_role)
            overwrite.send_messages = False
            await channel.set_permissions(interaction.guild.default_role, overwrite=overwrite)
            
            embed = create_success_embed(f"{channel.mention} has been locked. 🔒")
            await interaction.response.send_message(embed=embed)
        except discord.Forbidden:
            await interaction.response.send_message(embed=create_error_embed("I don't have permission to lock this channel."), ephemeral=True)
        except Exception as e:
            if not interaction.response.is_done():
                await interaction.response.send_message(f"❌ An error occurred: {e}", ephemeral=True)
    
    @app_commands.command(name='unlockchannel', description='Unlock a channel')
    @app_commands.checks.has_permissions(manage_channels=True)
    @app_commands.guild_only()
    async def unlockchannel(self, interaction: discord.Interaction, channel: discord.TextChannel = None):
        """Unlock a channel"""
        if channel is None:
            channel = interaction.channel
        
        try:
            overwrite = channel.overwrites_for(interaction.guild.default_role)
            overwrite.send_messages = None
            await channel.set_permissions(interaction.guild.default_role, overwrite=overwrite)
            
            embed = create_success_embed(f"{channel.mention} has been unlocked. 🔓")
            await interaction.response.send_message(embed=embed)
        except discord.Forbidden:
            await interaction.response.send_message(embed=create_error_embed("I don't have permission to unlock this channel."), ephemeral=True)
        except Exception as e:
            if not interaction.response.is_done():
                await interaction.response.send_message(f"❌ An error occurred: {e}", ephemeral=True)
    
    @app_commands.command(name='slowmode', description='Set slowmode for a channel (0 to disable)')
    @app_commands.checks.has_permissions(manage_channels=True)
    @app_commands.guild_only()
    async def slowmode(self, interaction: discord.Interaction, seconds: int, channel: discord.TextChannel = None):
        """Set slowmode for a channel (0 to disable)"""
        if channel is None:
            channel = interaction.channel
        
        if seconds < 0 or seconds > 21600:  # Discord's max is 6 hours
            await interaction.response.send_message(embed=create_error_embed("Slowmode must be between 0 and 21600 seconds (6 hours)."), ephemeral=True)
            return
        
        try:
            await channel.edit(slowmode_delay=seconds)
            
            if seconds == 0:
                embed = create_success_embed(f"Slowmode disabled in {channel.mention}.")
            else:
                embed = create_success_embed(f"Slowmode set to {seconds} seconds in {channel.mention}.")
            
            await interaction.response.send_message(embed=embed)
        except discord.Forbidden:
            await interaction.response.send_message(embed=create_error_embed("I don't have permission to edit this channel."), ephemeral=True)
        except Exception as e:
            if not interaction.response.is_done():
                await interaction.response.send_message(f"❌ An error occurred: {e}", ephemeral=True)
    
    @app_commands.command(name='setchannelname', description="Change a channel's name")
    @app_commands.checks.has_permissions(manage_channels=True)
    @app_commands.guild_only()
    async def setchannelname(self, interaction: discord.Interaction, channel: discord.TextChannel, name: str):
        """Change a channel's name"""
        old_name = channel.name
        name = name.lower().replace(' ', '-')
        
        try:
            await channel.edit(name=name)
            embed = create_success_embed(f"Channel name changed from **#{old_name}** to {channel.mention}.")
            await interaction.response.send_message(embed=embed)
        except discord.Forbidden:
            await interaction.response.send_message(embed=create_error_embed("I don't have permission to edit that channel."), ephemeral=True)
        except Exception as e:
            if not interaction.response.is_done():
                await interaction.response.send_message(f"❌ An error occurred: {e}", ephemeral=True)
    
    @app_commands.command(name='setchanneltopic', description="Change a channel's topic")
    @app_commands.checks.has_permissions(manage_channels=True)
    @app_commands.guild_only()
    async def setchanneltopic(self, interaction: discord.Interaction, channel: discord.TextChannel, topic: str):
        """Change a channel's topic"""
        try:
            await channel.edit(topic=topic)
            embed = create_success_embed(f"Topic updated for {channel.mention}.")
            await interaction.response.send_message(embed=embed)
        except discord.Forbidden:
            await interaction.response.send_message(embed=create_error_embed("I don't have permission to edit that channel."), ephemeral=True)
        except Exception as e:
            if not interaction.response.is_done():
                await interaction.response.send_message(f"❌ An error occurred: {e}", ephemeral=True)


async def setup(bot):
    await bot.add_cog(Channels(bot))
