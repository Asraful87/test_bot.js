"""
Channels Cog
Handles channel creation, deletion, and management
"""
import discord
from discord.ext import commands
from utils.embeds import create_success_embed, create_error_embed
from utils.confirmations import ConfirmView


class Channels(commands.Cog):
    def __init__(self, bot):
        self.bot = bot
    
    @commands.command(name='createchannel')
    @commands.has_permissions(manage_channels=True)
    @commands.guild_only()
    async def createchannel(self, ctx, name: str, channel_type: str = "text"):
        """Create a new channel (text or voice)"""
        name = name.lower().replace(' ', '-')
        
        try:
            if channel_type.lower() in ['text', 't']:
                channel = await ctx.guild.create_text_channel(name)
                embed = create_success_embed(f"Text channel {channel.mention} created successfully!")
            elif channel_type.lower() in ['voice', 'v']:
                channel = await ctx.guild.create_voice_channel(name)
                embed = create_success_embed(f"Voice channel **{channel.name}** created successfully!")
            else:
                await ctx.send(embed=create_error_embed("Invalid channel type. Use 'text' or 'voice'."))
                return
            
            await ctx.send(embed=embed)
        except discord.Forbidden:
            await ctx.send(embed=create_error_embed("I don't have permission to create channels."))
    
    @commands.command(name='deletechannel')
    @commands.has_permissions(manage_channels=True)
    @commands.guild_only()
    async def deletechannel(self, ctx, channel: discord.TextChannel = None):
        """Delete a channel"""
        if channel is None:
            channel = ctx.channel
        
        # Confirmation
        view = ConfirmView(ctx.author)
        msg = await ctx.send(
            f"Are you sure you want to delete {channel.mention}?",
            view=view
        )
        await view.wait()
        
        if not view.value:
            await msg.edit(content="Channel deletion cancelled.", view=None)
            return
        
        try:
            channel_name = channel.name
            await channel.delete()
            
            # If we deleted the current channel, send confirmation elsewhere
            if channel == ctx.channel:
                # Find a general channel to send confirmation
                for ch in ctx.guild.text_channels:
                    if ch.permissions_for(ctx.guild.me).send_messages:
                        await ch.send(embed=create_success_embed(f"Channel **#{channel_name}** deleted successfully!"))
                        break
            else:
                await msg.edit(content=None, embed=create_success_embed(f"Channel **#{channel_name}** deleted successfully!"), view=None)
        except discord.Forbidden:
            await msg.edit(content="I don't have permission to delete that channel.", view=None)
    
    @commands.command(name='lockchannel')
    @commands.has_permissions(manage_channels=True)
    @commands.guild_only()
    async def lockchannel(self, ctx, channel: discord.TextChannel = None):
        """Lock a channel (prevent @everyone from sending messages)"""
        if channel is None:
            channel = ctx.channel
        
        try:
            overwrite = channel.overwrites_for(ctx.guild.default_role)
            overwrite.send_messages = False
            await channel.set_permissions(ctx.guild.default_role, overwrite=overwrite)
            
            embed = create_success_embed(f"{channel.mention} has been locked. 🔒")
            await ctx.send(embed=embed)
        except discord.Forbidden:
            await ctx.send(embed=create_error_embed("I don't have permission to lock this channel."))
    
    @commands.command(name='unlockchannel')
    @commands.has_permissions(manage_channels=True)
    @commands.guild_only()
    async def unlockchannel(self, ctx, channel: discord.TextChannel = None):
        """Unlock a channel"""
        if channel is None:
            channel = ctx.channel
        
        try:
            overwrite = channel.overwrites_for(ctx.guild.default_role)
            overwrite.send_messages = None
            await channel.set_permissions(ctx.guild.default_role, overwrite=overwrite)
            
            embed = create_success_embed(f"{channel.mention} has been unlocked. 🔓")
            await ctx.send(embed=embed)
        except discord.Forbidden:
            await ctx.send(embed=create_error_embed("I don't have permission to unlock this channel."))
    
    @commands.command(name='slowmode')
    @commands.has_permissions(manage_channels=True)
    @commands.guild_only()
    async def slowmode(self, ctx, seconds: int, channel: discord.TextChannel = None):
        """Set slowmode for a channel (0 to disable)"""
        if channel is None:
            channel = ctx.channel
        
        if seconds < 0 or seconds > 21600:  # Discord's max is 6 hours
            await ctx.send(embed=create_error_embed("Slowmode must be between 0 and 21600 seconds (6 hours)."))
            return
        
        try:
            await channel.edit(slowmode_delay=seconds)
            
            if seconds == 0:
                embed = create_success_embed(f"Slowmode disabled in {channel.mention}.")
            else:
                embed = create_success_embed(f"Slowmode set to {seconds} seconds in {channel.mention}.")
            
            await ctx.send(embed=embed)
        except discord.Forbidden:
            await ctx.send(embed=create_error_embed("I don't have permission to edit this channel."))
    
    @commands.command(name='setchannelname')
    @commands.has_permissions(manage_channels=True)
    @commands.guild_only()
    async def setchannelname(self, ctx, channel: discord.TextChannel, *, name: str):
        """Change a channel's name"""
        old_name = channel.name
        name = name.lower().replace(' ', '-')
        
        try:
            await channel.edit(name=name)
            embed = create_success_embed(f"Channel name changed from **#{old_name}** to {channel.mention}.")
            await ctx.send(embed=embed)
        except discord.Forbidden:
            await ctx.send(embed=create_error_embed("I don't have permission to edit that channel."))
    
    @commands.command(name='setchanneltopic')
    @commands.has_permissions(manage_channels=True)
    @commands.guild_only()
    async def setchanneltopic(self, ctx, channel: discord.TextChannel, *, topic: str):
        """Change a channel's topic"""
        try:
            await channel.edit(topic=topic)
            embed = create_success_embed(f"Topic updated for {channel.mention}.")
            await ctx.send(embed=embed)
        except discord.Forbidden:
            await ctx.send(embed=create_error_embed("I don't have permission to edit that channel."))


async def setup(bot):
    await bot.add_cog(Channels(bot))
