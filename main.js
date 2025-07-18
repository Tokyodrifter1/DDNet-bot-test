const bot = require('./bot.js');
const fs = require('fs');
const path = require('path');

const serverListPath = path.join(__dirname, 'DDList.json');
const serverList =  ["45.141.57.31:8360"] || JSON.parse(fs.readFileSync(serverListPath, 'utf8'));

async function main() {
    for (const server of serverList) {
        if (server) {
            bot.Connectbot(server, "Rio", true, true);
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