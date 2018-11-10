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

rooms = ["test"];
users = [];
bans = [];

//helper func for debugging
function printArray(array) {
    for (index in array) {
        console.log(array[index]);
    }
}
io.sockets.on("connection", function (socket) {
    // This callback runs when a new Socket.IO connection is established.

    // This callback runs when a new Socket.IO connection is established.

    socket.on('message_to_server', function (data) {
        // This callback runs when the server receives a new message from the client.

        console.log("message: " + data["message"]); // log it to the Node.JS output
        console.log(socket.roomName);
        io.in(socket.roomName).emit("message_to_client", {
            message: data["message"]
        }) // broadcast the message to other users
    });

    //when add is broadcast add room to room list if not duplicate
    socket.on('addRoom', function (data) {
        for (index in rooms) {
            if (rooms[index] == data["roomName"]) {
                console.log("duplicate room");
                io.sockets.emit("duplicateRoom", {
                    roomName: data["roomName"]
                });
                return;
            }
        }
        rooms.push(data["roomName"]);
        io.sockets.emit("joinRoom", {
            roomName: data.roomName,
            username: socket.username
        });
    })

    //log username for debugging purposes
    socket.on("usernameSet", function () {
        console.log(socket.username);
    })

    //get rooms
    socket.on('getRooms', function () {
        let currentUser = socket.username;
        allowedRooms = [];
        for (index in rooms) {

            allowedRooms.push(rooms[index]);
        }

        //printArray(allowedRooms);

        for (index in bans) {
            if (bans[index].username.equals(currentUser)) {
                Array.remove(allowedRooms, bans[index].roomName);
            }
        }

        //printArray(allowedRooms);



        socket.emit('currentRooms', {
            rooms: allowedRooms
        });


    })

    socket.on('joinRoom', (data) => {
        console.log(data.roomName);
        socket.join(data.roomName);
        socket.roomName = data.roomName;
        io.in(data.roomName).emit("roomJoined", {
            username: data.username
        })
    })
});