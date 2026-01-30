# 🤖 GG Bot - Complete Discord Moderation & Music Bot

A powerful, feature-rich Discord bot built with Discord.js v14, featuring comprehensive moderation tools, music playback, ticket system, verification, and advanced security features.

[![Discord.js](https://img.shields.io/badge/discord.js-v14.14.1-blue.svg)](https://discord.js.org/)
[![Node.js](https://img.shields.io/badge/node.js-v24.13.0-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-MIT-orange.svg)](LICENSE)

## ✨ Features

### 🛡️ **Moderation Commands (14)**
- **Kick/Ban/Unban** - Manage problematic users
- **Warn/Warnings/Clearwarnings/Unwarn** - Warning system with database tracking
- **Timeout/Untimeout** - Temporary user restrictions
- **Mute/Unmute** - Voice channel muting (alias for timeout)
- **Purge** - Bulk message deletion (1-100 messages)

### 🎵 **Music Commands (9)**
- **Play** - Play YouTube music with search support
- **Pause/Resume** - Control playback
- **Skip/Stop** - Queue management
- **Queue** - View current playlist
- **Now Playing** - Display current track
- **Volume** - Adjust volume (0-100%)
- **Leave** - Disconnect from voice channel

### 📝 **Channel Management (7)**
- **Create/Delete Channel** - Channel lifecycle management
- **Lock/Unlock Channel** - Permission control
- **Set Channel Name/Topic** - Channel configuration
- **Slowmode** - Rate limiting (0-21600 seconds)

### 👥 **Role Management (7)**
- **Create/Delete Role** - Role lifecycle
- **Add/Remove Role** - Assign roles to users
- **Role Color** - Customize role colors
- **Role Info** - View role details
- **Role Members** - List all users with a role

### 🎫 **Ticket System**
- **Post Ticket Panel** - Interactive select menu with 3 categories:
  - 🛠️ **Support** - Technical assistance
  - 📢 **Report** - Report issues
  - 🤝 **Partnership** - Business inquiries
- **Close/Reopen/Delete** - Ticket management buttons
- **Transcripts** - Automatic chat history generation
- **Permission Management** - Auto-configured channel permissions

### ✅ **Verification System**
- **Post Verify Panel** - Button-based verification
- **Auto Role Assignment** - Persistent verification button
- **Permission Checks** - Smart error handling

### 🛡️ **AutoMod System**
- **Word Filter** - 145+ blocked spam/scam phrases
- **Mention Spam** - Configurable mention limits
- **Discord Invite Blocker** - Prevent invite spam
- **Link Filter** - Role-based link blocking
- **Auto Actions** - Delete/warn/timeout violations
- **Setup Commands** - `/setup_automod toggle/status/add_word/remove_word`

### 🚨 **Anti-Raid System**
- **Join Rate Detection** - Monitor suspicious join patterns
- **Account Age Check** - Filter new accounts (configurable threshold)
- **Auto Timeout** - Automatic action on raid detection
- **Lockdown Commands** - `/setup_antiraid lockdown/unlock`
- **Real-time Monitoring** - Persistent join tracking

### 🔧 **Utility Commands (5)**
- **Ping** - Check bot latency
- **Server Info** - Detailed guild information
- **User Info** - Member details and activity
- **Avatar** - Display user avatars
- **Bot Info** - System statistics and uptime

### 📊 **Diagnostics (2)**
- **Health** - System health check
- **Diagnose** - Database and configuration status
- **Features** - List all 48 commands

### 💬 **Message Commands (1)**
- **Say** - Send messages as the bot

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** v18.0.0 or higher ([Download](https://nodejs.org/))
- **FFmpeg** (for music features) - Installed automatically on Windows via winget
- **Discord Bot Token** ([Get one here](https://discord.com/developers/applications))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Asraful87/GG-Bot.git
   cd GG-Bot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   # Copy the example file
   cp .env.example .env
   
   # Edit .env and add your bot token
   DISCORD_TOKEN=your_bot_token_here
   ```

4. **Configure settings** (optional)
   Edit `config.yaml` to customize:
   - Bot prefix and permissions
   - AutoMod rules and blocked words
   - Anti-Spam thresholds
   - Anti-Raid detection settings
   - Verification role name
   - Ticket categories

5. **Run the bot**
   ```bash
   node bot.js
   ```

---

## 📋 Commands Overview

### Command Format
All commands use Discord's slash command system (`/command`).

### Permission Requirements
Most moderation commands require:
- **Administrator** - Full server management
- **Manage Channels** - Channel operations
- **Manage Roles** - Role operations
- **Kick/Ban Members** - User moderation
- **Manage Messages** - Message deletion

---

## ⚙️ Configuration

### config.yaml Structure

```yaml
# Bot Settings
bot:
  prefix: "!"
  guild_id: your_guild_id

# AutoMod Configuration
automod:
  enabled: true
  max_mentions: 5
  block_discord_invites: true
  blocked_words: [list of 145+ spam phrases]

# Anti-Spam Settings
antispam:
  enabled: true
  max_messages: 6
  per_seconds: 8
  spam_action: "timeout"

# Anti-Raid Settings
antiraid:
  enabled: true
  join_threshold: 5
  join_interval_seconds: 10
  min_account_age_days: 3

# Verification System
verification:
  role_name: "Verified"
  panel_title: "🔰 Verification Required"

# Ticket System
tickets:
  categories:
    - support
    - report
    - partnership
```

---

## 📊 System Architecture

```
GG-Bot/
├── bot.js              # Main bot entry point
├── config.yaml         # Configuration file
├── package.json        # Dependencies
├── .env                # Environment variables (gitignored)
├── commands/           # Slash commands
│   ├── antiraid/       # Anti-raid commands
│   ├── automod/        # AutoMod commands
│   ├── channels/       # Channel management
│   ├── diagnostics/    # Health checks
│   ├── messages/       # Message utilities
│   ├── moderation/     # User moderation
│   ├── music/          # Music playback
│   ├── roles/          # Role management
│   ├── tickets/        # Ticket system
│   ├── utilities/      # General utilities
│   └── verification/   # Verification panel
├── database/           # SQLite database manager
│   └── db_manager.js   # Database operations
└── utils/              # Utility functions
    ├── checks.js       # Permission checks
    ├── embeds.js       # Embed builders
    └── logging.js      # Winston logger
```

---

## 🔐 Security Features

### AutoMod Protection
- **Nitro/Gift Scams** - Blocks fake Discord Nitro offers
- **Phishing Links** - Detects malicious domains
- **QR Code Scams** - Prevents QR code attacks
- **Trading Scams** - Filters account trading spam
- **NSFW Content** - Blocks adult content links
- **Self-Promotion** - Prevents spam advertising

### Anti-Raid Protection
- **Join Rate Monitoring** - Tracks join velocity
- **Account Age Filter** - Blocks brand new accounts
- **Auto Lockdown** - Emergency server lock
- **Permission Management** - Granular channel control

### Data Protection
- **SQLite Database** - Local, encrypted storage
- **Environment Variables** - Secure token management
- **.gitignore** - Prevents credential leaks
- **Error Logging** - Winston logger for debugging

---

## 📦 Dependencies

```json
{
  "discord.js": "^14.14.1",           // Discord API
  "@discordjs/voice": "^0.17.0",      // Voice connections
  "play-dl": "^1.9.7",                // YouTube streaming
  "opusscript": "^0.1.1",             // Audio encoding
  "sql.js": "^1.10.3",                // SQLite database
  "winston": "^3.11.0",               // Logging
  "js-yaml": "^4.1.0",                // Config parsing
  "dotenv": "^16.3.1"                 // Environment vars
}
```

---

## 🤝 Support & Contributing

### Get Help
- **GitHub Issues**: [Report bugs](https://github.com/Asraful87/GG-Bot/issues)
- **Discord Server**: [Join for support](#)

### Contributing
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🎯 Roadmap

- [x] Complete 100% JavaScript conversion
- [x] AutoMod system with 145+ blocked terms
- [x] Anti-Raid with join monitoring
- [x] Ticket system with transcripts
- [x] Verification with button interactions
- [ ] Web dashboard for configuration
- [ ] Multi-server database support
- [ ] Custom command builder
- [ ] Economy system
- [ ] Leveling & XP tracking

---

## 👨‍💻 Author

**Asraful**
- GitHub: [@Asraful87](https://github.com/Asraful87)
- Discord Bot: ggBot#5757

---

## 🙏 Acknowledgments

- [Discord.js Guide](https://discordjs.guide/) - Excellent documentation
- [play-dl](https://github.com/play-dl/play-dl) - YouTube music streaming
- Community contributors and testers

---

## 📈 Stats

- **Total Commands**: 48 slash commands
- **Blocked Terms**: 145+ spam/scam phrases
- **Code Lines**: ~5,000 lines of JavaScript
- **Last Updated**: January 30, 2026
- **Version**: 2.0.0 (100% JavaScript)

---

**⭐ If you find this bot useful, please consider starring the repository!**
