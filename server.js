const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});
const { ExpressPeerServer } = require('peer');

const peerServer = ExpressPeerServer(server, {
    debug: true,
    path: '/'
});

app.use('/peerjs', peerServer);
app.use(express.static('public'));

// Premenné pre stav
let screenSharerId = null;

io.on('connection', (socket) => {
    socket.on('join-room', (userId, role) => {
        socket.join('meeting-room');
        socket.to('meeting-room').emit('user-connected', userId, role);

        if (screenSharerId) {
            socket.emit('is-sharing', screenSharerId);
        }
    });

    socket.on('start-share', (id) => {
        screenSharerId = id;
        io.to('meeting-room').emit('is-sharing', id);
    });

    socket.on('stop-share', () => {
        screenSharerId = null;
        io.to('meeting-room').emit('stopped-sharing');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server beží na porte ${PORT}`);
});