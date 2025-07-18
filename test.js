const DDRaceBot = require('neiky-ddracebot.js');

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

client.on('connection_au_serveur_ddrace', () => {
    setInterval(() => {
        c.game.Emote(1);
    });
});