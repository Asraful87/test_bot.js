# Discord Bot - JavaScript Version

## Installation

1. Install Node.js (v18 or higher) from https://nodejs.org/
2. Install dependencies:
```bash
npm install
```

## Running the Bot

```bash
npm start
```

For development with auto-restart:
```bash
npm run dev
```

## Commands Converted

### Moderation
- `/kick` - Kick a member
- `/ban` - Ban a member
- `/warn` - Warn a member

### Music
- `/play` - Play music from YouTube
- `/stop` - Stop music and leave
- `/skip` - Skip current song

### Utilities
- `/ping` - Check bot latency
- `/serverinfo` - Display server information

## TODO: Additional Commands to Convert

The following Python cogs still need to be converted to JavaScript:

### From moderation.py
- unban, timeout, untimeout, warnings, clearwarnings, purge, slowmode, lockdown, unlockdown, mute, unmute

### From channels.py
- createchannel, deletechannel, clonechannel, editchannel, lockchannel, unlockchannel, setslowmode

### From messages.py
- purge (messages), purgeuser, purgebot, purgecontains, say, edit, embed, react

### From roles.py
- createrole, deleterole, editrole, giverole, removerole, roleinfo, rolemembers

### From utilities.py
- userinfo, avatar, banner, servericon, serverbanner, membercount, roleinfo, channelinfo, firstmessage

### From setup.py
- setup (moderation logs, welcome, verification, etc.)

### From verification.py
- verify, verifysetup

### From tickets.py
- ticket, ticketsetup, closeticket

### From antiraid.py
- antiraid configuration

### From antispam.py
- antispam configuration

### From automod.py
- automod rules and configuration

### From Welcome.py
- welcome message configuration

### From diagnostics.py
- botinfo, guilds, uptime

## Converting Additional Commands

To convert a Python command to JavaScript:

1. Create a new .js file in the appropriate commands folder
2. Follow this template:

\`\`\`javascript
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('commandname')
        .setDescription('Command description')
        .addStringOption(option =>
            option.setName('option')
                .setDescription('Option description')
                .setRequired(true)),

    async execute(interaction, bot) {
        // Command logic here
        await interaction.reply('Response');
    }
};
\`\`\`

3. The bot will automatically load it on restart

## Notes

- Database is SQLite using better-sqlite3 (synchronous, better performance)
- Music uses play-dl for YouTube support
- All embeds use discord.js EmbedBuilder
- Logging uses Winston
