const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { readdirSync } = require('fs');
const { join } = require('path');
const yaml = require('js-yaml');
const fs = require('fs');
const dotenv = require('dotenv');
const DatabaseManager = require('./database/db_manager');
const { setupLogging, getLogger } = require('./utils/logging');

dotenv.config();

// Load config
const config = yaml.load(fs.readFileSync('config.yaml', 'utf8'));

// Setup logging
setupLogging();
const logger = getLogger('modbot');

class ModBot extends Client {
    constructor() {
        super({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.GuildVoiceStates,
                GatewayIntentBits.GuildPresences
            ]
        });

        this.config = config;
        this.db = new DatabaseManager();
        this.commands = new Collection();
        this.synced = false;
    }

    async loadCommands() {
        const commandsPath = join(__dirname, 'commands');
        
        if (!fs.existsSync(commandsPath)) {
            fs.mkdirSync(commandsPath, { recursive: true });
        }

        const commandFolders = readdirSync(commandsPath);

        for (const folder of commandFolders) {
            const folderPath = join(commandsPath, folder);
            if (!fs.statSync(folderPath).isDirectory()) continue;

            const commandFiles = readdirSync(folderPath).filter(file => file.endsWith('.js'));

            for (const file of commandFiles) {
                try {
                    const command = require(join(folderPath, file));
                    if ('data' in command && 'execute' in command) {
                        this.commands.set(command.data.name, command);
                        logger.info(`Loaded command: ${folder}/${file}`);
                    }
                } catch (error) {
                    logger.error(`Failed to load command ${folder}/${file}:`, error);
                }
            }
        }
    }

    async setupHook() {
        try {
            await this.db.initDb();
            logger.info('Database initialized');
        } catch (error) {
            logger.error('DB init failed:', error);
        }

        await this.loadCommands();
    }
}

const bot = new ModBot();

bot.once('ready', async () => {
    if (!bot.synced) {
        const guildId = process.env.GUILD_ID;
        
        try {
            if (guildId) {
                const guild = bot.guilds.cache.get(guildId);
                if (guild) {
                    const commands = Array.from(bot.commands.values()).map(cmd => cmd.data);
                    await guild.commands.set(commands);
                    logger.info(`✅ Guild-synced ${commands.length} slash commands to guild ${guildId}`);
                }
            } else {
                const commands = Array.from(bot.commands.values()).map(cmd => cmd.data);
                await bot.application.commands.set(commands);
                logger.info(`✅ Globally synced ${commands.length} slash commands`);
            }
            bot.synced = true;
        } catch (error) {
            logger.error('Failed to sync commands:', error);
        }
    }

    logger.info(`Logged in as ${bot.user.tag} (ID: ${bot.user.id})`);
    logger.info(`Connected to ${bot.guilds.cache.size} guild(s)`);
});

bot.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = bot.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction, bot);
    } catch (error) {
        logger.error(`Command error in ${interaction.commandName}:`, error);
        
        const errorMessage = `❌ An error occurred: ${error.message}`;
        
        try {
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: errorMessage, ephemeral: true });
            } else {
                await interaction.followUp({ content: errorMessage, ephemeral: true });
            }
        } catch (err) {
            logger.error(`Failed to send error message for interaction ${interaction.id}`);
        }
    }
});

async function main() {
    const token = process.env.DISCORD_TOKEN;
    
    if (!token) {
        throw new Error('DISCORD_TOKEN is not set. Add it to your .env file.');
    }

    try {
        await bot.setupHook();
        await bot.login(token);
    } catch (error) {
        if (error.code === 'TOKEN_INVALID') {
            logger.error('Discord login failed: invalid DISCORD_TOKEN. Regenerate the bot token and update your .env file.');
        } else {
            logger.error('Unexpected error during bot execution:', error);
        }
        process.exit(1);
    }
}

process.on('SIGINT', () => {
    logger.info('Bot stopped');
    bot.destroy();
    process.exit(0);
});

process.on('unhandledRejection', error => {
    logger.error('Unhandled promise rejection:', error);
});

main().catch(error => {
    logger.error('Fatal error:', error);
    process.exit(1);
});
