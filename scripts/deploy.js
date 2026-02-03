#!/usr/bin/env node
/**
 * Command deployment script - Run manually to register slash commands
 * Usage: node scripts/deploy.js
 */

const { REST, Routes } = require('discord.js');
const { readdirSync, statSync } = require('fs');
const { join } = require('path');
require('dotenv').config();

const commands = [];
const commandsPath = join(__dirname, '..', 'commands');

// Load commands from /commands/*/*.js (same structure as bot.js)
function loadCommands(dir, options = {}) {
  const folders = readdirSync(dir);
  const disabledFolders = new Set(options.disabledFolders || []);
  
  for (const folder of folders) {
    if (disabledFolders.has(folder)) {
      console.log(`- Skipping ${folder} commands (disabled by config)`);
      continue;
    }
    const folderPath = join(dir, folder);
    if (!statSync(folderPath).isDirectory()) continue;
    
    const files = readdirSync(folderPath).filter(f => f.endsWith('.js'));
    
    for (const file of files) {
      try {
        const cmd = require(join(folderPath, file));
        if (cmd?.data) {
          commands.push(cmd.data.toJSON());
          console.log(`✓ Loaded ${folder}/${file}`);
        }
      } catch (error) {
        console.warn(`⚠ Failed to load ${folder}/${file}:`, error.message);
      }
    }
  }
}

let disabledFolders = [];
try {
  const yaml = require('js-yaml');
  const fs = require('fs');
  if (fs.existsSync('config.yaml')) {
    const config = yaml.load(fs.readFileSync('config.yaml', 'utf8')) || {};
    if (config?.music?.enabled === false) {
      disabledFolders.push('music');
    }
  }
} catch {
  // ignore config parse errors for deploy
}

loadCommands(commandsPath, { disabledFolders });

console.log(`\n📦 Commands found: ${commands.length}`);
console.log(`   ${commands.map(c => c.name).join(', ')}\n`);

if (commands.length === 0) {
  console.error('❌ No commands found. Check your /commands folder.');
  process.exit(1);
}

const rest = new REST({ version: '10', timeout: 300000 })
  .setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    // Extract CLIENT_ID from token
    const tokenParts = process.env.DISCORD_TOKEN.split('.');
    const clientId = Buffer.from(tokenParts[0], 'base64').toString('ascii');
    
    // Get GUILD_ID from env or config
    const yaml = require('js-yaml');
    const fs = require('fs');
    let guildId = process.env.GUILD_ID;
    
    if (!guildId && fs.existsSync('config.yaml')) {
      const config = yaml.load(fs.readFileSync('config.yaml', 'utf8'));
      guildId = config?.bot?.guild_id;
    }
    
    if (!guildId) {
      throw new Error('GUILD_ID not found in .env or config.yaml');
    }
    
    console.log(`🎯 Target: Guild ${guildId}`);
    console.log(`⏳ Deploying...`);
    console.time('DEPLOY');
    
    await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      { body: commands }
    );
    
    console.timeEnd('DEPLOY');
    console.log(`\n✅ Successfully deployed ${commands.length} commands`);
    console.log(`💡 Commands are now available in Discord (type / to test)`);
    
  } catch (error) {
    console.error('\n❌ Deploy failed');
    console.error(error);
    process.exit(1);
  }
})();
