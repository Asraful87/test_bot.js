"""
Roles Cog
Handles role management commands
"""
import discord
from discord.ext import commands
from utils.embeds import create_success_embed, create_error_embed


class Roles(commands.Cog):
    def __init__(self, bot):
        self.bot = bot
    
    @commands.command(name='addrole')
    @commands.has_permissions(manage_roles=True)
    @commands.guild_only()
    async def addrole(self, ctx, member: discord.Member, *, role: discord.Role):
        """Add a role to a member"""
        if role >= ctx.author.top_role and ctx.author != ctx.guild.owner:
            await ctx.send(embed=create_error_embed("You cannot assign a role higher than or equal to your highest role."))
            return
        
        if role >= ctx.guild.me.top_role:
            await ctx.send(embed=create_error_embed("I cannot assign a role higher than or equal to my highest role."))
            return
        
        if role in member.roles:
            await ctx.send(embed=create_error_embed(f"{member.mention} already has the {role.mention} role."))
            return
        
        try:
            await member.add_roles(role, reason=f"Role added by {ctx.author}")
            embed = create_success_embed(f"Added {role.mention} to {member.mention}.")
            await ctx.send(embed=embed)
        except discord.Forbidden:
            await ctx.send(embed=create_error_embed("I don't have permission to manage roles."))
    
    @commands.command(name='removerole')
    @commands.has_permissions(manage_roles=True)
    @commands.guild_only()
    async def removerole(self, ctx, member: discord.Member, *, role: discord.Role):
        """Remove a role from a member"""
        if role >= ctx.author.top_role and ctx.author != ctx.guild.owner:
            await ctx.send(embed=create_error_embed("You cannot remove a role higher than or equal to your highest role."))
            return
        
        if role >= ctx.guild.me.top_role:
            await ctx.send(embed=create_error_embed("I cannot remove a role higher than or equal to my highest role."))
            return
        
        if role not in member.roles:
            await ctx.send(embed=create_error_embed(f"{member.mention} doesn't have the {role.mention} role."))
            return
        
        try:
            await member.remove_roles(role, reason=f"Role removed by {ctx.author}")
            embed = create_success_embed(f"Removed {role.mention} from {member.mention}.")
            await ctx.send(embed=embed)
        except discord.Forbidden:
            await ctx.send(embed=create_error_embed("I don't have permission to manage roles."))
    
    @commands.command(name='createrole')
    @commands.has_permissions(manage_roles=True)
    @commands.guild_only()
    async def createrole(self, ctx, *, name: str):
        """Create a new role"""
        try:
            role = await ctx.guild.create_role(name=name, reason=f"Role created by {ctx.author}")
            embed = create_success_embed(f"Role {role.mention} created successfully!")
            await ctx.send(embed=embed)
        except discord.Forbidden:
            await ctx.send(embed=create_error_embed("I don't have permission to create roles."))
    
    @commands.command(name='deleterole')
    @commands.has_permissions(manage_roles=True)
    @commands.guild_only()
    async def deleterole(self, ctx, *, role: discord.Role):
        """Delete a role"""
        if role >= ctx.author.top_role and ctx.author != ctx.guild.owner:
            await ctx.send(embed=create_error_embed("You cannot delete a role higher than or equal to your highest role."))
            return
        
        if role >= ctx.guild.me.top_role:
            await ctx.send(embed=create_error_embed("I cannot delete a role higher than or equal to my highest role."))
            return
        
        try:
            role_name = role.name
            await role.delete(reason=f"Role deleted by {ctx.author}")
            embed = create_success_embed(f"Role **{role_name}** deleted successfully!")
            await ctx.send(embed=embed)
        except discord.Forbidden:
            await ctx.send(embed=create_error_embed("I don't have permission to delete roles."))
    
    @commands.command(name='rolecolor')
    @commands.has_permissions(manage_roles=True)
    @commands.guild_only()
    async def rolecolor(self, ctx, role: discord.Role, color: str):
        """Change a role's color (hex format: #FF0000)"""
        if role >= ctx.author.top_role and ctx.author != ctx.guild.owner:
            await ctx.send(embed=create_error_embed("You cannot edit a role higher than or equal to your highest role."))
            return
        
        if role >= ctx.guild.me.top_role:
            await ctx.send(embed=create_error_embed("I cannot edit a role higher than or equal to my highest role."))
            return
        
        try:
            # Remove # if present
            color = color.replace('#', '')
            color_int = int(color, 16)
            discord_color = discord.Color(color_int)
            
            await role.edit(color=discord_color, reason=f"Color changed by {ctx.author}")
            embed = create_success_embed(f"Changed color of {role.mention} to #{color}.")
            await ctx.send(embed=embed)
        except ValueError:
            await ctx.send(embed=create_error_embed("Invalid color format. Use hex format like #FF0000"))
        except discord.Forbidden:
            await ctx.send(embed=create_error_embed("I don't have permission to edit roles."))
    
    @commands.command(name='rolemembers')
    @commands.guild_only()
    async def rolemembers(self, ctx, *, role: discord.Role):
        """List all members with a specific role"""
        members = role.members
        
        if not members:
            await ctx.send(f"No members have the {role.mention} role.")
            return
        
        embed = discord.Embed(
            title=f"Members with {role.name}",
            description=f"Total: {len(members)}",
            color=role.color
        )
        
        # Show first 25 members (Discord embed field limit)
        member_list = [member.mention for member in members[:25]]
        embed.add_field(
            name="Members",
            value='\n'.join(member_list) if member_list else "None",
            inline=False
        )
        
        if len(members) > 25:
            embed.set_footer(text=f"Showing 25 of {len(members)} members")
        
        await ctx.send(embed=embed)
    
    @commands.command(name='roleinfo')
    @commands.guild_only()
    async def roleinfo(self, ctx, *, role: discord.Role):
        """Get information about a role"""
        embed = discord.Embed(
            title=f"Role Information: {role.name}",
            color=role.color
        )
        
        embed.add_field(name="ID", value=role.id, inline=True)
        embed.add_field(name="Color", value=str(role.color), inline=True)
        embed.add_field(name="Position", value=role.position, inline=True)
        embed.add_field(name="Members", value=len(role.members), inline=True)
        embed.add_field(name="Mentionable", value="Yes" if role.mentionable else "No", inline=True)
        embed.add_field(name="Hoisted", value="Yes" if role.hoist else "No", inline=True)
        embed.add_field(name="Created At", value=discord.utils.format_dt(role.created_at, 'F'), inline=False)
        
        await ctx.send(embed=embed)


async def setup(bot):
    await bot.add_cog(Roles(bot))
