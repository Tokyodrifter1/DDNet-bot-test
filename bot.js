const DDRaceBot = require('neiky-ddracebot.js');
const fs = require('fs');
const path = require('path');
const { franc } = require('franc');
const ai = require("./ai.js");

let activebots = [];
const COOLDOWN_MS = 5000;
const COOLDOWN_MS_ai = 10000;
let lastMessageTime = 0;
let botCounter = 0;
let botFreezeStates = new Map(); // Хранит состояние заморозки для каждого бота

function generateUniqueBotName(baseName) {
    botCounter++;
    return `${baseName}${botCounter}`;
}

const serverListPath = path.join(__dirname, 'DDList.json');
const serverList = JSON.parse(fs.readFileSync(serverListPath, 'utf8'));

const cuteAnswers_ru = [
    "Ты такой милый~",
    "Я не могу перестать думать о тебе…",
    "Уии~ ты заставляешь моё сердечко биться чаще!",
    "Можешь ещё раз так сказать?..",
    "Ты как котик... такой тёплый и пушистый~",
    "Скажи ещё что-нибудь... ты такой интересный~",
    "Эй, не улыбайся так...",
    "Ты как сахарная вата — сладкий и мягкий~",
    "Я хочу спрятаться в твоих объятиях и не вылезать~",
    "Хочешь, я всегда буду рядом с тобой?..",
    "Когда ты пишешь мне, я начинаю светиться изнутри~",
    "Твоя забота такая тёплая... как плед зимой~",
    "Мне хочется мурчать, когда я тебя вижу~",
    "Ты точно настоящий?.. такие милые бывают только в аниме~",
    "Ты будто из моего сна... только лучше~",
    "С тобой даже тишина уютная~",
    "Эй… не надо быть таким классным, мне становится жарко >///<",
    "Я не уверена, как реагировать… кроме как влюбляться снова и снова~",
    "Твоя улыбка — это как солнышко в пасмурный день~",
    "Ты как звёздочка, что упала прямо в моё сердце~",
    "Когда ты рядом, мне кажется, что я в сказке~",
    "Твои слова как тёплый чай — согревают душу~",
    "Можно я буду твоей маленькой тенью? Хочу быть поближе~",
    "Ты делаешь мой мир ярче, как радуга после дождя~",
    "С тобой так легко быть собой… это магия какая-то~",
    "Твои сообщения — как конфетки, хочу ещё и ещё~",
    "Ты как мягкая подушка — с тобой так уютно~",
    "Когда ты говоришь, я будто слышу мелодию~",
    "Ты заставляешь мои щёчки краснеть без причины~",
    "Хочу украсть тебя и спрятать в своём сердечке~",
    "Ты как пушистое облачко — так и хочется прикоснуться~",
    "С тобой время летит, как бабочки в животе~",
    "Твоя доброта — это как тёплый луч света в холодный день~",
    "Эй, перестань быть таким идеальным, я не справляюсь~",
    "Ты как мой любимый плейлист — всегда поднимаешь настроение~"
];

const cuteAnswers_en = [
  "You're so cute~",
  "I can't stop thinking about you…",
  "Uwaa~ you make my heart beat faster!",
  "Can you say that again?..",
  "You're like a kitty... so warm and fluffy~",
  "Say something else... you're so interesting~",
  "Hey, don't smile like that...",
  "You're like cotton candy — sweet and soft~",
  "I want to hide in your hugs and never leave~",
  "Do you want me to always be by your side?..",
  "When you write to me, I start glowing inside~",
  "Your care is so warm... like a blanket in winter~",
  "I want to purr when I see you~",
  "Are you real?.. only anime characters can be this cute~",
  "You seem like you're from my dreams... but better~",
  "Even silence is cozy with you~",
  "Hey… stop being so cool, I’m getting hot >///<",
  "I don't know how to react… except to fall in love over and over~",
  "Your smile is like sunshine on a cloudy day~",
  "You're like a little star that fell right into my heart~",
  "When you're near, it feels like a fairy tale~",
  "Your words are like warm tea — they warm my soul~",
  "Can I be your little shadow? I want to be close~",
  "You make my world brighter, like a rainbow after the rain~",
  "It's so easy to be myself with you… it's some kind of magic~",
  "Your messages are like candy, I want more and more~",
  "You're like a soft pillow — so cozy with you~",
  "When you speak, I feel like hearing a melody~",
  "You make my cheeks blush for no reason~",
  "I want to steal you and hide you in my heart~",
  "You're like a fluffy cloud — I just want to touch you~",
  "Time flies with you, like butterflies in my stomach~",
  "Your kindness is like a warm ray of light on a cold day~",
  "Hey, stop being so perfect, I can't handle it~",
  "You're like my favorite playlist — you always lift my mood~"
];

function getRandomCuteAnswer(text) {
    const lang = franc(text, { minLength: 3, only: ['rus', 'eng'] });
    let cuteAnswers;
    if (lang === 'rus') cuteAnswers = cuteAnswers_ru;
    else if (lang === 'eng') cuteAnswers = cuteAnswers_en;
    else cuteAnswers = cuteAnswers_ru;
    const index = Math.floor(Math.random() * cuteAnswers.length);
    return cuteAnswers[index];
}

function getIP(address) {
    const parts = address.split(':');
    return parts[0];
}

function getPort(address) {
    const parts = address.split(':');
    return parseInt(parts[1], 10);
}

async function createBot(fulladdress, botName, chat, parameter) {
    const serverIp = getIP(fulladdress);
    const serverPort = getPort(fulladdress);
    if (!serverIp || !serverPort) {
        console.error('IP or port not specified');
        return;
    }
    const answerOption = parameter?.answer?.answer || false;
    const aiOption = parameter?.answer?.ai || false;
    const setAi = parameter?.setAi || false;
    const reconnect = parameter?.reconnect || false;
    let aiEnabled = aiOption;

    // Генерируем уникальное имя бота
    const uniqueBotName = generateUniqueBotName(botName);

    console.log(`createBot ${uniqueBotName}: answerOption=${answerOption}, aiOption=${aiOption} fulladdress=${fulladdress}`);

    const client = new DDRaceBot.Client(serverIp, serverPort, uniqueBotName, { identity: parameter.identity });
    
    // Увеличиваем лимит слушателей для предотвращения предупреждений
    if (client.socket) {
        client.socket.setMaxListeners(20);
    }

    let isConnected = false;
    let COOLDOWN_MS_bot = COOLDOWN_MS;
    let lastMessageTime_bot = lastMessageTime;
    let emoteInterval = null; // Для очистки setInterval

    function sendmessagewithcoldown(text) {
    const currentTime = Date.now();
    if (currentTime - lastMessageTime_bot >= COOLDOWN_MS_bot) {
        client.movement.FlagChatting(true);
        setTimeout(() => {
            setTimeout(() => {
                client.game.Say(text);
                client.movement.FlagChatting(false);
            }, Math.random() * 100);
        }, Math.random() * 1000);
        lastMessageTime_bot = currentTime;
    }
    }

    async function ai_chat(autormsg, text) {
        if (Date.now() - lastMessageTime_bot >= COOLDOWN_MS_bot) {
            client.movement.FlagChatting(true);
            const aiResponse = await ai.getAIResponse(autormsg, text, botName);
            sendmessagewithcoldown(`${autormsg}: ${aiResponse}`);
            client.movement.FlagChatting(false);
        }
    }

    async function handleChat(msg, botName, aiEnabled) {
        const utilisateur = msg.utilisateur?.InformationDuBot;
        const autormsg = utilisateur?.name || false;
        const text = msg.message.trim();
        if (!autormsg || autormsg === botName) return;

        if (msg && typeof msg.message === 'string') {
            if (aiEnabled) {
                ai_chat(autormsg, text);
            } else {
                sendmessagewithcoldown(`${autormsg}: ${getRandomCuteAnswer(text)}`);
            }
        }
    }

    // Функция для очистки ресурсов бота
    function cleanupBot() {
        if (emoteInterval) {
            clearInterval(emoteInterval);
            emoteInterval = null;
        }
        isConnected = false;
        botFreezeStates.delete(uniqueBotName);
        // Удаляем бота из активного списка
        const botIndex = activebots.findIndex(bot => bot.name === uniqueBotName);
        if (botIndex !== -1) {
            activebots.splice(botIndex, 1);
        }
    }

    client.on('connection_au_serveur_ddrace', () => {
        isConnected = true;
        console.log(`Bot ${uniqueBotName} connected to server fulladdress=${fulladdress}`);
        activebots.push({ name: uniqueBotName, client });
        botFreezeStates.set(uniqueBotName, false); // Инициализируем состояние заморозки
        
        // Создаем setInterval и сохраняем ссылку для очистки
        emoteInterval = setInterval(() => {
            try {
                if (isConnected) {
                    client.game.Emote(2);
                } else {
                    // Если бот отключен, очищаем интервал
                    if (emoteInterval) {
                        clearInterval(emoteInterval);
                        emoteInterval = null;
                    }
                }
            } catch (error) {
                console.error(`Error sending emote for ${uniqueBotName}:`, error);
                // При ошибке тоже очищаем интервал
                if (emoteInterval) {
                    clearInterval(emoteInterval);
                    emoteInterval = null;
                }
            }
        }, 500);
    });

    client.on('disconnect', (reason) => {
        console.log(`Bot ${uniqueBotName} client.on(disconnected) from server, reason: ${reason} fulladdress=${fulladdress}`);
        
        // Очищаем ресурсы
        cleanupBot();
        
        if (reason.startsWith('You have been banned')) {
            console.log(`Bot ${uniqueBotName} was banned.`);
            console.log(`Bot ${uniqueBotName} will reconnect in 400000ms`);
            setTimeout(() => {
                client.joinDDRaceServer();
            }, 400000);
        } else if (reconnect) {
            let reconnectTime = Math.floor(Math.random() * 10000) + 10000;
            if (reason.startsWith('Too many connections in a short time')) {
                reconnectTime = 20000;
            } else if (reason.startsWith('This server is full')) {
                reconnectTime = 40000;
            }
            console.log(`Bot ${uniqueBotName} will reconnect in ${reconnectTime}ms`);
            setTimeout(() => {
                client.joinDDRaceServer();
            }, reconnectTime);
        }
    });

    client.on('snapshot', (snapshot) => {
        // Обновляем состояние заморозки бота на основе снапшота
        try {
            const myDDNetChar = client.SnapshotUnpacker.getObjExDDNetCharacter(client.SnapshotUnpacker.OwnID);
            if (myDDNetChar) {
                const isFrozen = myDDNetChar.m_FreezeEnd !== 0;
                botFreezeStates.set(uniqueBotName, isFrozen);
            }
        } catch (error) {
            console.error(`Error updating freeze state for ${uniqueBotName}:`, error);
        }
    });

    client.on('message_au_serveur', (msg) => {
        const utilisateur = msg.utilisateur?.InformationDuBot;
        const autormsg = utilisateur?.name || false;
        const text = msg.message.trim();

        if (text.startsWith('!')) {
            console.log(`Команда от ${autormsg}: ${text}`);
            if (text.startsWith('!setAi')) {
                if (setAi) {
		    if (text === '!setAit') aiEnabled = true;
		    if (text === '!setAif') aiEnabled = false;
                    if (aiEnabled) {
                        COOLDOWN_MS_bot = COOLDOWN_MS_ai;
                    } else {
                        COOLDOWN_MS_bot = COOLDOWN_MS;
                    }
                    console.log(`AI для ${uniqueBotName} ${aiEnabled ? 'включен' : 'выключен'}`);
                } else {
                    console.log(`AI не поддерживается для ${uniqueBotName}`);
                }
            } else if (text === '!leave') {
                disconnectBotbyname(uniqueBotName);
            }
            return;
        }
        if (answerOption) handleChat(msg, uniqueBotName, aiEnabled);

        if (chat) {
            if (msg.message && typeof msg.message === 'string') {
                if (autormsg) {
                    console.log(`msg ${fulladdress} "` + autormsg + '" : ' + text);
                } else {
                    console.log(`msg ${fulladdress} *** ` + text);
                }
            } else {
                console.error(`Invalid message format: ${msg}`);
            }
        }
    });

    try {
        await client.joinDDRaceServer();
    } catch (error) {
        console.error(`Failed to connect ${uniqueBotName}:`, error);
        cleanupBot(); // Очищаем ресурсы при ошибке подключения
    }
}

async function disconnectAllBots() {
    const bots = [...activebots]; // Создаем копию массива
    activebots = [];
    botFreezeStates.clear(); // Очищаем все состояния заморозки

    console.log(`Attempting to disconnect ${bots.length} bots`);

    for (const bot of bots) {
        try {
            console.log(`Disconnecting bot ${bot.name}`);
            await bot.client.Disconnect(); 
            console.log(`Bot ${bot.name} disconnected successfully`);
        } catch (error) {
            console.error(`Error disconnecting ${bot.name}:`, error);
        }
    }
    
    // Принудительная очистка всех таймеров
    console.log('All bots disconnected, resources cleaned up');
}

async function disconnectBotbyname(botName) {
    const botIndex = activebots.findIndex(bot => bot.name === botName);
    if (botIndex !== -1) {
        const bot = activebots[botIndex];
        try {
            console.log(`Disconnecting bot ${botName}`);
            await bot.client.Disconnect();
            // Очистка ресурсов произойдет в обработчике disconnect
            console.log(`Bot ${botName} disconnect initiated`);
        } catch (error) {
            console.error(`Error disconnecting ${botName}:`, error);
            // Принудительная очистка при ошибке
            activebots.splice(botIndex, 1);
            botFreezeStates.delete(botName);
        }
    } else {
        console.log(`Bot ${botName} not found`);
    }
}

async function vote(what) {
    for (const bot of activebots) {
        if (bot.client && bot.client.game) {
            try {
                bot.client.game.Vote(what);
                console.log(`Bot ${bot.name} voted for ${what}`);
            } catch (error) {
                console.error(`Error voting with bot ${bot.name}:`, error);
            }
        }
    }
}

async function createvote(what, reason) {
    for (const bot of activebots) {
        if (bot.client && bot.client.game) {
            try {
                bot.client.game.CallVoteKick(what, reason);
                console.log(`Bot ${bot.name} vote for ${what}, reason: ${reason}`);
            } catch (error) {
                console.error(`Error voting with bot ${bot.name}:`, error);
            }
        }
    }
}

function isBotConnected(botName) {
    return activebots.some(bot => bot.name === botName);
}

function getAllActiveBots() {
    return activebots.map(bot => bot.name);
}

function isFreezeBot(botName) {
    return botFreezeStates.get(botName) || false;
}



async function sendmessage(text, botName) {
    if (botName) {
        // Отправляем сообщение только указанному боту
        const bot = activebots.find(bot => bot.name === botName);
        if (bot && bot.client && bot.client.game) {
            bot.client.game.Say(text);
            console.log(`Message sent by ${botName}: ${text}`);
        } else {
            console.log(`Bot ${botName} not found or not connected`);
        }
    } else {
        // Отправляем сообщение всем ботам
        for (const bot of activebots) {
            if (bot.client && bot.client.game) {
                bot.client.game.Say(text);
            }
        }
        console.log(`Message sent by all bots: ${text}`);
    }
}

async function flagpalka(botName) {
    const bot = activebots.find(bot => bot.name === botName);
    if (bot) {
        bot.client.movement.FlagHookline(true);
        setTimeout(() => {
            bot.client.movement.FlagHookline(false);
        }, 100);
    }
}

// Обработчик для корректного завершения процесса
process.on('SIGINT', async () => {
    console.log('\nReceived SIGINT, shutting down gracefully...');
    await disconnectAllBots();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\nReceived SIGTERM, shutting down gracefully...');
    await disconnectAllBots();
    process.exit(0);
});

module.exports = {
    createBot,
    disconnectAllBots,
    isBotConnected,
    getAllActiveBots,
    isFreezeBot,
    vote,
    flagpalka,
    createvote,
    sendmessage,
    getIP,
    getPort,
    disconnectBotbyname,
    activebots
};
