"""
Moderation Cog
Handles kick, ban, warn, timeout, and other moderation commands
"""
import discord
from discord.ext import commands
from datetime import timedelta
from utils.embeds import create_error_embed
from utils.confirmations import ConfirmView


class Moderation(commands.Cog):
    def __init__(self, bot):
        self.bot = bot
    
    @commands.command(name='kick')
    @commands.has_permissions(kick_members=True)
    @commands.guild_only()
    async def kick(self, ctx, member: discord.Member, *, reason: str = "No reason provided"):
        """Kick a member from the server"""
        if member.top_role >= ctx.author.top_role:
            await ctx.send(embed=create_error_embed("You cannot kick someone with a higher or equal role."))
            return
        
        if member == ctx.guild.owner:
            await ctx.send(embed=create_error_embed("You cannot kick the server owner."))
            return
        
        try:
            await member.kick(reason=f"{reason} | Kicked by {ctx.author}")
            await self.bot.db.log_action(ctx.guild.id, "kick", member.id, ctx.author.id, reason)
            
            embed = discord.Embed(
                title="Member Kicked",
                description=f"{member.mention} has been kicked.\n**Moderator:** {ctx.author.mention}\n**Reason:** {reason}",
                color=discord.Color.orange()
            )
            await ctx.send(embed=embed)
        except discord.Forbidden:
            await ctx.send(embed=create_error_embed("I don't have permission to kick this member."))
    
    @commands.command(name='ban')
    @commands.has_permissions(ban_members=True)
    @commands.guild_only()
    async def ban(self, ctx, member: discord.Member, *, reason: str = "No reason provided"):
        """Ban a member from the server"""
        if member.top_role >= ctx.author.top_role:
            await ctx.send(embed=create_error_embed("You cannot ban someone with a higher or equal role."))
            return
        
        if member == ctx.guild.owner:
            await ctx.send(embed=create_error_embed("You cannot ban the server owner."))
            return
        
        # Confirmation
        view = ConfirmView(ctx.author)
        msg = await ctx.send(
            f"Are you sure you want to ban {member.mention}?",
            view=view
        )
        await view.wait()
        
        if not view.value:
            await msg.edit(content="Ban cancelled.", view=None)
            return
        
        try:
            await member.ban(reason=f"{reason} | Banned by {ctx.author}")
            await self.bot.db.log_action(ctx.guild.id, "ban", member.id, ctx.author.id, reason)
            
            embed = discord.Embed(
                title="Member Banned",
                description=f"{member.mention} has been banned.\n**Moderator:** {ctx.author.mention}\n**Reason:** {reason}",
                color=discord.Color.red()
            )
            await msg.edit(content=None, embed=embed, view=None)
        except discord.Forbidden:
            await msg.edit(content="I don't have permission to ban this member.", view=None)
    
    @commands.command(name='unban')
    @commands.has_permissions(ban_members=True)
    @commands.guild_only()
    async def unban(self, ctx, user_id: int):
        """Unban a user from the server"""
        try:
            user = await self.bot.fetch_user(user_id)
            await ctx.guild.unban(user)
            await self.bot.db.log_action(ctx.guild.id, "unban", user.id, ctx.author.id, None)
            
            embed = discord.Embed(
                title="User Unbanned",
                description=f"{user.mention} has been unbanned.\n**Moderator:** {ctx.author.mention}",
                color=discord.Color.green()
            )
            await ctx.send(embed=embed)
        except discord.NotFound:
            await ctx.send(embed=create_error_embed("User not found or not banned."))
        except discord.Forbidden:
            await ctx.send(embed=create_error_embed("I don't have permission to unban users."))
    
    @commands.command(name='warn')
    @commands.has_permissions(moderate_members=True)
    @commands.guild_only()
    async def warn(self, ctx, member: discord.Member, *, reason: str = "No reason provided"):
        """Warn a member"""
        if member.top_role >= ctx.author.top_role:
            await ctx.send(embed=create_error_embed("You cannot warn someone with a higher or equal role."))
            return
        
        # Add warning to database
        await self.bot.db.add_warning(ctx.guild.id, member.id, ctx.author.id, reason)
        await self.bot.db.log_action(ctx.guild.id, "warn", member.id, ctx.author.id, reason)
        
        # Get warning count
        warnings = await self.bot.db.get_warnings(ctx.guild.id, member.id)
        warning_count = len(warnings)
        
        embed = discord.Embed(
            title="Member Warned",
            description=f"{member.mention} has been warned.\n**Total Warnings:** {warning_count}\n**Moderator:** {ctx.author.mention}\n**Reason:** {reason}",
            color=discord.Color.orange()
        )
        await ctx.send(embed=embed)
        
        # Try to DM the user
        try:
            dm_embed = discord.Embed(
                title=f"Warning in {ctx.guild.name}",
                description=f"**Reason:** {reason}\n**Total Warnings:** {warning_count}",
                color=discord.Color.orange()
            )
            await member.send(embed=dm_embed)
        except:
            pass
        
        # Check for auto-action
        warn_threshold = self.bot.config['moderation']['warn_threshold']
        auto_action = self.bot.config['moderation']['warn_threshold_action']
        
        if warning_count >= warn_threshold and auto_action != 'none':
            if auto_action == 'timeout':
                duration = self.bot.config['moderation']['warn_threshold_timeout_duration']
                await member.timeout(timedelta(minutes=duration), reason=f"Reached {warn_threshold} warnings")
                await ctx.send(f"⚠️ {member.mention} has been timed out for reaching {warn_threshold} warnings.")
            elif auto_action == 'kick':
                await member.kick(reason=f"Reached {warn_threshold} warnings")
                await ctx.send(f"⚠️ {member.mention} has been kicked for reaching {warn_threshold} warnings.")
            elif auto_action == 'ban':
                await member.ban(reason=f"Reached {warn_threshold} warnings")
                await ctx.send(f"⚠️ {member.mention} has been banned for reaching {warn_threshold} warnings.")
    
    @commands.command(name='warnings')
    @commands.has_permissions(moderate_members=True)
    @commands.guild_only()
    async def warnings(self, ctx, member: discord.Member):
        """View warnings for a member"""
        warnings = await self.bot.db.get_warnings(ctx.guild.id, member.id)
        
        if not warnings:
            await ctx.send(f"{member.mention} has no warnings.")
            return
        
        embed = discord.Embed(
            title=f"Warnings for {member}",
            description=f"Total warnings: {len(warnings)}",
            color=discord.Color.orange()
        )
        
        for i, warning in enumerate(warnings[:10], 1):  # Show last 10
            moderator = ctx.guild.get_member(warning['moderator_id'])
            mod_name = moderator.name if moderator else f"ID: {warning['moderator_id']}"
            
            embed.add_field(
                name=f"Warning {i}",
                value=f"**Reason:** {warning['reason'] or 'No reason'}\n**By:** {mod_name}\n**Date:** {warning['timestamp']}",
                inline=False
            )
        
        await ctx.send(embed=embed)
    
    @commands.command(name='clearwarnings')
    @commands.has_permissions(administrator=True)
    @commands.guild_only()
    async def clearwarnings(self, ctx, member: discord.Member):
        """Clear all warnings for a member"""
        await self.bot.db.clear_warnings(ctx.guild.id, member.id)
        await ctx.send(f"✅ Cleared all warnings for {member.mention}.")
    
    @commands.command(name='timeout')
    @commands.has_permissions(moderate_members=True)
    @commands.guild_only()
    async def timeout(self, ctx, member: discord.Member, duration: int, *, reason: str = "No reason provided"):
        """Timeout a member (duration in minutes)"""
        if member.top_role >= ctx.author.top_role:
            await ctx.send(embed=create_error_embed("You cannot timeout someone with a higher or equal role."))
            return
        
        try:
            await member.timeout(timedelta(minutes=duration), reason=f"{reason} | Timed out by {ctx.author}")
            await self.bot.db.log_action(ctx.guild.id, "timeout", member.id, ctx.author.id, reason)
            
            embed = discord.Embed(
                title="Member Timed Out",
                description=f"{member.mention} has been timed out for {duration} minutes.\n**Moderator:** {ctx.author.mention}\n**Reason:** {reason}",
                color=discord.Color.orange()
            )
            await ctx.send(embed=embed)
        except discord.Forbidden:
            await ctx.send(embed=create_error_embed("I don't have permission to timeout this member."))
    
    @commands.command(name='untimeout')
    @commands.has_permissions(moderate_members=True)
    @commands.guild_only()
    async def untimeout(self, ctx, member: discord.Member):
        """Remove timeout from a member"""
        try:
            await member.timeout(None)
            await self.bot.db.log_action(ctx.guild.id, "untimeout", member.id, ctx.author.id, None)
            
            embed = discord.Embed(
                title="Timeout Removed",
                description=f"Timeout removed from {member.mention}.\n**Moderator:** {ctx.author.mention}",
                color=discord.Color.green()
            )
            await ctx.send(embed=embed)
        except discord.Forbidden:
            await ctx.send(embed=create_error_embed("I don't have permission to remove timeout."))


async def setup(bot):
    await bot.add_cog(Moderation(bot))
