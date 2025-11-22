const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
    cors: { origin: "*" }
});
const { ExpressPeerServer } = require('peer');

// PeerJS server beží lokálne len ako záloha/proxy, hlavnú prácu robí Cloud
const peerServer = ExpressPeerServer(server, { debug: true, path: '/' });

app.use('/peerjs', peerServer);
app.use(express.static('public'));

// "Telefónny zoznam" - Ktorý monitor má aké PeerID
let activeMonitors = {}; 
let activeBigScreen = null;

io.on('connection', (socket) => {
    
    // 1. Monitor sa hlási: "Som Monitor X a mám toto PeerID"
    socket.on('register-monitor', (monitorNum, peerId) => {
        activeMonitors[monitorNum] = peerId;
        console.log(`Monitor ${monitorNum} zaregistrovaný s ID: ${peerId}`);
        // Povieme všetkým čakajúcim, že Monitor je online
        io.emit('monitor-available', monitorNum, peerId);
    });

    // 2. Remote sa pýta: "Aké ID má Monitor X?"
    socket.on('get-monitor-id', (monitorNum) => {
        if (activeMonitors[monitorNum]) {
            socket.emit('monitor-id-response', activeMonitors[monitorNum]);
        }
    });

    // 3. BigScreen sa hlási
    socket.on('register-bigscreen', (peerId) => {
        activeBigScreen = peerId;
        io.emit('bigscreen-available', peerId);
    });

    // 4. Zdieľanie (pýtame sa na ID veľkej obrazovky)
    socket.on('get-bigscreen-id', () => {
        if(activeBigScreen) socket.emit('bigscreen-id-response', activeBigScreen);
    });

    // Clean up pri odpojení
    socket.on('disconnect', () => {
        // Tu by sme mohli čistiť zoznam, ale pre jednoduchosť necháme prepísať
    });

    // Eventy pre UI zdieľania
    socket.on('start-share', () => io.emit('is-sharing', true));
    socket.on('stop-share', () => io.emit('stopped-sharing'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server beží na porte ${PORT}`);
});