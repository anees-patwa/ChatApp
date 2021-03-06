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

rooms = [{
    roomName: "test",
    owner: "Anees",
    users: [],
    private: true,
    password: "hello"
}];

bans = [];
/*roomName, username*/

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

        console.log("message: " + data["message"] + " in room " + socket.roomName); // log it to the Node.JS output

        // broadcast the message to other users in room
        io.in(socket.roomName).emit("message_to_client", {
            message: data["message"],
            username: socket.username
        })
    });

    //when add is broadcast add room to room list if not duplicate
    socket.on('addRoom', function (data) {
        for (index in rooms) {
            if (rooms[index].roomName == data["roomName"]) {
                console.log("duplicate room");
                io.sockets.emit("duplicateRoom", {
                    roomName: data["roomName"]
                });
                return;
            }
        }

        //push different properties if room is private or not
        //push room object to rooms array
        if (data.private) {
            rooms.push({
                roomName: data.roomName,
                owner: socket.username,
                users: [],
                private: true,
                password: data.password
            })
        } else {
            rooms.push({
                roomName: data["roomName"],
                owner: socket.username,
                users: [],
                private: false
            });
        }

        //emit to everyone their allowed rooms
        io.of('/').clients((error, clients) => {
            if (error) throw error;
            for (let i = 0; i < clients.length; i++) {
                //get all connected sockets
                let socketTo = io.of('/').connected[clients[i]];

                let currentUser = socketTo.username;
                let allowedRooms = rooms.slice();

                //remove rooms in which user is banned from
                for (index in bans) {
                    if (bans[index].username.equals(currentUser)) {
                        allowedRooms = allowedRooms.filter(room => room.roomName != bans[index].roomName);
                    }
                }

                //print allowed rooms in terminal console
                console.log("allowed rooms after add room sent below");
                printArray(allowedRooms);
                console.log("end of allowed rooms");

                //emit list of current rooms
                io.to(socketTo.id).emit('currentRooms', {
                    rooms: allowedRooms,
                    //username: socket.username,
                    addedRoom: true
                });


            }
        })





    })

    //log username for debugging purposes
    socket.on("userNameSet", (data) => {
        socket.username = data.username;
        console.log(socket.username);
    })

    //get rooms
    socket.on('getRooms', function () {
        let currentUser = socket.username;
        let allowedRooms = rooms.slice();

        //remove rooms where user is banned
        for (index in bans) {
            if (bans[index].username == currentUser) {
                allowedRooms = allowedRooms.filter(room => room.roomName != bans[index].roomName);
            }
        }

        console.log("allowed rooms sent below");
        printArray(allowedRooms);
        console.log("end of allowed rooms");

        //emit allowed rooms to socket that wanted it
        socket.emit('currentRooms', {
            rooms: allowedRooms,
            username: socket.username
        });


    })

    //listener for joining private room
    socket.on("joinPrivRoom", (data) => {
        console.log("password " + data.password);

        //get room object
        let roomToJoin;
        for (index in rooms) {
            if (rooms[index].roomName == data.roomName) {
                roomToJoin = rooms[index];
                break;
            }
        }

        //password check
        if (roomToJoin.password == data.password) {
            //join room
            console.log("password correct");
            roomToJoin.users.push(socket.username);
            userList = [];
            for (index2 in roomToJoin.users) {
                userList.push(roomToJoin.users[index2]);
            }
            console.log(socket.username + " is joining room " + data.roomName);
            socket.join(data.roomName);
            socket.roomName = data.roomName;
            //emit to everyone in room who joined
            io.in(data.roomName).emit("roomJoined", {
                username: socket.username,
                users: userList,
            })

            //emit to owner that they are owner
            io.of('/').in(roomToJoin.roomName).clients((error, clients) => {
                if (error) throw error;
                for (let i = 0; i < clients.length; i++) {
                    let socketTo = io.of('/').in(roomToJoin.roomName).connected[clients[i]];
                    if (socketTo.username == roomToJoin.owner) {
                        console.log(socketTo.id);
                        console.log("owner of " + roomToJoin.roomName + " is " + roomToJoin.owner)
                        io.to(socketTo.id).emit('owner', {
                            username: socketTo.username
                        });
                        break;
                    }
                }
            })
        } else {
            //log incorrect password
            console.log("incorrect password");
        }
    })

    //listener for joining public room
    socket.on('joinPubRoom', (data) => {
        console.log("room from emit " + data.roomName);
        socket.join(data.roomName);
        socket.roomName = data.roomName;
        console.log("socket roomName " + socket.roomName);
        let userList = []
        let roomToJoin;
        for (index in rooms) {
            if (rooms[index].roomName == data.roomName) {
                rooms[index].users.push(socket.username);

                roomToJoin = rooms[index];

                for (index2 in rooms[index].users) {
                    userList.push(rooms[index].users[index2]);
                }
                break;
            }
        }

        io.in(data.roomName).emit("roomJoined", {
            username: socket.username,
            users: userList

        })


        //emit to owner that they are owner if in room
        io.of('/').in(data.roomName).clients((error, clients) => {
            if (error) throw error;
            for (let i = 0; i < clients.length; i++) {
                let socketTo = io.of('/').in(data.roomName).connected[clients[i]];
                if (socketTo.username == roomToJoin.owner) {
                    console.log(socketTo.id);
                    io.to(socketTo.id).emit('owner', {
                        username: socketTo.username
                    });
                    break;
                }
            }
        })
    })

    socket.on('leaveRoom', () => {

        let user = socket.username;
        let roomLeft = socket.roomName;
        let roomLeftObject;

        //remove user from room's users array
        for (index in rooms) {
            if (rooms[index].roomName == roomLeft) {
                let userIndex = rooms[index].users.indexOf(user);
                rooms[index].users.splice(userIndex, 1);
                roomLeftObject = rooms[index];
                break;
            }
        }

        //reset socke values and leave room
        socket.roomName = null;
        socket.leave(roomLeft);
        console.log(user + " left " + roomLeft);
        io.in(roomLeft).emit('roomLeft', {
            username: user,
            users: roomLeftObject.users
        })
    })

    //private message
    socket.on('private_message_server', (data) => {
        let userTo = data.username;
        let userFrom = socket.username;

        console.log("private message from " + userFrom + " to " + userTo + " message: " + data.message);

        //send to individual user
        io.of('/').clients((error, clients) => {
            if (error) throw error;
            for (let i = 0; i < clients.length; i++) {
                let socketTo = io.of('/').connected[clients[i]];
                if (socketTo.username == userTo) {
                    console.log(socketTo.id);
                    io.to(socketTo.id).emit('private_message_client', {
                        msg: data.message,
                        from: userFrom
                    })
                    break;
                }
            }
        })
    })

    socket.on('kickUser', (data) => {
        let user = data.username;
        //let roomToKickFrom = socket.roomName;
        let userList = [];

        //remove user from room 
        let roomLeft = socket.roomName;
        let roomKickedFrom;
        for (index in rooms) {
            if (rooms[index].roomName == roomLeft) {
                let userIndex = rooms[index].users.indexOf(user);
                roomKickedFrom = rooms[index];
                console.log(roomKickedFrom.users);
                roomKickedFrom.users.splice(userIndex, 1);
                console.log(roomKickedFrom.users);
                //userList = roomKickedFrom.users.splice();
                break;
            }
        }




        //find user and kick them from room
        io.of('/').clients((error, clients) => {
            if (error) throw error;
            for (let i = 0; i < clients.length; i++) {
                let socketTo = io.of('/').connected[clients[i]];
                if (socketTo.username == user) {
                    console.log(socketTo.id);
                    socketTo.leave(roomLeft);
                    io.to(socketTo.id).emit("kicked");
                    socketTo.roomName == null;
                    break;
                }
            }
        })

        //emit that the user left the room
        console.log(user + " left " + roomLeft);
        io.in(roomLeft).emit('roomLeft', {
            username: user,
            users: roomKickedFrom.users
        })

    })

    socket.on('banUser', (data) => {
        //add user to bans array
        let userToBan = data.username;
        let roomToBan = socket.roomName;
        bans.push({
            username: userToBan,
            roomName: roomToBan
        });

        //kick user from room
        //let user = socket.username;
        let roomLeft = socket.roomName;
        let roomKickedFrom;
        for (index in rooms) {
            if (rooms[index].roomName == roomLeft) {
                let userIndex = rooms[index].users.indexOf(userToBan);
                roomKickedFrom = rooms[index];
                console.log(roomKickedFrom.users);
                roomKickedFrom.users.splice(userIndex, 1);
                console.log(roomKickedFrom.users);
                //userList = roomKickedFrom.users.splice();
                break;
            }
        }





        io.of('/').clients((error, clients) => {
            if (error) throw error;
            for (let i = 0; i < clients.length; i++) {
                let socketTo = io.of('/').connected[clients[i]];
                if (socketTo.username == userToBan) {
                    console.log(socketTo.id);
                    socketTo.leave(roomLeft);
                    io.to(socketTo.id).emit("kicked");
                    socketTo.roomName == null;
                    break;
                }
            }
        })

        /*socket.roomName = null;
        socket.leave(roomLeft);*/
        console.log(userToBan + " left " + roomLeft);
        io.in(roomLeft).emit('roomLeft', {
            username: userToBan,
            users: roomKickedFrom.users
        })


    })
});