"""
Messages Cog
Handles message purging and message utilities
"""
import discord
from discord.ext import commands
from utils.embeds import create_success_embed, create_error_embed
from utils.confirmations import ConfirmView


class Messages(commands.Cog):
    def __init__(self, bot):
        self.bot = bot
    
    @commands.command(name='purge')
    @commands.has_permissions(manage_messages=True)
    @commands.guild_only()
    async def purge(self, ctx, amount: int):
        """Delete multiple messages (max 100)"""
        if amount < 1:
            await ctx.send(embed=create_error_embed("Amount must be at least 1."))
            return
        
        if amount > 100:
            await ctx.send(embed=create_error_embed("Cannot delete more than 100 messages at once."))
            return
        
        try:
            # Delete the command message
            await ctx.message.delete()
            
            # Delete the specified amount of messages
            deleted = await ctx.channel.purge(limit=amount)
            
            # Send confirmation (will auto-delete)
            msg = await ctx.send(embed=create_success_embed(f"Deleted {len(deleted)} messages."))
            await msg.delete(delay=3)
            
            await self.bot.db.log_action(ctx.guild.id, "purge", ctx.author.id, ctx.author.id, f"Purged {len(deleted)} messages")
        except discord.Forbidden:
            await ctx.send(embed=create_error_embed("I don't have permission to delete messages."))
        except discord.HTTPException:
            await ctx.send(embed=create_error_embed("Failed to delete messages. Messages might be too old."))
    
    @commands.command(name='clear')
    @commands.has_permissions(manage_messages=True)
    @commands.guild_only()
    async def clear(self, ctx, amount: int, member: discord.Member = None):
        """Delete messages from a specific user or all messages"""
        if amount < 1:
            await ctx.send(embed=create_error_embed("Amount must be at least 1."))
            return
        
        if amount > 100:
            await ctx.send(embed=create_error_embed("Cannot delete more than 100 messages at once."))
            return
        
        try:
            await ctx.message.delete()
            
            def check(msg):
                if member is None:
                    return True
                return msg.author == member
            
            deleted = await ctx.channel.purge(limit=amount, check=check)
            
            if member:
                msg = await ctx.send(embed=create_success_embed(f"Deleted {len(deleted)} messages from {member.mention}."))
            else:
                msg = await ctx.send(embed=create_success_embed(f"Deleted {len(deleted)} messages."))
            
            await msg.delete(delay=3)
            
            target = f"from {member}" if member else ""
            await self.bot.db.log_action(ctx.guild.id, "clear", ctx.author.id, ctx.author.id, f"Cleared {len(deleted)} messages {target}")
        except discord.Forbidden:
            await ctx.send(embed=create_error_embed("I don't have permission to delete messages."))
        except discord.HTTPException:
            await ctx.send(embed=create_error_embed("Failed to delete messages. Messages might be too old."))
    
    @commands.command(name='pin')
    @commands.has_permissions(manage_messages=True)
    @commands.guild_only()
    async def pin(self, ctx, message_id: int):
        """Pin a message by ID"""
        try:
            message = await ctx.channel.fetch_message(message_id)
            await message.pin()
            await ctx.send(embed=create_success_embed("Message pinned successfully!"), delete_after=3)
        except discord.NotFound:
            await ctx.send(embed=create_error_embed("Message not found."))
        except discord.Forbidden:
            await ctx.send(embed=create_error_embed("I don't have permission to pin messages."))
        except discord.HTTPException:
            await ctx.send(embed=create_error_embed("Failed to pin message. Channel might have too many pinned messages."))
    
    @commands.command(name='unpin')
    @commands.has_permissions(manage_messages=True)
    @commands.guild_only()
    async def unpin(self, ctx, message_id: int):
        """Unpin a message by ID"""
        try:
            message = await ctx.channel.fetch_message(message_id)
            await message.unpin()
            await ctx.send(embed=create_success_embed("Message unpinned successfully!"), delete_after=3)
        except discord.NotFound:
            await ctx.send(embed=create_error_embed("Message not found."))
        except discord.Forbidden:
            await ctx.send(embed=create_error_embed("I don't have permission to unpin messages."))
    
    @commands.command(name='announce')
    @commands.has_permissions(manage_messages=True)
    @commands.guild_only()
    async def announce(self, ctx, channel: discord.TextChannel, *, message: str):
        """Send an announcement to a channel"""
        embed = discord.Embed(
            title="📢 Announcement",
            description=message,
            color=discord.Color.blue()
        )
        embed.set_footer(text=f"Announced by {ctx.author}", icon_url=ctx.author.avatar.url if ctx.author.avatar else None)
        
        try:
            await channel.send(embed=embed)
            await ctx.send(embed=create_success_embed(f"Announcement sent to {channel.mention}!"))
        except discord.Forbidden:
            await ctx.send(embed=create_error_embed(f"I don't have permission to send messages in {channel.mention}."))
    
    @commands.command(name='embed')
    @commands.has_permissions(manage_messages=True)
    @commands.guild_only()
    async def create_embed(self, ctx, title: str, *, description: str):
        """Create a custom embed"""
        embed = discord.Embed(
            title=title,
            description=description,
            color=discord.Color.blue()
        )
        embed.set_footer(text=f"Created by {ctx.author}", icon_url=ctx.author.avatar.url if ctx.author.avatar else None)
        
        await ctx.send(embed=embed)


async def setup(bot):
    await bot.add_cog(Messages(bot))
