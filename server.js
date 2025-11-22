const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const { ExpressPeerServer } = require('peer');

const peerServer = ExpressPeerServer(server, {
  debug: true,
  path: '/'
});

app.use('/peerjs', peerServer);
app.use(express.static('public'));

// Stav zdieľania obrazovky
let screenSharerId = null;

io.on('connection', (socket) => {
    // Keď sa niekto pripojí do miestnosti
    socket.on('join-room', (userId, role) => {
        socket.join('meeting-room');
        socket.to('meeting-room').emit('user-connected', userId, role);

        // Ak niekto už zdieľa, povieme to novému
        if (screenSharerId) {
            socket.emit('screen-share-active', screenSharerId);
        }
    });

    // Niekto začal zdieľať
    socket.on('start-share', (id) => {
        screenSharerId = id;
        io.to('meeting-room').emit('is-sharing', id);
    });

    // Niekto prestal zdieľať
    socket.on('stop-share', () => {
        screenSharerId = null;
        io.to('meeting-room').emit('stopped-sharing');
    });

    socket.on('disconnect', () => {
        // riešenie odpojenia
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server beží na porte ${PORT}`);
});