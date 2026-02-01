// Shared music state across commands (singleton via Node require cache)

const queues = new Map();

function getQueue(guildId) {
    if (!queues.has(guildId)) {
        queues.set(guildId, {
            songs: [],
            current: null, // { title, url, duration, thumbnail, requestedBy, resource? }
            player: null,
            connection: null,
            loopMode: false
        });
    }
    return queues.get(guildId);
}

function clearQueue(guildId) {
    const queue = queues.get(guildId);
    if (!queue) return;

    queue.songs = [];
    queue.current = null;
}

function destroyQueue(guildId) {
    const queue = queues.get(guildId);
    if (!queue) return;

    try {
        queue.songs = [];
        queue.current = null;

        if (queue.player) {
            try {
                queue.player.stop(true);
            } catch {
                // ignore
            }
        }

        if (queue.connection) {
            try {
                queue.connection.destroy();
            } catch {
                // ignore
            }
        }
    } finally {
        queues.delete(guildId);
    }
}

module.exports = {
    queues,
    getQueue,
    clearQueue,
    destroyQueue
};
