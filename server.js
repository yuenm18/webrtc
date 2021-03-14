const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

app.use(express.static('build'))

io.on('connection', (socket) => {
  socket.on('join', (data) => {
    const room = io.of('/').adapter.rooms.get(data.roomNumber);
    const numberOfClientsInRoom = (room && room.size) || 0;
    console.log(`${data.clientId} join room request for room #${data.roomNumber}. Current number of clients ${numberOfClientsInRoom}`);
    if (numberOfClientsInRoom > 1) {
      socket.emit('full');
      return;
    }

    socket.join(data.roomNumber);
    socket.emit('joined', {
      isCaller: numberOfClientsInRoom === 1,
      roomNumber: data.roomNumber
    });
  });

  socket.on('offer', (data) => {
    console.log(`${data.clientId} offer`);
    io.to(data.roomNumber).emit('offer', data);
  });

  socket.on('answer', (data) => {
    console.log(`${data.clientId} answer`);
    io.to(data.roomNumber).emit('answer', data);
  });

  socket.on('candidate', (data) => {
    console.log(`${data.clientId} candidate`);
    io.to(data.roomNumber).emit('candidate', data);
  });
});

server.listen(process.env.PORT || 3001);