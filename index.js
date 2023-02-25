const express = require('express');
const app = express();
const cors = require("cors")
const http = require('http');
const server = http.createServer(app);
const io = require("socket.io")(server)

app.use(express.json())
app.use(cors())

app.get('/', (req, res) => {
    res.send("hello world")
});

let userSockets = {}
let userList = []

io.on('connection', (socket) => {
    let flag = false
    for (let user of userList) {
        if (socket.handshake.auth.email.toLowerCase() == user.email.toLowerCase()) {
            flag = true
            userList = userList.filter(function (value, index, arr) {
                return value != user;
            });
            userList.push(socket.handshake.auth)
        }
    }
    for (let i in userSockets) {
        console.log(i, userSockets[i].id)
    }
    if (!flag) {
        userList.push(socket.handshake.auth)
    }
    console.log("new user just joined", userList.length);
    userSockets[socket.handshake.auth.email] = socket
    io.emit('user-list', userList)
    console.table(userList);
    console.table(socket.handshake.auth);
    console.log('a user connected', socket.id);
    socket.on("message", (data) => {
        console.table(data);
        if (userSockets[data.toUser] != undefined) {

            console.table(userSockets[data.toUser].id);
            // io.emit("event", { data: data.msg })
            io.to(userSockets[data['toUser']].id).emit("event", { data: data.msg, email: data.toUser })
        }
        // io.emit("event", { data: data.msg })
        // console.log(userSockets[data.toUser]);
        // socket.broadcast.emit("event", { data: data })
        // socket.emit("event", { data: data.msg })
    })

    io.on("close", (data) => {
        console.log(socket.id, data, 'disconnected');
        console.table(userList);
        for (let i in userSockets) {
            console.log(i)
            try {
                if (userSockets[i].id == socket.id) {
                    delete userSockets[i]
                    console.log(userList);
                    delete io.sockets.sockets[socket.id];
                    delete io.sockets.connected[socket.id];

                    // Close the underlying transport
                    socket.conn.close();
                    // userSockets[i] = null
                    userList = userList.filter(function (value, index, arr) {
                        return value != socket.handshake.auth;
                    });
                    console.table(userList);
                }
            } catch (error) { }

            io.emit('user-list', userList)
        }
        socket.disconnect(true)
        console.table(userList);
        io.emit('user-list', userList)
    })

    socket.on('disconnect', (data) => {
        console.log(socket.id, data, 'disconnected');
        console.log(userList);
        for (let i in userSockets) {
            console.log(i)
            try {
                if (userSockets[i].id == socket.id) {
                    delete userSockets[i]
                    delete io.sockets.sockets[socket.id];
                    delete io.sockets.connected[socket.id];

                    // Close the underlying transport
                    socket.conn.close();
                    // userSockets[i] = null
                    userList = userList.filter(function (value, index, arr) {
                        return value != socket.handshake.auth;
                    });
                }
            } catch (error) { }
        }
        console.log("User list after disconnect");
        console.table(userList);
        io.emit('user-list', userList)

    })

});


server.listen(8080, "0.0.0.0", () => {
    console.log('listening on http://127.0.0.1:8080');
});