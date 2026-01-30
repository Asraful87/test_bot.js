# Music Bot Testing Guide

## Prerequisites
✅ Bot is running and connected to Discord
✅ Bot has joined your server
✅ Bot has proper permissions (Connect, Speak in voice channels)

## Test Steps

### Test 1: Basic Music Playback
1. Join a voice channel in your Discord server
2. Run command: `/play query: never gonna give you up`
3. **Expected Result**: 
   - Bot joins your voice channel
   - Bot shows "🎵 Now Playing" embed with song details
   - Music starts playing

### Test 2: Direct YouTube URL
1. Stay in voice channel
2. Run command: `/play query: https://www.youtube.com/watch?v=dQw4w9WgXcQ`
3. **Expected Result**: 
   - Bot plays the specific video from URL
   - Shows song details in embed

### Test 3: Queue Management
1. While music is playing, run: `/play query: another song name`
2. **Expected Result**: 
   - Shows "📝 Added to Queue" message
   - Song added to position #1 in queue
   - Plays after current song finishes

### Test 4: Skip Command
1. While music is playing, run: `/skip`
2. **Expected Result**: 
   - Current song stops
   - Next song in queue starts playing
   - Shows "⏭️ Skipped" message

### Test 5: Stop Command
1. While music is playing, run: `/stop`
2. **Expected Result**: 
   - Music stops
   - Bot disconnects from voice channel
   - Queue is cleared

## Troubleshooting

### If bot joins but no audio plays:
- Check if opusscript is properly installed: `npm list opusscript`
- Verify FFmpeg is accessible: `ffmpeg -version`
- Check bot logs for errors

### If bot can't join voice channel:
- Verify bot has "Connect" and "Speak" permissions
- Check if voice channel has connection limit
- Ensure bot is not already in another voice channel

### If search returns no results:
- Try using a direct YouTube URL instead
- Check your internet connection
- Verify play-dl is working: `npm list play-dl`

## Available Commands

- `/play <query>` - Play music (song name or YouTube URL)
- `/skip` - Skip current song
- `/stop` - Stop music and disconnect
- `/ping` - Test bot responsiveness
- `/serverinfo` - Show server information

## Bot Status

Current Status: ✅ **RUNNING**
- Logged in as: ggBot#5757
- Connected to: 1 guild
- Commands loaded: 8 (3 moderation, 3 music, 2 utilities)

## Next Steps After Testing

If music playback works:
- ✅ Mark todo #3 complete
- Convert remaining Python commands to JavaScript (~90 commands in 14 cogs)

If music has issues:
- Check error logs at: `d:\bot\logs\error.log`
- Review terminal output for error messages
- Verify all dependencies are installed correctly
