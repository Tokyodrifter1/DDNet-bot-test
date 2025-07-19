const bot = require('./bot.js');
const ai = require("./ai.js");
const fs = require('fs');
const path = require('path');

const serverListPath = path.join(__dirname, 'DDList.json');
const serverList = JSON.parse(fs.readFileSync(serverListPath, 'utf8')); // ["26.230.124.233:8303"] local host

const botName = "Urawa";

async function main() {
    ai.clearMemoryai();
    for (const server of serverList) {
        if (server) {
            bot.createBot(server, botName, true, { answer: { answer: true, ai: false }, setAi: true, reconnect: true,
        identity: {
            name: botName,
            clan: "",
            skin: "",
            use_custom_color: 1,
            color_body: 16711680,
            color_feet: 16711680,
            country: -1
        }
    });
        } else {
            console.error(`Invalid server format: ${server}`);
       }
    }
}

async function handleExit() {
    await bot.disconnectAllBots();
    process.exit(0);
}

process.on('SIGINT', () => {
    handleExit();
});
    

main();