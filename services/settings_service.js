const { getLogger } = require('../utils/logging');
const logger = getLogger('settings');

/**
 * Settings service for guild-specific configuration
 * Backed by SQLite for now, designed to be database-agnostic for future SaaS migration
 * 
 * This abstraction layer allows:
 * - Swapping SQLite -> PostgreSQL without rewriting commands
 * - Future web dashboard integration
 * - Schema validation and defaults
 */
class SettingsService {
    constructor(dbManager) {
        this.db = dbManager;
    }

    _normalizeConfigData(config) {
        if (!config || !config.config_data) return {};
        const raw = config.config_data;
        if (raw && typeof raw === 'object') return raw;
        if (typeof raw === 'string') {
            try {
                return JSON.parse(raw);
            } catch {
                return {};
            }
        }
        return {};
    }

    /**
     * Get a setting value for a guild
     * @param {string} guildId
     * @param {string} key
     * @param {any} defaultValue
     * @returns {any}
     */
    get(guildId, key, defaultValue = null) {
        try {
            const config = this.db.getServerConfig(guildId);
            if (!config || !config.config_data) return defaultValue;

            const data = this._normalizeConfigData(config);
            return data[key] !== undefined ? data[key] : defaultValue;
        } catch (error) {
            logger.error(`Failed to get setting ${key} for guild ${guildId}:`, error);
            return defaultValue;
        }
    }

    /**
     * Set a setting value for a guild
     * @param {string} guildId
     * @param {string} key
     * @param {any} value
     */
    set(guildId, key, value) {
        try {
            const config = this.db.getServerConfig(guildId) || {};
            const data = this._normalizeConfigData(config);
            
            data[key] = value;
            
            this.db.setServerConfig(guildId, {
                ...config,
                config_data: data
            });
            
            logger.info(`Set ${key}=${JSON.stringify(value)} for guild ${guildId}`);
        } catch (error) {
            logger.error(`Failed to set setting ${key} for guild ${guildId}:`, error);
            throw error;
        }
    }

    /**
     * Get all settings for a guild
     * @param {string} guildId
     * @returns {object}
     */
    getAll(guildId) {
        try {
            const config = this.db.getServerConfig(guildId);
            if (!config || !config.config_data) return {};

            return this._normalizeConfigData(config);
        } catch (error) {
            logger.error(`Failed to get all settings for guild ${guildId}:`, error);
            return {};
        }
    }

    /**
     * Delete a setting for a guild
     * @param {string} guildId
     * @param {string} key
     */
    delete(guildId, key) {
        try {
            const config = this.db.getServerConfig(guildId);
            if (!config || !config.config_data) return;

            const data = this._normalizeConfigData(config);
            delete data[key];
            
            this.db.setServerConfig(guildId, {
                ...config,
                config_data: data
            });
            
            logger.info(`Deleted setting ${key} for guild ${guildId}`);
        } catch (error) {
            logger.error(`Failed to delete setting ${key} for guild ${guildId}:`, error);
            throw error;
        }
    }

    /**
     * Clear all settings for a guild
     * @param {string} guildId
     */
    clear(guildId) {
        try {
            this.db.setServerConfig(guildId, {
                guild_id: guildId,
                config_data: {}
            });
            
            logger.info(`Cleared all settings for guild ${guildId}`);
        } catch (error) {
            logger.error(`Failed to clear settings for guild ${guildId}:`, error);
            throw error;
        }
    }

    /**
     * Get module-specific settings with defaults
     * @param {string} guildId
     * @param {string} module - Module name (e.g., 'automod', 'tickets')
     * @param {object} schema - Default schema
     * @returns {object}
     */
    getModule(guildId, module, schema = {}) {
        const key = `module_${module}`;
        return this.get(guildId, key, schema);
    }

    /**
     * Set module-specific settings
     * @param {string} guildId
     * @param {string} module - Module name
     * @param {object} settings - Settings object
     */
    setModule(guildId, module, settings) {
        const key = `module_${module}`;
        this.set(guildId, key, settings);
    }
}

module.exports = SettingsService;
