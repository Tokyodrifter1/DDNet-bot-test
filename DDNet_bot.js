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
let isConected = false;
let lastMessageTime = 0;
const COOLDOWN_MS = 5000;

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


let activeMoves = new Set();
let activemove = [];
let needfire = false;
let xAim = 0;
let yAim = 0;

const keyMap = {
  d: 'right',
  a: 'left',
  w: 'jump',
  s: 'stop',
  f: 'fire',
  n: 'nw',
  h: 'hook',
  r: 'reset',
  k: 'kill',
    'x+': 'xaim+',
    'y+': 'yaim+',
    'x-': 'xaim-',
    'y-': 'yaim-',
};


function movekey(key) {
    const action = keyMap[key];
    if (!action) return;
    if (action === 'reset') {
        activeMoves.clear();
        client.movement.Reset();
    } else if (action === 'kill') {
        client.game.Kill();
    } else {
        if (activeMoves.has(action)) {
            activeMoves.delete(action);
        } else {
            activeMoves.add(action);
        }
    }
}

function activatemove() {
    client.movement.Reset();
    activeMoves.forEach(move => {
        if      (move === 'right') {client.movement.RunRight(); activeMoves.delete('left');}
        else if (move === 'left' ) {client.movement.RunLeft(); activeMoves.delete('right');}
        else if (move === 'jump' ) {client.movement.Jump(); setTimeout(() => {client.movement.Jump(false)}, 50); activeMoves.delete('jump');}
        else if (move === 'fire' ) if (!needfire) {needfire = true;} else {needfire = false;}
        else if (move === 'hook' ) client.movement.Hook();
        else if (move === 'nw'   ) client.movement.NextWeapon();
        else if (move === 'kill' ) { client.game.Kill(); activeMoves.delete('kill'); }
        else if (move === 'xaim+') { xAim += 15; activeMoves.delete('xaim+'); }
        else if (move === 'yaim+') { yAim += 15; activeMoves.delete('yaim+'); }
        else if (move === 'xaim-') { xAim -= 15; activeMoves.delete('xaim-'); }
        else if (move === 'yaim-') { yAim -= 15; activeMoves.delete('yaim-'); }
    });
}

function inputreason(input) {
    const cmd = input.trim().toLowerCase();
    if (cmd === 'exit') {
        exitbot('Простите, надо отключиться~');
    } else if (cmd.startsWith('say ')) {
        const message = cmd.slice(4).trim();
        if (message) {
            client.game.Say(message);
        }
    } else if (cmd == 'help') {
        console.log('Доступные команды:');
        console.log('  exit - отключить бота');
        console.log('  say - отправить сообщение на сервер');
        console.log('  help - показать это сообщение');
        console.log('  kill - убить бота');
    } else if (cmd == 'kill') {
        client.game.Kill();
    } else if (cmd.startsWith('/')) {
        client.game.Say(cmd);
    } else if (cmd) {
        movekey(cmd);
        console.log(`Активное движение: ${activemove.join(', ')}.`);
    } else {
        console.log('Ты обосрался, я не знаю такой команды.');
    }
}

client.on('connection_au_serveur_ddrace', () => {
    isConected = true;
    console.log(`Подключился к серверу ${serverAddress}:${port} как ${botName}`);
    setInterval(() => {
        client.game.Emote(2);
    }, 500);
    setInterval(() => {
        xAim = Math.max(-100, Math.min(100, xAim));
        yAim = Math.max(-100, Math.min(100, yAim));
        activatemove();
        client.movement.SetAim(xAim, yAim);
        if (needfire) {client.movement.Fire();};
    }, 100);
    client.game.Say('Здравствуйте~');
});

client.on('disconnect', () => {isConected = false; console.log('Отключился от сервера.');});

client.on('message_au_serveur', (msg) => {
    const utilisateur = msg.utilisateur?.InformationDuBot;
    const autormsg = utilisateur?.name || false;
    const text = msg.message.toLowerCase().trim();

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
        if (autormsg === "0374_bober" || autormsg === 'd0030303' && text === 'exit' || text === '${botName}: выйди') {
            // exitbot('Окей, я отключусь~');
        } else if (nadatext(text, autormsg)) {
            sendmessagewithcoldown(`${autormsg}: ${getRandomCuteAnswer()}`);
        }
    }
});

let lastCoords = { x: 0, y: 0 };

// Парсим координаты из snapshot
client.on('snapshot', (data) => {
    // Ищем объект с type_id: 9 (character)
    const charObj = data.find(obj => obj.type_id === 9 && obj.parsed && obj.parsed.character_core);
    if (charObj) {
        // Обычно character_core содержит x, y (или pos_x, pos_y)
        // Но в твоём случае координаты, скорее всего, в charObj.data[0] и charObj.data[1]
        lastCoords.x = charObj.data[0];
        lastCoords.y = charObj.data[1];
    }
    // ...оставь console.log если нужно...
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
    } else if (parsed.pathname === '/coords') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(lastCoords));
    } else if (parsed.pathname === '/input') {
        const key = parsed.query.key;
        if (key && keyMap[key]) {
            movekey(key);
        } else if (key) {
            inputreason(key);
        }
        res.writeHead(200);
        res.end('OK');
    } else if (parsed.pathname === '/setaim') {
        const x = parseInt(parsed.query.x, 10);
        const y = parseInt(parsed.query.y, 10);
        if (!isNaN(x) && !isNaN(y)) {
            xAim = x;
            yAim = y;
        }
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

process.on('SIGINT', () => {
    exitbot('Простите, надо отключиться~');
});