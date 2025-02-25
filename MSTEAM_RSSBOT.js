const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');
const Parser = require('rss-parser');
const cron = require('node-cron');
require('dotenv').config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const parser = new Parser();

const NEWS_CHANNEL_ID = '301078163654574081'; // Replace with your Discord channel ID

// Example RSS Feeds (Replace with your target sources)
const NEWS_SOURCES = [
    { name: "Reuters US", url: "https://rss.app/feeds/RNwqhTijydUYMOZB.xml" }
];

// Function to fetch news articles
async function fetchNews() {
    try {
        for (const source of NEWS_SOURCES) {
            const feed = await parser.parseURL(source.url);
            if (feed.items.length > 0) {
                const latestArticle = feed.items[0]; // Get the latest article
                const message = `📰 **${latestArticle.title}**\n${latestArticle.link}\n_${latestArticle.contentSnippet}_`;

                const channel = await client.channels.fetch(NEWS_CHANNEL_ID);
                await channel.send(message);
            }
        }
    } catch (error) {
        console.error("Error fetching news:", error);
    }
}

// Schedule to run every 30 minutes
cron.schedule('*/30 * * * *', () => {
    console.log("Fetching news...");
    fetchNews();
});

// Login to Discord
client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
    fetchNews(); // Fetch immediately on startup
});

client.login(process.env.TOKEN);
