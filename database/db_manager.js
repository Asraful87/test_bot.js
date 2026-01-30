const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

class DatabaseManager {
    constructor(dbPath = 'bot_data.db') {
        this.dbPath = dbPath;
        this.db = null;
        this.SQL = null;
    }

    async initDb() {
        await this.connect();
    }

    async connect() {
        const dir = path.dirname(this.dbPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        this.SQL = await initSqlJs();

        // Load existing database or create new one
        if (fs.existsSync(this.dbPath)) {
            const buffer = fs.readFileSync(this.dbPath);
            this.db = new this.SQL.Database(buffer);
        } else {
            this.db = new this.SQL.Database();
        }

        await this._createTables();
        this._save();
    }

    _save() {
        if (this.db) {
            const data = this.db.export();
            const buffer = Buffer.from(data);
            fs.writeFileSync(this.dbPath, buffer);
        }
    }

    close() {
        if (this.db) {
            this._save();
            this.db.close();
        }
    }

    async _createTables() {
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS warnings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                guild_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                mod_id INTEGER NOT NULL,
                reason TEXT NOT NULL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                active BOOLEAN DEFAULT 1
            );

            CREATE TABLE IF NOT EXISTS mod_actions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                guild_id INTEGER NOT NULL,
                action_type TEXT NOT NULL,
                target_id INTEGER NOT NULL,
                mod_id INTEGER NOT NULL,
                reason TEXT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                metadata TEXT,
                duration INTEGER
            );

            CREATE TABLE IF NOT EXISTS server_config (
                guild_id INTEGER PRIMARY KEY,
                mod_log_channel_id INTEGER,
                welcome_channel_id INTEGER,
                allowed_admin_role_ids TEXT,
                muted_role_id INTEGER,
                config_data TEXT
            );

            CREATE INDEX IF NOT EXISTS idx_warnings_guild_user 
            ON warnings(guild_id, user_id, active);

            CREATE INDEX IF NOT EXISTS idx_mod_actions_guild 
            ON mod_actions(guild_id, timestamp);
        `);

        this._save();
    }

    // ==================== WARNINGS ====================

    addWarning(guildId, userId, modId, reason) {
        this.db.run(`
            INSERT INTO warnings (guild_id, user_id, mod_id, reason)
            VALUES (?, ?, ?, ?)
        `, [guildId, userId, modId, reason]);
        this._save();
        const result = this.db.exec('SELECT last_insert_rowid() as id')[0];
        return result.values[0][0];
    }

    getWarnings(guildId, userId, activeOnly = true) {
        let query = `SELECT * FROM warnings WHERE guild_id = ? AND user_id = ?`;
        const params = [guildId, userId];

        if (activeOnly) {
            query += ' AND active = 1';
        }

        query += ' ORDER BY timestamp DESC';

        const result = this.db.exec(query, params);
        if (!result.length) return [];

        const columns = result[0].columns;
        return result[0].values.map(row => {
            const obj = {};
            columns.forEach((col, idx) => {
                obj[col] = row[idx];
            });
            return obj;
        });
    }

    getWarningCount(guildId, userId, activeOnly = true) {
        let query = `SELECT COUNT(*) as count FROM warnings WHERE guild_id = ? AND user_id = ?`;
        const params = [guildId, userId];

        if (activeOnly) {
            query += ' AND active = 1';
        }

        const result = this.db.exec(query, params);
        return result.length ? result[0].values[0][0] : 0;
    }

    clearWarnings(guildId, userId) {
        this.db.run(`
            UPDATE warnings SET active = 0
            WHERE guild_id = ? AND user_id = ? AND active = 1
        `, [guildId, userId]);
        this._save();
        return this.db.getRowsModified();
    }

    // ==================== MOD ACTIONS ====================

    logAction(guildId, actionType, targetId, modId, reason = null, metadata = null, duration = null) {
        const metadataJson = metadata ? JSON.stringify(metadata) : null;

        this.db.run(`
            INSERT INTO mod_actions 
            (guild_id, action_type, target_id, mod_id, reason, metadata, duration)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [guildId, actionType, targetId, modId, reason, metadataJson, duration]);
        this._save();
        const result = this.db.exec('SELECT last_insert_rowid() as id')[0];
        return result.values[0][0];
    }

    getModActions(guildId, limit = 50, actionType = null, targetId = null, modId = null) {
        let query = 'SELECT * FROM mod_actions WHERE guild_id = ?';
        const params = [guildId];

        if (actionType) {
            query += ' AND action_type = ?';
            params.push(actionType);
        }

        if (targetId) {
            query += ' AND target_id = ?';
            params.push(targetId);
        }

        if (modId) {
            query += ' AND mod_id = ?';
            params.push(modId);
        }

        query += ' ORDER BY timestamp DESC LIMIT ?';
        params.push(limit);

        const result = this.db.exec(query, params);
        if (!result.length) return [];

        const columns = result[0].columns;
        return result[0].values.map(row => {
            const obj = {};
            columns.forEach((col, idx) => {
                obj[col] = row[idx];
            });
            if (obj.metadata) {
                obj.metadata = JSON.parse(obj.metadata);
            }
            return obj;
        });
    }

    // ==================== SERVER CONFIG ====================

    getServerConfig(guildId) {
        const result = this.db.exec('SELECT * FROM server_config WHERE guild_id = ?', [guildId]);
        if (!result.length) return null;

        const columns = result[0].columns;
        const row = {};
        columns.forEach((col, idx) => {
            row[col] = result[0].values[0][idx];
        });

        if (row.allowed_admin_role_ids) {
            row.allowed_admin_role_ids = JSON.parse(row.allowed_admin_role_ids);
        }
        if (row.config_data) {
            row.config_data = JSON.parse(row.config_data);
        }

        return row;
    }

    updateServerConfig(guildId, options = {}) {
        const existing = this.getServerConfig(guildId);

        if (!existing) {
            this.db.run(`
                INSERT INTO server_config 
                (guild_id, mod_log_channel_id, welcome_channel_id, allowed_admin_role_ids, muted_role_id, config_data)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [
                guildId,
                options.mod_log_channel_id || null,
                options.welcome_channel_id || null,
                JSON.stringify(options.allowed_admin_role_ids || []),
                options.muted_role_id || null,
                JSON.stringify(options.config_data || {})
            ]);
        } else {
            const updates = [];
            const params = [];

            if (options.mod_log_channel_id !== undefined) {
                updates.push('mod_log_channel_id = ?');
                params.push(options.mod_log_channel_id);
            }
            if (options.welcome_channel_id !== undefined) {
                updates.push('welcome_channel_id = ?');
                params.push(options.welcome_channel_id);
            }
            if (options.allowed_admin_role_ids !== undefined) {
                updates.push('allowed_admin_role_ids = ?');
                params.push(JSON.stringify(options.allowed_admin_role_ids));
            }
            if (options.muted_role_id !== undefined) {
                updates.push('muted_role_id = ?');
                params.push(options.muted_role_id);
            }
            if (options.config_data !== undefined) {
                updates.push('config_data = ?');
                params.push(JSON.stringify(options.config_data));
            }

            if (updates.length > 0) {
                params.push(guildId);
                const query = `UPDATE server_config SET ${updates.join(', ')} WHERE guild_id = ?`;
                this.db.run(query, params);
            }
        }

        this._save();
    }

    updateServerSetting(guildId, key, value) {
        const existing = this.getServerConfig(guildId);
        const data = (existing && existing.config_data) || {};
        data[key] = value;
        this.updateServerConfig(guildId, { config_data: data });
    }

    getServerSettings(guildId) {
        const existing = this.getServerConfig(guildId);
        const data = (existing && existing.config_data) || {};
        return {
            log_channel: data.log_channel || (existing && existing.mod_log_channel_id) || null,
            welcome_channel: data.welcome_channel || (existing && existing.welcome_channel_id) || null
        };
    }
}

module.exports = DatabaseManager;
