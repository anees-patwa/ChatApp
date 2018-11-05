// Require the packages we will use:
var http = require("http"),
    socketio = require("socket.io"),
    fs = require("fs");

// Listen for HTTP connections.  This is essentially a miniature static file server that only serves our one file, client.html:
var app = http.createServer(function (req, resp) {
    // This callback runs when a new connection is made to our HTTP server.
    console.log("connected to server");
    fs.readFile("client.html", function (err, data) {
        // This callback runs when the client.html file has been read from the filesystem.

        if (err) return resp.writeHead(500);
        resp.writeHead(200);
        resp.end(data);
    });
});
app.listen(3456);

// Do the Socket.IO magic:
var io = socketio.listen(app);
io.sockets.on("connection", function (socket) {
    // This callback runs when a new Socket.IO connection is established.

    // This callback runs when a new Socket.IO connection is established.

    socket.on('message_to_server', function (data) {
        // This callback runs when the server receives a new message from the client.

        console.log("message: " + data["message"]); // log it to the Node.JS output
        io.sockets.emit("message_to_client", {
            message: data["message"]
        }) // broadcast the message to other users
    });
    /*console.log("socket io connection is on");

    socket.on('disconnect', function () {
        io.emit('users-changed', {
            user: socket.nickname,
            event: 'left',
            room: socket.roomName
        });
    });

    socket.on('set-nickname', (nickname) => {
        socket.nickname = nickname;
        //roomName = socket.roomName;
        io.emit('users-changed', {
            user: nickname,
            event: 'joined',
            room: socket.roomName
        });
    });

    socket.on('choose-room', (roomName) => {
        socket.roomName = roomName;
    })

    socket.on('add-message', (message) => {
        io.emit('message', {
            text: message.text,
            from: socket.nickname,
            created: new Date()
        });
    });*/
});