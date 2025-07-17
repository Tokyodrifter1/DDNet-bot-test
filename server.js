const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

let clients = [];

wss.on('connection', function connection(ws) {
  clients.push(ws);
  console.log('клиент подключился');

  ws.on('message', function incoming(message) {
    console.log('Сообщение от клиента:', message.toString());
  });

  ws.on('close', function () {
    console.log('Клиент отключился');
    clients = clients.filter(c => c !== ws);
  });
});


function sendCommandToAll(command) {
  clients.forEach(ws => {
    ws.send(command);
  });
}


setInterval(() => {
  sendCommandToAll('');
}, 10000);
