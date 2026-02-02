# Command System Rules

## Command Format
Each command MUST export:
- name (lowercase, ≤32 chars)
- description (≤100 chars)
- execute(interaction)

## Example
```js
module.exports = {
  name: 'ping',
  description: 'Check bot latency',
  async execute(interaction) {
    await interaction.reply('Pong!');
  }
};
Limits

Max commands: unlimited (practically safe <100)

Max options per command: 25

Max choices per option: 25

Validation Rules

No uppercase names

No duplicate command names

No empty descriptions

No runtime REST calls inside execute()

If a command causes sync timeout, check:

Payload size

Invalid schema

Excessive options


---

## 4️⃣ `.ai/DEBUGGING_GUIDE.md`
> Makes AI fix problems instead of guessing

```md
# Debugging Rules for AI

## Known Issues
### Slash Command Sync Timeout (120s)
Root causes:
- Syncing on every startup
- Global command registration during dev
- Invalid command schema
- Network/DNS latency

Correct Fix Order:
1. Move sync to deploy-commands.js
2. Use guild commands
3. Validate command JSON
4. Increase REST timeout

## Logging Policy
- All errors must be logged
- No silent failures
- Use try/catch around async handlers

## What NOT to Suggest
❌ "Just increase timeout" without root cause
❌ "Reinstall node_modules" as default
❌ "Rewrite entire bot"
