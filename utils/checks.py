"""Permission checking utilities."""
import discord
from discord import app_commands
from typing import Optional


class PermissionChecker:
    """Handles permission verification for moderation commands."""
    
    
    @staticmethod
    def can_moderate(
        executor: discord.Member,
        target: discord.Member,
        bot_member: discord.Member
    ) -> tuple[bool, Optional[str]]:
        """Check if executor can moderate target.
        
        Args:
            executor: Member executing the action
            target: Member being moderated
            bot_member: Bot's member object
            
        Returns:
            Tuple of (can_moderate, error_message)
        """
        # Cannot moderate server owner
        if target.id == target.guild.owner_id:
            return False, "❌ Cannot moderate the server owner."
        #55555
        # Cannot moderate yourself
        if executor.id == target.id:
            return False, "❌ You cannot moderate yourself."
            
        # Check role hierarchy - executor must be above target
        if executor.id != executor.guild.owner_id:
            if executor.top_role <= target.top_role:
                return False, "❌ You cannot moderate someone with an equal or higher role."
                
        # Check if bot can moderate target
        if bot_member.top_role <= target.top_role:
            return False, "❌ I cannot moderate someone with an equal or higher role than me."
            
        return True, None
        
    @staticmethod
    def can_manage_role(
        executor: discord.Member,
        role: discord.Role,
        bot_member: discord.Member
    ) -> tuple[bool, Optional[str]]:
        """Check if executor can manage a role.
        
        Args:
            executor: Member executing the action
            role: Role being managed
            bot_member: Bot's member object
            
        Returns:
            Tuple of (can_manage, error_message)
        """
        # Check if role is @everyone
        if role.is_default():
            return False, "❌ Cannot manage the @everyone role."
            
        # Check executor's role hierarchy
        if executor.id != executor.guild.owner_id:
            if executor.top_role <= role:
                return False, f"❌ You cannot manage {role.mention} (equal or higher than your highest role)."
                
        # Check bot's role hierarchy
        if bot_member.top_role <= role:
            return False, f"❌ I cannot manage {role.mention} (equal or higher than my highest role)."
            
        return True, None
        
    @staticmethod
    def has_mod_permissions(member: discord.Member) -> bool:
        """Check if member has moderator permissions.
        
        Args:
            member: Member to check
            
        Returns:
            True if member has mod permissions
        """
        return any([
            member.guild_permissions.kick_members,
            member.guild_permissions.ban_members,
            member.guild_permissions.moderate_members,
            member.guild_permissions.manage_messages,
            member.guild_permissions.administrator
        ])
        
    @staticmethod
    def has_admin_permissions(member: discord.Member) -> bool:
        """Check if member has administrator permissions.
        
        Args:
            member: Member to check
            
        Returns:
            True if member has admin permissions
        """
        return member.guild_permissions.administrator


def has_permissions(**perms):
    """Decorator to check permissions for commands.
    
    Args:
        **perms: Permission name-value pairs
    """
    async def predicate(interaction: discord.Interaction) -> bool:
        if not isinstance(interaction.user, discord.Member):
            return False
            
        permissions = interaction.user.guild_permissions
        missing = [
            perm for perm, value in perms.items()
            if getattr(permissions, perm) != value
        ]
        
        if missing:
            perm_names = ", ".join(missing)
            await interaction.response.send_message(
                f"❌ You need the following permissions: {perm_names}",
                ephemeral=True
            )
            return False
            
        return True
        
    return app_commands.check(predicate)
def is_moderator(member: discord.Member) -> bool:
    """Backward-compatible helper used by cogs."""
    return PermissionChecker.has_mod_permissions(member)
def is_administrator(member: discord.Member) -> bool:
    """Backward-compatible helper used by cogs."""
    return PermissionChecker.has_admin_permissions(member)