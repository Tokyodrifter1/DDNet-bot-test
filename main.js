const bot = require('./bot.js');
const ai = require("./ai.js");
const fs = require('fs');
const path = require('path');

const serverListPath = path.join(__dirname, 'DDList.json');
const serverList = JSON.parse(fs.readFileSync(serverListPath, 'utf8')); // ["26.230.124.233:8303"] local host

const botName = "Urawa beta";

async function main() {
    ai.clearMemoryai();
    for (const server of serverList) {
        if (server) {
            bot.createBot(server, botName, true, { answer: { answer: true, ai: false }, setAi: true, reconnect: true,
        identity: {
            name: botName,
            clan: ".",
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
    setTimeout( () => {
         process.exit(1)
    }, 1000)
}

process.on('SIGINT', () => {
    handleExit();
});

main();

let x = 100;
let direction = -1; // -1 для движения влево, 1 для движения вправо
setInterval(() => {
    // Плавное движение x от 100 до -100 и обратно
    x += direction * 10; // Скорость движения
    
    // Смена направления при достижении границ
    if (x <= -100) {
        direction = 1; // Двигаемся вправо
    } else if (x >= 100) {
        direction = -1; // Двигаемся влево
    }
    
    if (bot.isBotConnected(botName + "1")) {
        bot.activebots.forEach(bot2 => {
            if (bot2.name === botName + "1" && bot.isFreezeBot(botName + "1")) {
                bot2.client.movement.FlagHookline(true);
                setTimeout(() => {
                    bot2.client.movement.FlagHookline(false);
                }, Math.random() * 50);
                bot2.client.movement.SetAim(x, -100 );
            } else {
                bot2.client.movement.SetAim(0, 0);
            }
        });
    }
}, Math.random() * 100);
