const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, { cors: { origin: "*" } });
const { ExpressPeerServer } = require('peer');

const peerServer = ExpressPeerServer(server, { debug: true, path: '/' });
app.use('/peerjs', peerServer);
app.use(express.static('public'));

// Úložisko stavu
let activeMonitors = {}; 
let activeBigScreen = null;
let activeRemotes = {}; // { socketId: peerId }

io.on('connection', (socket) => {
    
    // --- MONITORY ---
    socket.on('register-monitor', (monitorNum, peerId) => {
        activeMonitors[monitorNum] = peerId;
        io.emit('monitor-available', monitorNum, peerId);
    });

    socket.on('get-monitor-id', (monitorNum) => {
        if (activeMonitors[monitorNum]) {
            socket.emit('monitor-id-response', monitorNum, activeMonitors[monitorNum]);
        }
    });

    // --- REMOTE UŽÍVATELIA (NOVÉ) ---
    socket.on('register-remote-user', (peerId) => {
        // Uložíme si nového účastníka
        activeRemotes[socket.id] = peerId;
        
        // 1. Pošleme novému účastníkovi zoznam tých, čo už sú tam
        const existingUsers = Object.values(activeRemotes).filter(id => id !== peerId);
        socket.emit('existing-remotes', existingUsers);

        // 2. Povieme ostatným: "Prišiel nový človek!"
        socket.broadcast.emit('new-remote-joined', peerId);
    });

    socket.on('disconnect', () => {
        // Ak odišiel remote user, vymažeme ho a povieme ostatným
        if (activeRemotes[socket.id]) {
            const peerId = activeRemotes[socket.id];
            delete activeRemotes[socket.id];
            io.emit('remote-disconnected', peerId);
        }
    });

    // --- BIG SCREEN & SHARE ---
    socket.on('register-bigscreen', (peerId) => {
        activeBigScreen = peerId;
        io.emit('bigscreen-available', peerId);
    });
    socket.on('get-bigscreen-id', () => {
        if(activeBigScreen) socket.emit('bigscreen-id-response', activeBigScreen);
    });
    socket.on('start-share', () => io.emit('is-sharing', true));
    socket.on('stop-share', () => io.emit('stopped-sharing'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));