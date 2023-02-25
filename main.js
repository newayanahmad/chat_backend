const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

// Keep track of all connected users
const connectedUsers = {};

io.on('connection', (socket) => {
    console.log(socket.handshake.auth);
    console.log('a user connected');

    // Get the email and name from the socket's handshake data
    const { email, name } = socket.handshake.auth;

    // Check if the email is already connected
    if (connectedUsers[email]) {
        // Disconnect the socket if the email is already connected
        socket.disconnect(true);
        return;
    }

    // Store the socket id and user data for this socket
    connectedUsers[email] = { id: socket.id, email, name };

    // Emit the updated list of connected users to all sockets
    io.emit('user-list', Object.values(connectedUsers));

    // When a user sends a message
    socket.on("message", (data) => {
        console.table(data);
        if (connectedUsers[data.toUser] != undefined) {

            console.table(connectedUsers[data.toUser].id);
            // io.emit("event", { data: data.msg })
            io.to(connectedUsers[data['toUser']].id).emit("event", { data: data.msg, email: data.toUser })
        }
        // io.emit("event", { data: data.msg })
        // console.log(userSockets[data.toUser]);
        // socket.broadcast.emit("event", { data: data })
        // socket.emit("event", { data: data.msg })
    })

    // When a user disconnects
    socket.on('disconnect', () => {
        console.log('user disconnected');
        console.table(connectedUsers);

        // Find the email of the disconnected user
        const disconnectedUserEmail = Object.keys(connectedUsers).find(
            (email) => connectedUsers[email].id === socket.id
        );

        // Remove the socket from the list of connected users
        delete connectedUsers[disconnectedUserEmail];

        console.table(connectedUsers);
        // Emit the updated list of connected users to all sockets
        io.emit('user-list', Object.values(connectedUsers));
    });
});

http.listen(8080, "0.0.0.0", () => {
    console.log('listening on *:8080');
});
