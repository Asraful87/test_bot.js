// Force load encryption library for Discord voice
let sodium;

try {
    // Try sodium-native first (fastest)
    sodium = require('sodium-native');
    console.log('✅ Loaded sodium-native for voice encryption');
} catch (e1) {
    try {
        // Try libsodium-wrappers
        sodium = require('libsodium-wrappers');
        console.log('✅ Loaded libsodium-wrappers for voice encryption');
    } catch (e2) {
        try {
            // Fallback to tweetnacl
            sodium = require('tweetnacl');
            console.log('✅ Loaded tweetnacl for voice encryption');
        } catch (e3) {
            console.error('❌ Failed to load encryption library for voice.');
            console.error('Install with: npm install libsodium-wrappers');
        }
    }
}

module.exports = sodium;
