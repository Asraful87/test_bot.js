# Discord Moderation Bot

A comprehensive Discord moderation bot with advanced features for server management.

## Features

- **Moderation Commands**: Kick, ban, warn, timeout, and mute members
- **Channel Management**: Create, delete, and configure channels
- **Message Utilities**: Bulk delete messages and message management
- **Role Management**: Assign, remove, and manage roles
- **Utilities**: Server info, user info, ping, and more
- **Setup Wizard**: Easy configuration for new servers

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd discord-mod-bot
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Configure the bot:
   - Copy `.env.example` to `.env`
   - Add your Discord bot token to `.env`
   - Modify `config.yaml` to suit your needs

4. Run the bot:
```bash
python bot.py
```

## Configuration

### Environment Variables (.env)
- `DISCORD_TOKEN`: Your Discord bot token from the Discord Developer Portal

### config.yaml
- `bot.command_prefix`: Command prefix for classic text commands (default: !)
- `moderation`: Moderation settings and auto-actions
- `permissions`: Role-based permissions
- `features`: Channel configurations

## Commands

### Moderation
- `!kick <member> [reason]` - Kick a member
- `!ban <member> [reason]` - Ban a member
- `!unban <user_id>` - Unban a user
- `!warn <member> [reason]` - Warn a member
- `!warnings <member>` - View member warnings
- `!timeout <member> <duration> [reason]` - Timeout a member
- `!untimeout <member>` - Remove timeout from a member

### Messages
- `!purge <amount>` - Delete multiple messages
- `!clear <amount> [member]` - Clear messages from a user

### Channels
- `!createchannel <name> [type]` - Create a new channel
- `!deletechannel <channel>` - Delete a channel
- `!lockchannel [channel]` - Lock a channel
- `!unlockchannel [channel]` - Unlock a channel

### Roles
- `!addrole <member> <role>` - Add a role to a member
- `!removerole <member> <role>` - Remove a role from a member
- `!createrole <name>` - Create a new role
- `!deleterole <role>` - Delete a role

### Utilities
- `!ping` - Check bot latency
- `!serverinfo` - Display server information
- `!userinfo [member]` - Display user information

### Slash Setup Commands
- `/setup-wizard` - Show setup steps
- `/setup-logchannel #channel` - Set mod log channel
- `/setup-welcomechannel #channel` - Set welcome channel
- `/setup-config` - View current configuration

Note: Slash commands are the primary interface. Classic `!` prefix commands are also available and use the prefix from `bot.command_prefix`.

## Permissions

The bot requires the following permissions:
- Manage Channels
- Manage Roles
- Kick Members
- Ban Members
- Manage Messages
- Moderate Members (for timeouts)
- View Channels
- Send Messages
- Embed Links

## Database

The bot uses SQLite to store:
- Member warnings
- Moderation logs
- Server configurations

## Support

For issues or questions, please open an issue on GitHub.

## License

MIT License
