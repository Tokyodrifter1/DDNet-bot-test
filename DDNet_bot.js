const DDRaceBot = require('neiky-ddracebot.js');
const http = require('http');
const url = require('url');
const fs = require('fs');
const readline = require('readline');

const fulladdress = '57.128.201.180:8317';
const [serverAddress, port] = fulladdress.split(':');
if (!serverAddress || !port) {
    console.error('Неверный адрес сервера. Убедитесь, что он в формате "адрес:порт".');
    process.exit(1);
}

const botName = `Towa` || Math.random().toString();

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const client = new DDRaceBot.Client(serverAddress, port, botName, {
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

let lastMessageTime = 0;
const COOLDOWN_MS = 5000;

const keyMap = {
  d: 'right',
  a: 'left',
  w: 'jump',
  s: 'stop',
  f: 'fire',
  n: 'nw',
  h: 'hook',
};


let activemove = [];

let isConnected = false;

const ignoredNames = [
    "0374_bober",
    "Towa.",
    "Towa..",
    "TOWA",
    "(1)Towa",
    "(1)TOWA",
    "tvitch.tv/budya",
    "Towa",
    "Towa Team",
    "dori",
    "0374flop"
];

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

function nadatext(text, autormsg) {
    if (text && autormsg && !ignoredNames.includes(autormsg)) {
        return true;
    } else {
        return false;
    }
}

function sendmessagewithcoldown(text) {
    const currentTime = Date.now();
    if (currentTime - lastMessageTime >= COOLDOWN_MS) {
        client.game.Say(text);
        lastMessageTime = currentTime;
    }
}

function getRandomCuteAnswer() {
    const index = Math.floor(Math.random() * cuteAnswers.length);
    return cuteAnswers[index];
}

function exitbot(text) {
    client.game.Say(text || 'Простите, надо отключиться~');
    setTimeout(() => {
        client.Disconnect();
        setTimeout(() => {
            console.log('Бот отключен.');
            process.exit(0);
        }, 1000);
    }, 1000);
}

function cmdreason(cmd) {
    const textC = cmd.slice(1).toLowerCase().trim();

    if (textC.startsWith(`m`)) {
        if (textC.length > 3) {
            client.game.Say("...");
        } else {
            if      (textC === 'm')    activemove.push('stop');
            else if (textC === 'mr')   activemove.push('right');
            else if (textC === 'ml')   activemove.push('left');
            else if (textC === 'mj')   activemove.push('jump');
            else if (textC === 'mf')   activemove.push('fire');
            else if (textC === 'mnw')  activemove.push('nw');
        }
    } else if (textC.startsWith(`h`)) {
        if (textC.length > 3) client.game.Say("...");
        else {
            if      (textC === 'h')   activemove.push('hook');
        }
    }
}

function movekey(key) {
  if (keyMap[key]) {
    activemove.push(keyMap[key]);
  }
}


function activatemove() {
    if (activemove.includes('stop')) {
        client.movement.Reset();
        activemove.length = 0;
        return;
    }
    while (activemove.length > 0) {
        const move = activemove.shift();
        if      (move === 'right') client.movement.RunRight();
        else if (move === 'left')  client.movement.RunLeft();
        else if (move === 'jump')  client.movement.Jump();
        else if (move === 'fire')  client.movement.Fire();
        else if (move === 'hook')  client.movement.Hook();
        else if (move === 'nw')    client.movement.NextWeapon();
    }
    setTimeout(() => {
            client.movement.Reset();
    }, 100);
}

function Connectedtoserver() {
    setInterval(() => {
        client.game.Emote(2);
    }, 500);
    setInterval(() => {
        activatemove();
    }, 100);
    console.log("Подключился!");
    client.game.Say('Здравствуйте~');
}

client.on('message_au_serveur', (msg) => {
    const utilisateur = msg.utilisateur?.InformationDuBot;
    const autormsg = utilisateur?.name || false;
    const text = msg.message.toLowerCase().trim();

    if (!isConnected) {
        isConnected = true;
        Connectedtoserver();
    }
    if (autormsg) {
        console.log('"' + autormsg + '" : ' + text);
    } else {
        console.log('*** ' + text);
        return;
    }

    if (autormsg === botName) {
        return;
    }
    if (msg && typeof msg.message === 'string') {
        if (text === 'exit' || text === '${botName}: выйди') {
            exitbot('Окей, я отключюсь~');
        } else if (text.startsWith(`.`)) {
            cmdreason(text);
        } else if (nadatext(text, autormsg)) {
            sendmessagewithcoldown(`${autormsg}: ${getRandomCuteAnswer()}`);
        }
    }
});

rl.on('line', (input) => {
    const cmd = input.trim().toLowerCase();
    if (cmd === 'exit') {
        exitbot('Простите, надо отключиться~');
    } else if (cmd === 'say') {
        rl.question('Введите сообщение: ', (message) => {
            client.game.Say(message);
        });
    } else if (cmd === 'bot2') {
        console.log('Рано пока что, бот2 еще не готов.');
    } else if (cmd === 'botcmd') {
        rl.question('Введите команду: ', (command) => {
            cmdreason(command);
        });
    } else if (cmd === 'help') {
        console.log('Доступные команды:');
        console.log('  exit - отключить бота');
        console.log('  say - отправить сообщение на сервер');
        console.log('  botcmd - выполнить команду бота');
        console.log('  help - показать это сообщение');

    } else if (cmd) {
        movekey(cmd);
        console.log(`Активное движение: ${activemove.join(', ')}.`);
    } else {
        console.log('Ты обосрался, я не знаю такой команды.');
    }
});

process.on('SIGINT', () => {
    exitbot('Простите, надо отключиться~');
});

const server = http.createServer((req, res) => {
    const parsed = url.parse(req.url, true);
    if (parsed.pathname === '/') {
        fs.readFile('./index.html', (err, data) => {
            if (err) {
                res.writeHead(500); return res.end('Ошибка загрузки страницы');
            }
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(data);
        });
    } else if (parsed.pathname === '/input') {
        const key = parsed.query.key;
        if (key) movekey(key);
        res.writeHead(200);
        res.end('OK');
    } else {
        res.writeHead(404);
        res.end('Not found');
    }
});

server.listen(8080, () => {
    console.log('🎮 Панель управления доступна на http://localhost:8080');
});


client.joinDDRaceServer();