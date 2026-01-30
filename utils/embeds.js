const { EmbedBuilder } = require('discord.js');

function createEmbed(options = {}) {
    const embed = new EmbedBuilder()
        .setColor(options.color || '#5865F2')
        .setTimestamp();

    if (options.title) embed.setTitle(options.title);
    if (options.description) embed.setDescription(options.description);
    if (options.author) embed.setAuthor(options.author);
    if (options.footer) embed.setFooter(options.footer);
    if (options.thumbnail) embed.setThumbnail(options.thumbnail);
    if (options.image) embed.setImage(options.image);
    if (options.fields) {
        options.fields.forEach(field => {
            embed.addFields({ 
                name: field.name, 
                value: field.value, 
                inline: field.inline || false 
            });
        });
    }

    return embed;
}

function successEmbed(title, description) {
    return createEmbed({
        color: '#57F287',
        title: `✅ ${title}`,
        description
    });
}

function errorEmbed(title, description) {
    return createEmbed({
        color: '#ED4245',
        title: `❌ ${title}`,
        description
    });
}

function warningEmbed(title, description) {
    return createEmbed({
        color: '#FEE75C',
        title: `⚠️ ${title}`,
        description
    });
}

function infoEmbed(title, description) {
    return createEmbed({
        color: '#5865F2',
        title: `ℹ️ ${title}`,
        description
    });
}

module.exports = {
    createEmbed,
    successEmbed,
    errorEmbed,
    warningEmbed,
    infoEmbed
};
