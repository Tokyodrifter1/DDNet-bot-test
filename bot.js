const DDRaceBot = require('neiky-ddracebot.js');

let activebots = [];
const COOLDOWN_MS = 5000;
let lastMessageTime = 0;

const cuteAnswers = [
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

function getRandomCuteAnswer() {
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

async function createBot(fulladdress, botName, chat) {
    const serverIp = getIP(fulladdress);
    const serverPort = getPort(fulladdress);
    if (!serverIp || !serverPort) {
        console.error('IP or port not specified');
        return;
    }

    const client = new DDRaceBot.Client(serverIp, serverPort, botName, {
        identity: {
            name: botName,
            clan: "Towa Team",
            skin: "Astolfofinho",
            use_custom_color: 1,
            color_body: 16711680,
            color_feet: 16711680,
            country: -1
        }
    });

    let isConnected = false;
    const COOLDOWN_MS_bot = COOLDOWN_MS;
    let lastMessageTime_bot = lastMessageTime;

    function sendmessagewithcoldown(text) {
    const currentTime = Date.now();
    if (currentTime - lastMessageTime_bot >= COOLDOWN_MS_bot) {
        client.game.Say(text);
        lastMessageTime_bot = currentTime;
    }
}

function chat(msg, botName) {
    const utilisateur = msg.utilisateur?.InformationDuBot;
    const autormsg = utilisateur?.name || false;
    const text = msg.message.toLowerCase().trim();

    // if (!autormsg) return;
    if (autormsg) {
        console.log('"' + autormsg + '" : ' + text);
    } else {
        console.log('*** ' + text);
        return;
    }
    if (autormsg === botName) return;
    return

    if (msg && typeof msg.message === 'string') {
        sendmessagewithcoldown(`${autormsg}: ${getRandomCuteAnswer()}`)
    }
}

    client.on('connection_au_serveur_ddrace', () => {
        isConnected = true;
        console.log(`Bot ${botName} connected to server`);
        activebots.push({ name: botName, client });
        setInterval(() => {
            try {
                if (isConnected) {
                    client.game.Emote(2);
                }
            } catch (error) {
                console.error(`Error sending emote for ${botName}:`, error);
            }
        }, 500);
    });

    client.on('disconnect', () => {
        isConnected = false;
        console.log(`client.on('disconnect' = Bot ${botName} disconnected from server`);
    });

    client.on('message_au_serveur', (msg) => {
        if (chat) chat(msg, botName);
    });

    try {
        await client.joinDDRaceServer();
    } catch (error) {
        console.error(`Failed to connect ${botName}:`, error);
        activebots = activebots.filter(bot => bot.name !== botName);
    }
}

async function disconnectAllBots() {
    const bots = activebots;
    activebots = [];

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

async function Connectbot(IPport, botName) {
    try {
        await createBot(IPport, botName);
    } catch (error) {
        console.error("Initial bot creation failed:", error);
    }

    setTimeout(() => {
        if (!isBotConnected(botName)) {
            const intervalId = setInterval(async () => {
                if (!isBotConnected(botName)) {
                    try {
                        await createBot(IPport, botName);
                    } catch (e) {}
                } else {
                    clearInterval(intervalId);
                }
            }, 4000);
        }
    }, 5000);
}

module.exports = {
    Connectbot,
    disconnectAllBots,
    isBotConnected,
    vote,
    createvote
};