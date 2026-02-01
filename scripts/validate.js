const fs = require('fs');
const path = require('path');

function listJsFiles(dir) {
    const out = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            out.push(...listJsFiles(full));
        } else if (entry.isFile() && entry.name.endsWith('.js')) {
            out.push(full);
        }
    }
    return out;
}

function requireFile(file) {
    try {
        require(file);
        return { file, ok: true };
    } catch (err) {
        return {
            file,
            ok: false,
            error: err && (err.stack || err.message || String(err))
        };
    }
}

function main() {
    const root = path.resolve(__dirname, '..');

    // Require a few critical deps to ensure package.json is consistent
    const depChecks = ['discord.js', '@discordjs/voice', 'play-dl', 'ffmpeg-static', 'tweetnacl', 'sql.js'];
    const depResults = depChecks.map((name) => {
        try {
            require(name);
            return { name, ok: true };
        } catch (err) {
            return { name, ok: false, error: err && (err.message || String(err)) };
        }
    });

    const commandDir = path.join(root, 'commands');
    const utilsDir = path.join(root, 'utils');
    const dbDir = path.join(root, 'database');

    const files = []
        .concat(fs.existsSync(commandDir) ? listJsFiles(commandDir) : [])
        .concat(fs.existsSync(utilsDir) ? listJsFiles(utilsDir) : [])
        .concat(fs.existsSync(dbDir) ? listJsFiles(dbDir) : []);

    const results = files.map(requireFile);
    const failures = results.filter(r => !r.ok);

    console.log('Dependency checks:');
    for (const r of depResults) {
        console.log(`- ${r.ok ? 'OK' : 'FAIL'}: ${r.name}${r.ok ? '' : ` (${r.error})`}`);
    }

    console.log(`\nRequire checks: ${results.length} files`);
    if (failures.length === 0) {
        console.log('✅ All requires succeeded.');
        process.exit(0);
    }

    console.log(`❌ ${failures.length} require(s) failed:`);
    for (const f of failures) {
        console.log(`\n--- ${path.relative(root, f.file)} ---\n${f.error}`);
    }

    process.exit(1);
}

main();
