"""
Music Cog
Play music from YouTube with search functionality
"""
import asyncio
import discord
from discord.ext import commands
from discord import app_commands
import yt_dlp
from typing import Optional
import functools

# Suppress noise about console usage from errors
yt_dlp.utils.bug_reports_message = lambda: ''

YTDL_FORMAT_OPTIONS = {
    'format': 'bestaudio/best',
    'outtmpl': '%(extractor)s-%(id)s-%(title)s.%(ext)s',
    'restrictfilenames': True,
    'noplaylist': True,
    'nocheckcertificate': True,
    'ignoreerrors': False,
    'logtostderr': False,
    'quiet': True,
    'no_warnings': True,
    'default_search': 'ytsearch',
    'source_address': '0.0.0.0',
    'extract_flat': False
}

ytdl = yt_dlp.YoutubeDL(YTDL_FORMAT_OPTIONS)


class YTDLSource(discord.PCMVolumeTransformer):
    def __init__(self, source, *, data, volume=1.0):
        super().__init__(source, volume)
        self.data = data
        self.title = data.get('title')
        self.url = data.get('url')
        self.duration = data.get('duration')
        self.thumbnail = data.get('thumbnail')
        self.webpage_url = data.get('webpage_url')

    @classmethod
    async def from_url(cls, url, *, loop=None, stream=False):
        loop = loop or asyncio.get_event_loop()
        data = await loop.run_in_executor(None, lambda: ytdl.extract_info(url, download=not stream))

        if 'entries' in data:
            # Take first item from a playlist
            data = data['entries'][0]

        filename = data['url'] if stream else ytdl.prepare_filename(data)
        
        # Use FFmpegPCMAudio with proper audio settings for Discord
        return cls(
            discord.FFmpegPCMAudio(
                filename,
                before_options='-reconnect 1 -reconnect_streamed 1 -reconnect_delay_max 5',
                options='-vn -filter:a "volume=1.5"'
            ), 
            data=data
        )

    @classmethod
    async def search_youtube(cls, search_query, *, loop=None):
        """Search YouTube and return the first result"""
        loop = loop or asyncio.get_event_loop()
        
        # Ensure search query is prefixed for yt-dlp
        if not search_query.startswith('ytsearch:'):
            search_query = f'ytsearch:{search_query}'
        
        data = await loop.run_in_executor(
            None, 
            lambda: ytdl.extract_info(search_query, download=False)
        )
        
        if 'entries' in data and data['entries']:
            # Get first search result
            data = data['entries'][0]
            return data
        return None


class MusicQueue:
    def __init__(self):
        self.queue = []
        self.current = None
        self.loop_mode = False  # False, 'song', or 'queue'
    
    def add(self, song):
        self.queue.append(song)
    
    def next(self):
        if self.loop_mode == 'song':
            return self.current
        
        if self.queue:
            self.current = self.queue.pop(0)
            if self.loop_mode == 'queue':
                self.queue.append(self.current)
            return self.current
        
        self.current = None
        return None
    
    def clear(self):
        self.queue.clear()
        self.current = None
    
    def is_empty(self):
        return len(self.queue) == 0


class Music(commands.Cog):
    def __init__(self, bot):
        self.bot = bot
        self.queues = {}  # guild_id: MusicQueue
    
    def get_queue(self, guild_id: int) -> MusicQueue:
        if guild_id not in self.queues:
            self.queues[guild_id] = MusicQueue()
        return self.queues[guild_id]
    
    async def _safe_defer(self, interaction: discord.Interaction, *, ephemeral: bool = False):
        """Safely defer an interaction"""
        if interaction.response.is_done():
            return
        try:
            await interaction.response.defer(ephemeral=ephemeral)
        except Exception:
            pass
    
    @app_commands.command(name='play', description='Play music from YouTube (search or URL)')
    @app_commands.guild_only()
    async def play(self, interaction: discord.Interaction, query: str):
        """Play a song from YouTube by search query or URL"""
        try:
            # Check if user is in voice channel
            if not isinstance(interaction.user, discord.Member) or not interaction.user.voice:
                return await interaction.response.send_message(
                    "❌ You need to be in a voice channel to use this command!",
                    ephemeral=True
                )
            
            await self._safe_defer(interaction)
            
            voice_channel = interaction.user.voice.channel
            
            # Connect to voice if not already connected
            if not interaction.guild.voice_client:
                try:
                    voice_client = await voice_channel.connect()
                except Exception as e:
                    return await interaction.followup.send(
                        f"❌ Failed to connect to voice channel: {e}",
                        ephemeral=True
                    )
            else:
                voice_client = interaction.guild.voice_client
                # Move to user's channel if different
                if voice_client.channel != voice_channel:
                    await voice_client.move_to(voice_channel)
            
            # Search or extract info
            async with interaction.channel.typing():
                if query.startswith('http'):
                    # Direct URL
                    player = await YTDLSource.from_url(query, loop=self.bot.loop, stream=True)
                else:
                    # Search YouTube
                    search_result = await YTDLSource.search_youtube(query, loop=self.bot.loop)
                    if not search_result:
                        return await interaction.followup.send("❌ No results found!", ephemeral=True)
                    
                    player = await YTDLSource.from_url(
                        search_result['webpage_url'], 
                        loop=self.bot.loop, 
                        stream=True
                    )
            
            queue = self.get_queue(interaction.guild.id)
            
            # If nothing is playing, play immediately
            if not voice_client.is_playing():
                queue.current = player
                
                def after_playing(error):
                    if error:
                        print(f"Player error: {error}")
                    asyncio.run_coroutine_threadsafe(
                        self._play_next(interaction.guild),
                        self.bot.loop
                    )
                
                voice_client.play(player, after=after_playing)
                
                # Log opus status
                import discord as dc
                print(f"Opus loaded: {dc.opus.is_loaded()}")
                print(f"Voice client connected: {voice_client.is_connected()}")
                print(f"Now playing: {player.title}")
                
                embed = discord.Embed(
                    title="🎵 Now Playing",
                    description=f"[{player.title}]({player.webpage_url})",
                    color=discord.Color.green()
                )
                if player.thumbnail:
                    embed.set_thumbnail(url=player.thumbnail)
                
                duration = player.duration
                if duration:
                    mins, secs = divmod(duration, 60)
                    embed.add_field(name="Duration", value=f"{mins}:{secs:02d}", inline=True)
                
                embed.add_field(name="Requested by", value=interaction.user.mention, inline=True)
                
                await interaction.followup.send(embed=embed)
            else:
                # Add to queue
                queue.add(player)
                
                embed = discord.Embed(
                    title="📝 Added to Queue",
                    description=f"[{player.title}]({player.webpage_url})",
                    color=discord.Color.blue()
                )
                embed.add_field(name="Position", value=f"#{len(queue.queue)}", inline=True)
                
                await interaction.followup.send(embed=embed)
        
        except Exception as e:
            if not interaction.response.is_done():
                await interaction.response.send_message(f"❌ An error occurred: {e}", ephemeral=True)
            else:
                await interaction.followup.send(f"❌ An error occurred: {e}", ephemeral=True)
    
    async def _play_next(self, guild: discord.Guild):
        """Play the next song in queue"""
        queue = self.get_queue(guild.id)
        voice_client = guild.voice_client
        
        if not voice_client:
            return
        
        next_song = queue.next()
        if next_song:
            voice_client.play(
                next_song,
                after=lambda e: asyncio.run_coroutine_threadsafe(
                    self._play_next(guild),
                    self.bot.loop
                )
            )
    
    @app_commands.command(name='pause', description='Pause the current song')
    @app_commands.guild_only()
    async def pause(self, interaction: discord.Interaction):
        """Pause the currently playing song"""
        try:
            if not interaction.guild.voice_client:
                return await interaction.response.send_message("❌ Not connected to a voice channel!", ephemeral=True)
            
            if interaction.guild.voice_client.is_playing():
                interaction.guild.voice_client.pause()
                await interaction.response.send_message("⏸️ Paused the music!")
            else:
                await interaction.response.send_message("❌ Nothing is playing!", ephemeral=True)
        except Exception as e:
            if not interaction.response.is_done():
                await interaction.response.send_message(f"❌ An error occurred: {e}", ephemeral=True)
    
    @app_commands.command(name='resume', description='Resume the paused song')
    @app_commands.guild_only()
    async def resume(self, interaction: discord.Interaction):
        """Resume the paused song"""
        try:
            if not interaction.guild.voice_client:
                return await interaction.response.send_message("❌ Not connected to a voice channel!", ephemeral=True)
            
            if interaction.guild.voice_client.is_paused():
                interaction.guild.voice_client.resume()
                await interaction.response.send_message("▶️ Resumed the music!")
            else:
                await interaction.response.send_message("❌ Music is not paused!", ephemeral=True)
        except Exception as e:
            if not interaction.response.is_done():
                await interaction.response.send_message(f"❌ An error occurred: {e}", ephemeral=True)
    
    @app_commands.command(name='skip', description='Skip the current song')
    @app_commands.guild_only()
    async def skip(self, interaction: discord.Interaction):
        """Skip the current song"""
        try:
            if not interaction.guild.voice_client:
                return await interaction.response.send_message("❌ Not connected to a voice channel!", ephemeral=True)
            
            if interaction.guild.voice_client.is_playing():
                interaction.guild.voice_client.stop()
                await interaction.response.send_message("⏭️ Skipped the current song!")
            else:
                await interaction.response.send_message("❌ Nothing is playing!", ephemeral=True)
        except Exception as e:
            if not interaction.response.is_done():
                await interaction.response.send_message(f"❌ An error occurred: {e}", ephemeral=True)
    
    @app_commands.command(name='stop', description='Stop playing and clear the queue')
    @app_commands.guild_only()
    async def stop(self, interaction: discord.Interaction):
        """Stop playing music and clear queue"""
        try:
            if not interaction.guild.voice_client:
                return await interaction.response.send_message("❌ Not connected to a voice channel!", ephemeral=True)
            
            queue = self.get_queue(interaction.guild.id)
            queue.clear()
            
            interaction.guild.voice_client.stop()
            await interaction.response.send_message("⏹️ Stopped playing and cleared the queue!")
        except Exception as e:
            if not interaction.response.is_done():
                await interaction.response.send_message(f"❌ An error occurred: {e}", ephemeral=True)
    
    @app_commands.command(name='queue', description='Show the music queue')
    @app_commands.guild_only()
    async def queue_command(self, interaction: discord.Interaction):
        """Display the current music queue"""
        try:
            queue = self.get_queue(interaction.guild.id)
            
            if not queue.current and queue.is_empty():
                return await interaction.response.send_message("📝 The queue is empty!", ephemeral=True)
            
            embed = discord.Embed(
                title="🎵 Music Queue",
                color=discord.Color.blue()
            )
            
            if queue.current:
                embed.add_field(
                    name="🎵 Now Playing",
                    value=f"[{queue.current.title}]({queue.current.webpage_url})",
                    inline=False
                )
            
            if not queue.is_empty():
                queue_text = ""
                for i, song in enumerate(queue.queue[:10], 1):
                    queue_text += f"`{i}.` [{song.title}]({song.webpage_url})\n"
                
                if len(queue.queue) > 10:
                    queue_text += f"\n*...and {len(queue.queue) - 10} more*"
                
                embed.add_field(name="📝 Up Next", value=queue_text, inline=False)
            
            embed.set_footer(text=f"Total songs in queue: {len(queue.queue)}")
            
            await interaction.response.send_message(embed=embed)
        except Exception as e:
            if not interaction.response.is_done():
                await interaction.response.send_message(f"❌ An error occurred: {e}", ephemeral=True)
    
    @app_commands.command(name='nowplaying', description='Show the currently playing song')
    @app_commands.guild_only()
    async def nowplaying(self, interaction: discord.Interaction):
        """Display information about the currently playing song"""
        try:
            queue = self.get_queue(interaction.guild.id)
            
            if not queue.current:
                return await interaction.response.send_message("❌ Nothing is playing!", ephemeral=True)
            
            embed = discord.Embed(
                title="🎵 Now Playing",
                description=f"[{queue.current.title}]({queue.current.webpage_url})",
                color=discord.Color.green()
            )
            
            if queue.current.thumbnail:
                embed.set_thumbnail(url=queue.current.thumbnail)
            
            duration = queue.current.duration
            if duration:
                mins, secs = divmod(duration, 60)
                embed.add_field(name="Duration", value=f"{mins}:{secs:02d}", inline=True)
            
            voice_client = interaction.guild.voice_client
            if voice_client:
                status = "⏸️ Paused" if voice_client.is_paused() else "▶️ Playing"
                embed.add_field(name="Status", value=status, inline=True)
            
            await interaction.response.send_message(embed=embed)
        except Exception as e:
            if not interaction.response.is_done():
                await interaction.response.send_message(f"❌ An error occurred: {e}", ephemeral=True)
    
    @app_commands.command(name='leave', description='Disconnect the bot from voice channel')
    @app_commands.guild_only()
    async def leave(self, interaction: discord.Interaction):
        """Disconnect from voice channel"""
        try:
            if not interaction.guild.voice_client:
                return await interaction.response.send_message("❌ Not connected to a voice channel!", ephemeral=True)
            
            queue = self.get_queue(interaction.guild.id)
            queue.clear()
            
            await interaction.guild.voice_client.disconnect()
            await interaction.response.send_message("👋 Disconnected from voice channel!")
        except Exception as e:
            if not interaction.response.is_done():
                await interaction.response.send_message(f"❌ An error occurred: {e}", ephemeral=True)
    
    @app_commands.command(name='volume', description='Set the music volume (0-100)')
    @app_commands.guild_only()
    async def volume(self, interaction: discord.Interaction, volume: app_commands.Range[int, 0, 100]):
        """Change the player volume"""
        try:
            if not interaction.guild.voice_client:
                return await interaction.response.send_message("❌ Not connected to a voice channel!", ephemeral=True)
            
            if not interaction.guild.voice_client.source:
                return await interaction.response.send_message("❌ Nothing is playing!", ephemeral=True)
            
            interaction.guild.voice_client.source.volume = volume / 100
            await interaction.response.send_message(f"🔊 Volume set to {volume}%")
        except Exception as e:
            if not interaction.response.is_done():
                await interaction.response.send_message(f"❌ An error occurred: {e}", ephemeral=True)


async def setup(bot):
    await bot.add_cog(Music(bot))
