const express = require('express');
const app = express();

// Keep Render happy by opening a fake server
app.get('/', (req, res) => res.send('Bot is running!'));
app.listen(3000, () => console.log('Web server running (for Render only)'));

const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');
const Parser = require('rss-parser');
const cron = require('node-cron');
const fs = require('fs'); //Required for file operations
require('dotenv').config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const parser = new Parser();

const NEWS_CHANNEL_ID = '1337091214519832698'; // Replace with your Discord channel ID
const LAST_POSTED_FILE = 'lastPosted.json'

// Example RSS Feeds (Replace with your target sources)
const NEWS_SOURCES = [
    { name: "Reuters US", url: "https://rss.app/feeds/RNwqhTijydUYMOZB.xml" },
    { name: "BBC Top Stories US", url: "http://feeds.bbci.co.uk/news/rss.xml?edition=us" }
];

// Load last posted articles from file (Persistent tracking)
let lastPostedArticle = {};
if (fs.existsSync(LAST_POSTED_FILE)) {
    try {
        const data = fs.readFileSync(LAST_POSTED_FILE, 'utf8');
        lastPostedArticle = JSON.parse(data);
    } catch (error) {
        console.error("Error reading last posted file:", error);
        lastPostedArticle = {}; // Reset if file is corrupt
        fs.writeFileSync(LAST_POSTED_FILE, JSON.stringify(lastPostedArticle, null, 2));
    }
}

// Function to fetch and post news
async function fetchNews() {
    try {
        for (const source of NEWS_SOURCES) {
            const feed = await parser.parseURL(source.url);
            if (feed.items.length > 0) {
                const latestArticle = feed.items[0]; // Get the latest article

                // Check if this article has already been posted
                if (lastPostedArticle[source.name] === latestArticle.title) {
                    console.log(`Skipping duplicate article from ${source.name}`);
                    continue; // Skip if it's the same article
                }

                // Update last posted article and save to file
                lastPostedArticle[source.name] = latestArticle.title;
                fs.writeFileSync(LAST_POSTED_FILE, JSON.stringify(lastPostedArticle));

                // Create the message
                const message = `📰 **${latestArticle.title}**\n${latestArticle.link}\n_${latestArticle.contentSnippet || "No summary available"}_`;

                // Fetch channel and send the message
                const channel = await client.channels.fetch(NEWS_CHANNEL_ID);
                await channel.send(message);
                console.log(`Posted new article from ${source.name}: ${latestArticle.title}`);
            }
        }
    } catch (error) {
        console.error("Error fetching news:", error);
    }
}

// Schedule to run every 5 minutes
cron.schedule('*/5 * * * *', () => {
    console.log("Fetching news...");
    fetchNews();
});

// Login to Discord and fetch news once on startup
client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
    fetchNews(); // Fetch immediately on startup
});

client.login(process.env.TOKEN);