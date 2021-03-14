const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

app.use(express.static('build'))

io.on('connection', (socket) => {
    socket.on('join', (roomNumber) => {
        const room = io.of('/').adapter.rooms.get(roomNumber);
        console.log(room);
        const numberOfClientsInRoom = (room && room.size) || 0;
        if (numberOfClientsInRoom > 1) {
            socket.emit('full');
            return;
        }

        console.log(roomNumber, numberOfClientsInRoom);
        socket.join(roomNumber);
        socket.emit('joined', {
            isCaller: numberOfClientsInRoom === 1,
            roomNumber
        });
    });

    socket.on('offer', (data) => {
        console.log('offer');
        io.to(data.roomNumber).emit('offer', data);
    });

    socket.on('answer', (data) => {
        console.log('answer');
        io.to(data.roomNumber).emit('answer', data);
    });

    socket.on('candidate', (data) => {
        console.log('candidate');
        io.to(data.roomNumber).emit('candidate', data);
    });
});


server.listen(process.env.PORT || 3001);