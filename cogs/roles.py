"""
Roles Cog
Handles role management commands
"""
import discord
from discord.ext import commands
from discord import app_commands
from utils.embeds import create_success_embed, create_error_embed


class Roles(commands.Cog):
    def __init__(self, bot):
        self.bot = bot
    
    @app_commands.command(name='addrole', description='Add a role to a member')
    @app_commands.checks.has_permissions(manage_roles=True)
    @app_commands.guild_only()
    async def addrole(self, interaction: discord.Interaction, member: discord.Member, role: discord.Role):
        """Add a role to a member"""
        if not isinstance(interaction.user, discord.Member):
            return await interaction.response.send_message("❌ This command can only be used in a server.", ephemeral=True)
            
        if role >= interaction.user.top_role and interaction.user != interaction.guild.owner:
            return await interaction.response.send_message(embed=create_error_embed("You cannot assign a role higher than or equal to your highest role."), ephemeral=True)
        
        if role >= interaction.guild.me.top_role:
            return await interaction.response.send_message(embed=create_error_embed("I cannot assign a role higher than or equal to my highest role."), ephemeral=True)
        
        if role in member.roles:
            return await interaction.response.send_message(embed=create_error_embed(f"{member.mention} already has the {role.mention} role."), ephemeral=True)
        
        try:
            await member.add_roles(role, reason=f"Role added by {interaction.user}")
            embed = create_success_embed(f"Added {role.mention} to {member.mention}.")
            await interaction.response.send_message(embed=embed)
        except discord.Forbidden:
            await interaction.response.send_message(embed=create_error_embed("I don't have permission to manage roles."), ephemeral=True)
        except Exception as e:
            if not interaction.response.is_done():
                await interaction.response.send_message(f"❌ An error occurred: {e}", ephemeral=True)
    
    @app_commands.command(name='removerole', description='Remove a role from a member')
    @app_commands.checks.has_permissions(manage_roles=True)
    @app_commands.guild_only()
    async def removerole(self, interaction: discord.Interaction, member: discord.Member, role: discord.Role):
        """Remove a role from a member"""
        if not isinstance(interaction.user, discord.Member):
            return await interaction.response.send_message("❌ This command can only be used in a server.", ephemeral=True)
            
        if role >= interaction.user.top_role and interaction.user != interaction.guild.owner:
            return await interaction.response.send_message(embed=create_error_embed("You cannot remove a role higher than or equal to your highest role."), ephemeral=True)
        
        if role >= interaction.guild.me.top_role:
            return await interaction.response.send_message(embed=create_error_embed("I cannot remove a role higher than or equal to my highest role."), ephemeral=True)
        
        if role not in member.roles:
            return await interaction.response.send_message(embed=create_error_embed(f"{member.mention} doesn't have the {role.mention} role."), ephemeral=True)
        
        try:
            await member.remove_roles(role, reason=f"Role removed by {interaction.user}")
            embed = create_success_embed(f"Removed {role.mention} from {member.mention}.")
            await interaction.response.send_message(embed=embed)
        except discord.Forbidden:
            await interaction.response.send_message(embed=create_error_embed("I don't have permission to manage roles."), ephemeral=True)
        except Exception as e:
            if not interaction.response.is_done():
                await interaction.response.send_message(f"❌ An error occurred: {e}", ephemeral=True)
    
    @app_commands.command(name='createrole', description='Create a new role')
    @app_commands.checks.has_permissions(manage_roles=True)
    @app_commands.guild_only()
    async def createrole(self, interaction: discord.Interaction, name: str):
        """Create a new role"""
        try:
            role = await interaction.guild.create_role(name=name, reason=f"Role created by {interaction.user}")
            embed = create_success_embed(f"Role {role.mention} created successfully!")
            await interaction.response.send_message(embed=embed)
        except discord.Forbidden:
            await interaction.response.send_message(embed=create_error_embed("I don't have permission to create roles."), ephemeral=True)
        except Exception as e:
            if not interaction.response.is_done():
                await interaction.response.send_message(f"❌ An error occurred: {e}", ephemeral=True)
    
    @app_commands.command(name='deleterole', description='Delete a role')
    @app_commands.checks.has_permissions(manage_roles=True)
    @app_commands.guild_only()
    async def deleterole(self, interaction: discord.Interaction, role: discord.Role):
        """Delete a role"""
        if not isinstance(interaction.user, discord.Member):
            return await interaction.response.send_message("❌ This command can only be used in a server.", ephemeral=True)
            
        if role >= interaction.user.top_role and interaction.user != interaction.guild.owner:
            return await interaction.response.send_message(embed=create_error_embed("You cannot delete a role higher than or equal to your highest role."), ephemeral=True)
        
        if role >= interaction.guild.me.top_role:
            return await interaction.response.send_message(embed=create_error_embed("I cannot delete a role higher than or equal to my highest role."), ephemeral=True)
        
        try:
            role_name = role.name
            await role.delete(reason=f"Role deleted by {interaction.user}")
            embed = create_success_embed(f"Role **{role_name}** deleted successfully!")
            await interaction.response.send_message(embed=embed)
        except discord.Forbidden:
            await interaction.response.send_message(embed=create_error_embed("I don't have permission to delete roles."), ephemeral=True)
        except Exception as e:
            if not interaction.response.is_done():
                await interaction.response.send_message(f"❌ An error occurred: {e}", ephemeral=True)
    
    @app_commands.command(name='rolecolor', description="Change a role's color (hex format: #FF0000)")
    @app_commands.checks.has_permissions(manage_roles=True)
    @app_commands.guild_only()
    async def rolecolor(self, interaction: discord.Interaction, role: discord.Role, color: str):
        """Change a role's color (hex format: #FF0000)"""
        if not isinstance(interaction.user, discord.Member):
            return await interaction.response.send_message("❌ This command can only be used in a server.", ephemeral=True)
            
        if role >= interaction.user.top_role and interaction.user != interaction.guild.owner:
            return await interaction.response.send_message(embed=create_error_embed("You cannot edit a role higher than or equal to your highest role."), ephemeral=True)
        
        if role >= interaction.guild.me.top_role:
            return await interaction.response.send_message(embed=create_error_embed("I cannot edit a role higher than or equal to my highest role."), ephemeral=True)
        
        try:
            # Remove # if present
            color = color.replace('#', '')
            color_int = int(color, 16)
            discord_color = discord.Color(color_int)
            
            await role.edit(color=discord_color, reason=f"Color changed by {interaction.user}")
            embed = create_success_embed(f"Changed color of {role.mention} to #{color}.")
            await interaction.response.send_message(embed=embed)
        except ValueError:
            await interaction.response.send_message(embed=create_error_embed("Invalid color format. Use hex format like #FF0000"), ephemeral=True)
        except discord.Forbidden:
            await interaction.response.send_message(embed=create_error_embed("I don't have permission to edit roles."), ephemeral=True)
        except Exception as e:
            if not interaction.response.is_done():
                await interaction.response.send_message(f"❌ An error occurred: {e}", ephemeral=True)
    
    @app_commands.command(name='rolemembers', description='List all members with a specific role')
    @app_commands.guild_only()
    async def rolemembers(self, interaction: discord.Interaction, role: discord.Role):
        """List all members with a specific role"""
        members = role.members
        
        if not members:
            await interaction.response.send_message(f"No members have the {role.mention} role.", ephemeral=True)
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
        
        try:
            await interaction.response.send_message(embed=embed)
        except Exception as e:
            if not interaction.response.is_done():
                await interaction.response.send_message(f"❌ An error occurred: {e}", ephemeral=True)
    
    @app_commands.command(name='roleinfo', description='Get information about a role')
    @app_commands.guild_only()
    async def roleinfo(self, interaction: discord.Interaction, role: discord.Role):
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
        
        try:
            await interaction.response.send_message(embed=embed)
        except Exception as e:
            if not interaction.response.is_done():
                await interaction.response.send_message(f"❌ An error occurred: {e}", ephemeral=True)


async def setup(bot):
    await bot.add_cog(Roles(bot))
