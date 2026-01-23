"""
Embed utilities for creating standardized embeds
"""
import discord
from typing import Optional


class EmbedFactory:
    """Factory for creating standardized embeds."""
    
    @staticmethod
    def success(title: str, description: Optional[str] = None, **kwargs) -> discord.Embed:
        """Create a success embed (green)."""
        embed = discord.Embed(
            title=title,
            description=description,
            color=discord.Color.green(),
            **kwargs
        )
        return embed
    
    @staticmethod
    def error(title: str, description: Optional[str] = None, **kwargs) -> discord.Embed:
        """Create an error embed (red)."""
        embed = discord.Embed(
            title=title,
            description=description,
            color=discord.Color.red(),
            **kwargs
        )
        return embed
    
    @staticmethod
    def moderation_action(
        action: str,
        moderator: discord.Member,
        target: Optional[discord.Member] = None,
        reason: Optional[str] = None,
        duration: Optional[str] = None,
        **kwargs
    ) -> discord.Embed:
        """Create a moderation action embed."""
        embed = discord.Embed(
            title=f"Moderation: {action.title()}",
            color=discord.Color.orange(),
            **kwargs
        )
        
        if target:
            embed.add_field(name="Target", value=target.mention, inline=True)
        embed.add_field(name="Moderator", value=moderator.mention, inline=True)
        
        if reason:
            embed.add_field(name="Reason", value=reason, inline=False)
        if duration:
            embed.add_field(name="Duration", value=duration, inline=True)
            
        return embed


# ---------------------------------------------------------------------
# Backward-compatible function wrappers (used by cogs imports)
# Do NOT remove: your cogs expect these names.
# ---------------------------------------------------------------------

def create_success_embed(first_arg: str, second_arg: Optional[str] = None, **kwargs) -> discord.Embed:
    """Wrapper for cogs that expect function-style embed creation.
    
    Handles both calling conventions:
    - create_success_embed("description only")  -> uses default title
    - create_success_embed("Title", "description")  -> uses both
    """
    # If second_arg is provided, first_arg is title, second_arg is description
    # If second_arg is None, first_arg is description and we use default title
    if second_arg is None:
        return EmbedFactory.success(title="✅ Success", description=first_arg, **kwargs)
    return EmbedFactory.success(title=first_arg, description=second_arg, **kwargs)


def create_error_embed(first_arg: str, second_arg: Optional[str] = None, **kwargs) -> discord.Embed:
    """Wrapper for cogs that expect function-style embed creation.
    
    Handles both calling conventions:
    - create_error_embed("description only")  -> uses default title
    - create_error_embed("Title", "description")  -> uses both
    """
    # If second_arg is provided, first_arg is title, second_arg is description
    # If second_arg is None, first_arg is description and we use default title
    if second_arg is None:
        return EmbedFactory.error(title="❌ Error", description=first_arg, **kwargs)
    return EmbedFactory.error(title=first_arg, description=second_arg, **kwargs)


def create_mod_embed(
    title: str,
    description: Optional[str] = None,
    moderator: Optional[discord.Member] = None,
    reason: Optional[str] = None,
    **kwargs
) -> discord.Embed:
    """
    Create a moderation embed with title and description.
    """
    embed = discord.Embed(
        title=title,
        description=description,
        color=discord.Color.orange(),
        **kwargs
    )
    return embed
