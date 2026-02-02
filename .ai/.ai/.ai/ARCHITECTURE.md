# Architecture Overview

## Entry Point
- `bot.js` → initializes client, loads handlers, logs in

## Core Folders
- `/cogs` → command logic grouped by domain
- `/utils` → helpers, validators, embeds
- `/database` → SQLite or persistence layer
- `/logs` → runtime logs
- `/config.yaml` → bot configuration
- `.env` → secrets (TOKEN, CLIENT_ID, GUILD_ID)

## Command Flow
1. Discord Interaction received
2. Router identifies command name
3. Matching command module executed
4. Response returned to Discord
5. Errors caught and logged centrally

## Command Deployment Flow
- `deploy-commands.js` registers slash commands
- Runs manually
- Uses Guild commands during development
- Uses Global commands only for production

## Anti-Patterns (Never Do)
❌ Sync commands inside `bot.js`
❌ Block event loop with long async tasks
❌ Register duplicate command names
❌ Ignore REST rate limits
