const bot = require('./bot.js');
const WebSocket = require('ws');

// обработка выхода
process.on('SIGINT', () => {
    bot.disconnectAllBots();
    setTimeout(() => {
        process.exit(0);
    }, 1000);
});

// создаём подключение
const ws = new WebSocket('ws://your-server-ip:8080'); // замени на настоящий адрес

// когда подключение успешно
ws.on('open', () => {
    console.log('подключено к серверу');
});

// когда приходит сообщение от сервера
ws.on('message', (data) => {
    const command = data.toString(); // преобразуем буфер в строку
    console.log('команда:', command);

    if (command.startsWith('vote ')) {
        const what = command.split(' ')[1];
        bot.vote(what);
    } else if (command.startsWith('createvote ')) {
        const [what, ...reasonParts] = command.split(' ').slice(1);
        const reason = reasonParts.join(' ');
        bot.createvote(what, reason);
    } else if (command.startsWith('connectbot ')) {
        const [IPport, name] = command.split(' ').slice(1);
        bot.Connectbot(IPport, name, true);
    } else if (command === 'disconnect') {
        bot.disconnectAllBots();
    } else if (command.startsWith('isBotConnected ')) {
        const botName = command.split(' ')[1];
        const isConnected = bot.isBotConnected(botName);
        ws.send(JSON.stringify({
            type: 'botStatus',
            name: botName,
            connected: isConnected
        }));
    }
});

// обработка ошибок
ws.on('error', (err) => {
    console.error('ошибка соединения: ', err);
});
