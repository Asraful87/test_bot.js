# Discord Bot - Complete Feature Documentation

## 📚 Table of Contents
1. [Channel Management](#channel-management)
2. [Moderation Commands](#moderation-commands)
3. [Music Commands](#music-commands)
4. [Role Management](#role-management)
5. [Utility Commands](#utility-commands)
6. [Diagnostic Commands](#diagnostic-commands)
7. [Message Commands](#message-commands)

---

## 🔧 Channel Management

### `/createchannel`
**What it does:** Creates a new text or voice channel in your server.

**Usage:** `/createchannel name:<channel-name> type:<text|voice>`

**Examples:**
- `/createchannel name:general-chat type:text` - Creates a text channel
- `/createchannel name:Gaming Room type:voice` - Creates a voice channel

**Required Permission:** Manage Channels

---

### `/deletechannel`
**What it does:** Deletes a specified channel from the server.

**Usage:** `/deletechannel [channel:<channel>]`

**Examples:**
- `/deletechannel` - Deletes the current channel
- `/deletechannel channel:#old-chat` - Deletes the specified channel

**Required Permission:** Manage Channels

---

### `/lockchannel`
**What it does:** Prevents @everyone from sending messages in a channel.

**Usage:** `/lockchannel [channel:<channel>]`

**Examples:**
- `/lockchannel` - Locks the current channel
- `/lockchannel channel:#announcements` - Locks the specified channel

**Required Permission:** Manage Channels

**Use case:** Useful during emergencies or when you need to pause conversation temporarily.

---

### `/unlockchannel`
**What it does:** Allows @everyone to send messages in a channel again.

**Usage:** `/unlockchannel [channel:<channel>]`

**Examples:**
- `/unlockchannel` - Unlocks the current channel
- `/unlockchannel channel:#general` - Unlocks the specified channel

**Required Permission:** Manage Channels

---

### `/slowmode`
**What it does:** Sets a delay between messages in a channel (rate limiting).

**Usage:** `/slowmode seconds:<0-21600> [channel:<channel>]`

**Examples:**
- `/slowmode seconds:5` - Sets 5 second delay in current channel
- `/slowmode seconds:0` - Disables slowmode
- `/slowmode seconds:30 channel:#spam` - Sets 30 second delay in #spam

**Required Permission:** Manage Channels

**Use case:** Prevents spam and encourages thoughtful discussion.

---

### `/setchannelname`
**What it does:** Renames a channel.

**Usage:** `/setchannelname channel:<channel> name:<new-name>`

**Examples:**
- `/setchannelname channel:#old-name name:new-name` - Renames channel

**Required Permission:** Manage Channels

---

### `/setchanneltopic`
**What it does:** Changes the topic/description of a text channel.

**Usage:** `/setchanneltopic channel:<channel> topic:<description>`

**Examples:**
- `/setchanneltopic channel:#rules topic:Server rules and guidelines` - Sets channel topic

**Required Permission:** Manage Channels

---

## 👮 Moderation Commands

### `/kick`
**What it does:** Removes a member from the server (they can rejoin with invite).

**Usage:** `/kick member:<@user> [reason:<text>]`

**Examples:**
- `/kick member:@BadUser reason:Spamming` - Kicks user with reason
- `/kick member:@Troll` - Kicks user without reason

**Required Permission:** Kick Members

**What happens:**
- User is immediately removed from server
- Action is logged to database
- Mod log channel receives notification (if configured)

---

### `/ban`
**What it does:** Permanently bans a member from the server with confirmation.

**Usage:** `/ban member:<@user> [reason:<text>]`

**Examples:**
- `/ban member:@Troublemaker reason:Harassment` - Bans user
- `/ban member:@Spammer` - Bans without reason

**Required Permission:** Ban Members

**What happens:**
- Confirmation button appears to prevent accidents
- User cannot rejoin even with invite
- Action is logged to database
- Can be reversed with `/unban`

---

### `/unban`
**What it does:** Removes a ban from a user by their ID.

**Usage:** `/unban user_id:<user-id>`

**Examples:**
- `/unban user_id:123456789012345678` - Unbans user
- `/unban user_id:@123456789012345678` - Also works with mention format

**Required Permission:** Ban Members

**How to find user ID:** Right-click user in ban list → Copy ID (requires Developer Mode)

---

### `/warn`
**What it does:** Issues a warning to a member and logs it to database.

**Usage:** `/warn member:<@user> [reason:<text>]`

**Examples:**
- `/warn member:@User reason:Breaking rule 3` - Warns user
- `/warn member:@Newbie reason:First offense - language` - Warns with reason

**Required Permission:** Moderate Members

**What happens:**
- Warning is recorded in database with timestamp
- User receives notification
- Moderator can view history with `/warnings`

---

### `/warnings`
**What it does:** Displays all warnings for a specific member.

**Usage:** `/warnings member:<@user>`

**Examples:**
- `/warnings member:@User` - Shows all warnings

**Required Permission:** Moderate Members

**Shows:** Warning ID, reason, moderator, date/time

---

### `/clearwarnings`
**What it does:** Removes all warnings for a member (clean slate).

**Usage:** `/clearwarnings member:<@user>`

**Examples:**
- `/clearwarnings member:@ReformedUser` - Clears all warnings

**Required Permission:** Administrator

**Use case:** Reward good behavior or reset after time period.

---

### `/timeout`
**What it does:** Temporarily mutes a member (they can read but not send messages).

**Usage:** `/timeout member:<@user> duration:<minutes> [reason:<text>]`

**Examples:**
- `/timeout member:@Spammer duration:10 reason:Spam` - 10 minute timeout
- `/timeout member:@User duration:60` - 1 hour timeout
- `/timeout member:@Troublemaker duration:1440` - 24 hour timeout

**Required Permission:** Moderate Members

**Limits:** 1 minute to 40,320 minutes (28 days)

**What happens:**
- User cannot send messages, react, or speak in voice
- Can still read channels
- Automatically expires after duration

---

### `/untimeout`
**What it does:** Removes timeout from a member early.

**Usage:** `/untimeout member:<@user>`

**Examples:**
- `/untimeout member:@User` - Removes timeout immediately

**Required Permission:** Moderate Members

---

### `/purge`
**What it does:** Bulk deletes messages from a channel.

**Usage:** `/purge amount:<1-100>`

**Examples:**
- `/purge amount:10` - Deletes last 10 messages
- `/purge amount:50` - Deletes last 50 messages

**Required Permission:** Manage Messages

**Limitations:**
- Maximum 100 messages at once
- Cannot delete messages older than 14 days (Discord limitation)

**Use case:** Quickly clean up spam, bot commands, or off-topic conversation.

---

## 🎵 Music Commands

### `/play`
**What it does:** Plays music from YouTube in your voice channel.

**Usage:** `/play query:<song name or URL>`

**Examples:**
- `/play query:never gonna give you up` - Searches and plays
- `/play query:https://www.youtube.com/watch?v=dQw4w9WgXcQ` - Plays URL

**Required:** You must be in a voice channel

**What happens:**
- Bot joins your voice channel
- Searches YouTube or uses URL
- Adds to queue if song is playing
- Shows song info with thumbnail

---

### `/pause`
**What it does:** Pauses the currently playing song.

**Usage:** `/pause`

**Required:** Music must be playing

---

### `/resume`
**What it does:** Resumes paused music.

**Usage:** `/resume`

**Required:** Music must be paused

---

### `/skip`
**What it does:** Skips the current song and plays next in queue.

**Usage:** `/skip`

**Required:** Music must be playing

---

### `/stop`
**What it does:** Stops music and clears the entire queue.

**Usage:** `/stop`

**What happens:**
- Stops current song
- Clears all queued songs
- Bot stays in voice channel

---

### `/queue`
**What it does:** Shows the current music queue.

**Usage:** `/queue`

**Shows:**
- Currently playing song
- Next 10 songs in queue
- Total queue count
- Requested by information

---

### `/nowplaying`
**What it does:** Displays information about the currently playing song.

**Usage:** `/nowplaying`

**Shows:**
- Song title and link
- Thumbnail
- Duration
- Who requested it
- Playing/paused status

---

### `/leave`
**What it does:** Disconnects bot from voice channel.

**Usage:** `/leave`

**What happens:**
- Bot leaves voice channel
- Queue is cleared
- Music stops

---

## 👑 Role Management

### `/addrole`
**What it does:** Adds a role to a member.

**Usage:** `/addrole member:<@user> role:<@role>`

**Examples:**
- `/addrole member:@User role:@Member` - Adds Member role
- `/addrole member:@NewUser role:@Verified` - Adds Verified role

**Required Permission:** Manage Roles

**Restrictions:**
- Cannot assign roles higher than your highest role
- Cannot assign roles higher than bot's highest role

---

### `/removerole`
**What it does:** Removes a role from a member.

**Usage:** `/removerole member:<@user> role:<@role>`

**Examples:**
- `/removerole member:@User role:@Muted` - Removes Muted role

**Required Permission:** Manage Roles

---

### `/createrole`
**What it does:** Creates a new role in the server.

**Usage:** `/createrole name:<role-name>`

**Examples:**
- `/createrole name:VIP` - Creates VIP role
- `/createrole name:Event Winner` - Creates Event Winner role

**Required Permission:** Manage Roles

**Note:** Role is created with default permissions (none). Edit in Server Settings for permissions/color.

---

### `/deleterole`
**What it does:** Permanently deletes a role from the server.

**Usage:** `/deleterole role:<@role>`

**Examples:**
- `/deleterole role:@Old Role` - Deletes the role

**Required Permission:** Manage Roles

**Warning:** This action cannot be undone. All members lose this role.

---

### `/rolecolor`
**What it does:** Changes the color of a role.

**Usage:** `/rolecolor role:<@role> color:<hex-code>`

**Examples:**
- `/rolecolor role:@VIP color:#FF0000` - Changes to red
- `/rolecolor role:@Member color:00FF00` - Changes to green (# optional)

**Required Permission:** Manage Roles

**Color format:** Hex codes like #FF0000 (red), #00FF00 (green), #0099FF (blue)

---

### `/roleinfo`
**What it does:** Displays detailed information about a role.

**Usage:** `/roleinfo role:<@role>`

**Examples:**
- `/roleinfo role:@Admin` - Shows admin role info

**Shows:**
- Role ID
- Color (hex code)
- Position in hierarchy
- Member count
- Mentionable status
- Hoisted status (displayed separately)
- Creation date

---

### `/rolemembers`
**What it does:** Lists all members who have a specific role.

**Usage:** `/rolemembers role:<@role>`

**Examples:**
- `/rolemembers role:@Moderator` - Lists all moderators

**Shows:** First 25 members (Discord limit) with total count

---

## 🛠️ Utility Commands

### `/ping`
**What it does:** Checks bot latency and responsiveness.

**Usage:** `/ping`

**Shows:** API latency in milliseconds

**Use case:** Test if bot is online and responsive.

---

### `/serverinfo`
**What it does:** Displays detailed server information.

**Usage:** `/serverinfo`

**Shows:**
- Server name and icon
- Owner
- Server ID
- Creation date
- Member count
- Channel count
- Role count
- Boost level and boost count

---

### `/userinfo`
**What it does:** Displays information about a user or yourself.

**Usage:** `/userinfo [member:<@user>]`

**Examples:**
- `/userinfo` - Shows your info
- `/userinfo member:@Someone` - Shows their info

**Shows:**
- Username and display name
- User ID
- Account creation date
- Server join date
- Roles list
- Avatar

---

### `/avatar`
**What it does:** Displays a user's avatar in full size.

**Usage:** `/avatar [user:<@user>]`

**Examples:**
- `/avatar` - Shows your avatar
- `/avatar user:@Someone` - Shows their avatar

**Shows:** Full resolution (4096x4096) avatar image

---

### `/botinfo`
**What it does:** Displays information about the bot.

**Usage:** `/botinfo`

**Shows:**
- Bot name and ID
- Server count
- Uptime
- Node.js version
- Discord.js version
- Memory usage
- Platform information

---

## 🔍 Diagnostic Commands

### `/health`
**What it does:** Quick health check - confirms bot is running.

**Usage:** `/health`

**Shows:** Bot status and current latency

**Use case:** Quick test to see if bot is responsive.

---

### `/diagnose`
**What it does:** Comprehensive diagnostic report of bot permissions and status.

**Usage:** `/diagnose`

**Shows:**
- Bot role position
- All permissions in current channel
- Missing permissions (if any)
- Bot latency
- Server count
- Command count

**Use case:** 
- Troubleshoot why commands aren't working
- Check if bot has proper permissions
- Identify permission issues before they cause problems

**Recommendations:**
- Run in the same channel where you're having issues
- Bot role should be high in role hierarchy
- Bot needs these permissions for full functionality:
  - View Channel
  - Send Messages
  - Embed Links
  - Read Message History
  - Manage Messages
  - Moderate Members
  - Kick Members
  - Ban Members

---

## 💬 Message Commands

### `/say`
**What it does:** Makes the bot send a message as if it wrote it.

**Usage:** `/say message:<text> [channel:<#channel>]`

**Examples:**
- `/say message:Hello everyone!` - Bot says "Hello everyone!" in current channel
- `/say message:Welcome! channel:#welcome` - Bot says message in different channel

**Required Permission:** Manage Messages

**Safety:** Automatically prevents @everyone and @here mentions

**Use case:** 
- Announcements as bot
- Rules/info messages
- Automated messages

---

## 📊 Database & Logging

### What Gets Logged Automatically:
- ✅ All moderation actions (kick, ban, warn, timeout)
- ✅ Warning history with reasons and moderator info
- ✅ Purge operations
- ✅ Role assignments

### Database Information:
- **Type:** SQLite (bot_data.db)
- **Location:** Same folder as bot
- **Tables:**
  - `warnings` - All warning records
  - `mod_actions` - Complete moderation history
  - `server_config` - Server-specific settings

---

## 🔑 Permission Requirements Summary

| Permission | Required For |
|------------|-------------|
| **Manage Channels** | Channel creation/deletion/modification |
| **Kick Members** | Kick command |
| **Ban Members** | Ban/unban commands |
| **Moderate Members** | Timeout, warn, warnings |
| **Administrator** | Clear warnings |
| **Manage Messages** | Purge, say commands |
| **Manage Roles** | All role commands |
| **Connect** | Join voice channels |
| **Speak** | Play music |

---

## 💡 Tips & Best Practices

### Role Hierarchy
- Keep bot role near the top of role list
- Bot cannot moderate users with roles higher than its own
- Moderators need roles below bot role to use commands

### Music System
- Only one person needs to be in voice to start music
- Queue is server-specific
- Bot uses minimal bandwidth with optimized streaming

### Moderation
- Always provide reasons for actions (helps with appeals)
- Check warnings before issuing bans
- Use timeout for temporary issues, ban for serious violations

### Channel Management
- Test lock/unlock in test channel first
- Slowmode is per-channel, not server-wide
- Remember to unlock channels after events

---

## 🐛 Common Issues & Solutions

### "Bot doesn't respond to commands"
- Check bot is online: `/health`
- Check permissions: `/diagnose`
- Verify bot role position

### "Music won't play"
- Ensure you're in a voice channel
- Check bot has Connect and Speak permissions
- Try `/leave` then `/play` again

### "Can't kick/ban someone"
- Check their role position vs bot role
- Check their role position vs your role
- Use `/diagnose` to verify permissions

### "Commands not showing"
- Wait a few minutes (Discord sync delay)
- Check bot has "Use Application Commands" permission
- Re-invite bot with proper permissions

---

## 📞 Support

### Command Not Working?
1. Run `/diagnose` in the channel
2. Check error message for clues
3. Verify you have required permissions
4. Check bot role position

### Need Help?
- All commands have built-in descriptions
- Type `/` to see all available commands
- Use `/health` to check bot status
- Use `/diagnose` for detailed diagnostics

---

## 📈 Bot Statistics

- **Total Commands:** 41
- **Categories:** 7
- **Languages:** JavaScript (Node.js)
- **Framework:** Discord.js v14
- **Database:** SQLite
- **Music:** YouTube integration via play-dl

---

*Last Updated: January 30, 2026*
*Bot Version: 1.0*
*Total Features: 41 commands across 7 categories*
