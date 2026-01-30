const { SlashCommandBuilder } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, VoiceConnectionStatus, entersState } = require('@discordjs/voice');
const play = require('play-dl');
const { successEmbed, errorEmbed } = require('../../utils/embeds');

// Queue manager
const queues = new Map();

function getQueue(guildId) {
    if (!queues.has(guildId)) {
        queues.set(guildId, {
            songs: [],
            current: null,
            player: null,
            connection: null,
            loopMode: false
        });
    }
    return queues.get(guildId);
}

async function playSong(guild, queue) {
    if (queue.songs.length === 0) {
        queue.current = null;
        return;
    }

    const song = queue.songs.shift();
    queue.current = song;

    try {
        const stream = await play.stream(song.url);
        const resource = createAudioResource(stream.stream, {
            inputType: stream.type
        });

        queue.player.play(resource);

        queue.player.on(AudioPlayerStatus.Idle, () => {
            if (queue.loopMode && queue.current) {
                queue.songs.unshift(queue.current);
            }
            playSong(guild, queue);
        });
    } catch (error) {
        console.error('Error playing song:', error);
        playSong(guild, queue);
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Play music from YouTube')
        .addStringOption(option =>
            option.setName('query')
                .setDescription('Song name or YouTube URL')
                .setRequired(true)),

    async execute(interaction, bot) {
        const query = interaction.options.getString('query');
        const member = interaction.member;
        const voiceChannel = member.voice.channel;

        if (!voiceChannel) {
            return interaction.reply({
                embeds: [errorEmbed('Error', 'You need to be in a voice channel to use this command!')],
                ephemeral: true
            });
        }

        await interaction.deferReply();

        try {
            // Search for the song
            let song;
            if (query.includes('youtube.com') || query.includes('youtu.be')) {
                const info = await play.video_info(query);
                song = {
                    title: info.video_details.title,
                    url: info.video_details.url,
                    duration: info.video_details.durationInSec,
                    thumbnail: info.video_details.thumbnails[0].url,
                    requestedBy: interaction.user
                };
            } else {
                const searchResults = await play.search(query, { limit: 1 });
                if (searchResults.length === 0) {
                    return interaction.followUp({
                        embeds: [errorEmbed('Error', 'No results found!')]
                    });
                }
                const video = searchResults[0];
                song = {
                    title: video.title,
                    url: video.url,
                    duration: video.durationInSec,
                    thumbnail: video.thumbnails[0].url,
                    requestedBy: interaction.user
                };
            }

            const queue = getQueue(interaction.guild.id);

            // Join voice channel if not already connected
            if (!queue.connection) {
                queue.connection = joinVoiceChannel({
                    channelId: voiceChannel.id,
                    guildId: interaction.guild.id,
                    adapterCreator: interaction.guild.voiceAdapterCreator,
                });

                queue.player = createAudioPlayer();
                queue.connection.subscribe(queue.player);

                queue.connection.on(VoiceConnectionStatus.Disconnected, async () => {
                    try {
                        await Promise.race([
                            entersState(queue.connection, VoiceConnectionStatus.Signalling, 5_000),
                            entersState(queue.connection, VoiceConnectionStatus.Connecting, 5_000),
                        ]);
                    } catch (error) {
                        queue.connection.destroy();
                        queues.delete(interaction.guild.id);
                    }
                });
            }

            // Add to queue or play immediately
            if (!queue.player || queue.player.state.status === AudioPlayerStatus.Idle) {
                queue.songs.push(song);
                await playSong(interaction.guild, queue);

                const embed = successEmbed('🎵 Now Playing', `[${song.title}](${song.url})`)
                    .setThumbnail(song.thumbnail)
                    .addFields(
                        { name: 'Duration', value: formatDuration(song.duration), inline: true },
                        { name: 'Requested by', value: song.requestedBy.toString(), inline: true }
                    );

                await interaction.followUp({ embeds: [embed] });
            } else {
                queue.songs.push(song);

                const embed = successEmbed('📝 Added to Queue', `[${song.title}](${song.url})`)
                    .addFields({ name: 'Position', value: `#${queue.songs.length}`, inline: true });

                await interaction.followUp({ embeds: [embed] });
            }
        } catch (error) {
            console.error('Play command error:', error);
            await interaction.followUp({
                embeds: [errorEmbed('Error', `An error occurred: ${error.message}`)]
            });
        }
    }
};

function formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}
