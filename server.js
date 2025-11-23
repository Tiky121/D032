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

let activeMonitors = {}; 
let activeBigScreen = null;

io.on('connection', (socket) => {
    socket.on('register-monitor', (monitorNum, peerId) => {
        activeMonitors[monitorNum] = peerId;
        console.log(`Monitor ${monitorNum} ID: ${peerId}`);
        io.emit('monitor-available', monitorNum, peerId);
    });

    socket.on('get-monitor-id', (monitorNum) => {
        if (activeMonitors[monitorNum]) {
            // ZMENA: Posielame späť aj číslo monitora!
            socket.emit('monitor-id-response', monitorNum, activeMonitors[monitorNum]);
        }
    });

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