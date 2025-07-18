const DDRaceBot = require('neiky-ddracebot.js');
const fs = require('fs');
const path = require('path');
const { franc } = require('franc');
const ai = require("./ai.js");

let activebots = [];
const COOLDOWN_MS = 10000;
let lastMessageTime = 0;

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

async function createBot(fulladdress, botName, chat, answer) {
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

    async function ai_chat(autormsg, text) {
        if (Date.now() - lastMessageTime_bot >= COOLDOWN_MS_bot) {
            const aiResponse = await ai.getAIResponse(autormsg, text);
            sendmessagewithcoldown(`${autormsg}: ${aiResponse}`);
        }
    }

async function chat(msg, botName, answer) {
    const utilisateur = msg.utilisateur?.InformationDuBot;
    const autormsg = utilisateur?.name || false;
    const text = msg.message.trim();

    // if (!autormsg) return;
    if (autormsg) {
        console.log('msg "' + autormsg + '" : ' + text);
    } else {
        console.log('msg *** ' + text);
        return;
    }
    if (autormsg === botName) return;

    if (answer && msg && typeof msg.message === 'string') {
        sendmessagewithcoldown(`${autormsg}: ${getRandomCuteAnswer(text)}`)
        // ai_chat(autormsg, text);
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
        console.log(`Bot ${botName} client.on(disconnected) from server`);
    });

    client.on('message_au_serveur', (msg) => {
        if (chat) chat(msg, botName, answer);
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

async function Connectbot(IPport, botName, chat, answer) {
    try {
        await createBot(IPport, botName, chat, answer);
    } catch (error) {
        console.error("Initial bot creation failed:", error);
    }

    setTimeout(() => {
        if (!isBotConnected(botName)) {
            const intervalId = setInterval(async () => {
                if (!isBotConnected(botName)) {
                    try {
                        await createBot(IPport, botName, chat, answer);
                    } catch (e) {
                        console.error(`Error reconnecting bot ${botName}:`, e);
                    }
                } else {
                    clearInterval(intervalId);
                }
            }, 6000);
        }
    }, 6000);
}

module.exports = {
    Connectbot,
    disconnectAllBots,
    isBotConnected,
    vote,
    createvote,
    getIP,
    getPort
};