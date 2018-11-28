var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var crypto = require('crypto');
var uuid = require('uuid');
// var mongojs = require('mongojs');
var _ = require('underscore');

//var db = mongojs('mongodb://localhost:27017/basior_scrum_poker', ['users', 'rooms', 'votings']);
var MongoClient = require('mongodb').MongoClient;
var url = 'mongodb://' + process.env.MONGO_HOST + ':27017/basior_scrum_poker';
var db = {};

MongoClient.connect(url, function (err, database) {
    if ( null === err ) {
        console.log("Connected to MongoDB server");

        db.users = database.collection('users');
        db.users_connections = database.collection('users_connections');
        db.rooms = database.collection('rooms');
        db.votings = database.collection('votings');

        console.log('Starting app');
        app.get('/', function (req, res) {
            res.sendFile(__dirname + '/index.html');
        });

        application();
    } else {
        console.log(err);
    }
});

function application() {

    const CONNECTION = 'connection';
    const DISCONNECT = 'disconnect';
    const REGISTER_EXISTING_USER = 'register_existing_user';
    const REGISTER_NEW_USER = 'register_new_user';
    const CREATE_ROOM = 'create_room';
    const PREVIEW_ROOM = 'preview_room';
    const JOIN_ROOM = 'join_room';
    const JOIN_ROOM_BY_NAME_AND_PASS = 'join_room_by_name_and_pass';
    const LEAVE_ROOM = 'leave_room';
    const CHANGE_VOTING_STATUS = 'change_voting_status';

    const VOTE = 'vote';
    const CANCEL_VOTE = 'cancel_vote';

    const EMIT_CREATE_ROOM_FAIL = 'create_room_fail';
    const EMIT_CREATE_ROOM_SUCCESS = 'create_room_success';
    const EMIT_INTRODUCE_YOURSELF = 'introduce_yourself';
    const EMIT_REGISTER_USER_FAIL = 'register_user_fail';
    const EMIT_REGISTER_USER_SUCCESS = 'register_user_success';
    const EMIT_REGISTER_USER_ALREADY_EXISTS = 'register_user_already_exists';
    const EMIT_JOIN_ROOM_SUCCESS = 'join_room_success';
    const EMIT_USER_DETAILS = 'user_details';
    const EMIT_ROOM_DETAILS = 'room_details';
    const EMIT_LEAVE_ROOM_SUCCESS = 'leave_room_success';
    const EMIT_USERS_ALREADY_VOTED = 'users_already_voted';
    const EMIT_USERS_VOTES = 'users_votes';
    const EMIT_USER_LAST_VOTE = 'user_last_vote';
    const EMIT_ROOM_NOT_FOUND = 'room_not_found';
    const EMIT_USER_NOT_FOUND = 'user_not_found';
    const EMIT_PREVIEW_ROOM_DETAILS = 'preview_room_details';
    const EMIT_PREVIEW_ROOM_CONNECTED = 'preview_room_connected';
    const EMIT_PREVIEW_ROOM_NOT_FOUND = 'preview_room_not_found';

    const STATUS_PENDING = 'STATUS_PENDING';
    const STATUS_IN_PROCESS = 'STATUS_IN_PROCESS';
    const STATUS_FINISHED = 'STATUS_FINISHED';

    io.on(CONNECTION, function (socket) {

        socket.user_details = {
            id: undefined,
            name: undefined,
            room_id: undefined
        };

        /**
         * REGISTER_EXISTING_USER
         */
        socket.on(REGISTER_EXISTING_USER, function (msg) {
            var callback = function (err, docs) {

                if (undefined != docs[0]) {
                    socket.user_details = docs[0];
                    socket.emit(EMIT_USER_DETAILS, socket.user_details);
                    infoLog(EMIT_USER_DETAILS, socket.user_details);

                    if (undefined != socket.user_details.room_id) {
                        findRoomById(socket.user_details.room_id, function (err, docs) {
                            if (undefined != docs[0]) {
                                var roomsDetails = docs[0];

                                // join room
                                socket.join('room_' + roomsDetails.id);

                                saveRoom(roomsDetails, function (roomsDetails) {
                                    socket.user_details.room_id = roomsDetails.id;

                                    // voting details if exists
                                    emitVotingDetails(roomsDetails);

                                    // emit successes to user
                                    socket.emit(EMIT_JOIN_ROOM_SUCCESS);

                                    // join created room
                                    joinRoom(roomsDetails);
                                });
                            } else {
                                //socket.emit(EMIT_REGISTER_USER_FAIL);
                                //infoLog(EMIT_REGISTER_USER_FAIL);
                            }

                            socket.emit(EMIT_REGISTER_USER_SUCCESS);
                            infoLog(EMIT_REGISTER_USER_SUCCESS);

                            // join private user channel
                            socket.join('user_' + socket.user_details.id);

                            saveUserConnection();
                        });
                    } else {
                        socket.emit(EMIT_REGISTER_USER_SUCCESS);
                        infoLog(EMIT_REGISTER_USER_SUCCESS);

                        // join private user channel
                        socket.join('user_' + socket.user_details.id);

                        saveUserConnection();
                    }
                } else {
                    socket.emit(EMIT_USER_NOT_FOUND);
                    infoLog(EMIT_USER_NOT_FOUND);
                }
            };

            if (undefined != msg.id) {
                findUserById(msg.id, callback);
            } else if (undefined != msg.name && undefined != msg.password) {
                findUserByNameAndPassword(msg.name, msg.password, callback);
            }
        });

        /**
         * REGISTER_NEW_USER
         */
        socket.on(REGISTER_NEW_USER, function (msg) {
            if (undefined != msg.name && undefined != msg.password) {
                // if user not exists create new
                findUserByName(msg.name, function (err, docs) {
                    if (undefined == docs || undefined == docs[0]) {
                        socket.user_details = {
                            id: uuid.v4(),
                            name: msg.name,
                            password: msg.password,
                            room_id: undefined
                        };

                        saveUser();

                        socket.emit(EMIT_REGISTER_USER_SUCCESS);
                        infoLog(EMIT_REGISTER_USER_SUCCESS, socket.user_details);

                        // join private user channel
                        socket.join('user_' + socket.user_details.id);

                        saveUserConnection();
                    } else {
                        socket.emit(EMIT_REGISTER_USER_ALREADY_EXISTS);
                        infoLog(EMIT_REGISTER_USER_ALREADY_EXISTS);
                    }
                })
            } else {
                socket.emit(EMIT_REGISTER_USER_FAIL);
                infoLog(EMIT_REGISTER_USER_FAIL);
            }
        });

        /**
         * CREATE_ROOM
         */
        socket.on(CREATE_ROOM, function (msg) {
            if (undefined != msg.name && undefined != msg.sequence) {
                var roomsDetails = {
                    id: uuid.v4(),
                    name: msg.name,
                    password: msg.password,
                    sequence: msg.sequence,
                    users: {},
                    admin: socket.user_details.id,
                    voting_status: STATUS_PENDING
                };

                // save room
                saveRoom(roomsDetails, function (roomsDetails) {
                    // join created room
                    joinRoom(roomsDetails);
                });

                socket.emit(EMIT_CREATE_ROOM_SUCCESS);
                infoLog(EMIT_CREATE_ROOM_SUCCESS, socket.room_details);
                return true;
            }

            socket.emit(EMIT_CREATE_ROOM_FAIL);
            infoLog(EMIT_CREATE_ROOM_FAIL);
            return false;
        });

        /**
         * PREVIEW_ROOM
         */
        socket.on(PREVIEW_ROOM, function (msg) {
            function callback(err, docs) {
                if (undefined !== docs[0]) {
                    previewRoom(docs[0]);
                } else {
                    socket.emit(EMIT_PREVIEW_ROOM_NOT_FOUND);
                    infoLog('EMIT_PREVIEW_ROOM_NOT_FOUND');
                }
            }

            if (undefined != msg.id) {
                findRoomById(msg.id, callback);
            } else if (undefined != msg.name && undefined != msg.password) {
                findRoomByNameAndPass(msg.name, msg.password, callback);
            }
        });

        /**
         * JOIN_ROOM
         */
        socket.on(JOIN_ROOM, function (msg) {
            if (undefined != msg.id && undefined != socket.user_details.id) {
                // find and join room
                findRoomById(msg.id, function (err, docs) {
                    if (undefined != docs[0]) {
                        joinRoom(docs[0]);
                        socket.user_details.room_id = msg.id;
                    } else {
                        socket.user_details.room_id = undefined;
                    }
                });
            }
        });

        /**
         * JOIN_ROOM_BY_NAME_AND_PASS
         */
        socket.on(JOIN_ROOM_BY_NAME_AND_PASS, function (msg) {
            if (undefined != msg.name && undefined != msg.password && undefined != socket.user_details.id) {
                findRoomByNameAndPass(msg.name, msg.password, function (err, docs) {
                    if (undefined != docs[0]) {
                        // join created room
                        if (true === joinRoom(docs[0])) {
                            socket.user_details.room_id = docs[0].id;
                        }

                        infoLog('room found and joined');

                        return true;
                    }
                });
            }

            infoLog('room not found');
            socket.emit(EMIT_ROOM_NOT_FOUND);
        });

        /**
         * LEAVE_ROOM
         */
        socket.on(LEAVE_ROOM, function () {
            if (undefined != socket.user_details.room_id && undefined != socket.user_details.id) {

                leaveRoom(socket.user_details.room_id, socket.user_details.id);
                socket.user_details.room_id = undefined;

                saveUser();
            }
        });

        /**
         * CHANGE_VOTING_STATUS
         */
        socket.on(CHANGE_VOTING_STATUS, function (msg) {
            if (
                undefined != msg.status
                && undefined != socket.user_details.room_id
                && -1 < [STATUS_PENDING, STATUS_IN_PROCESS, STATUS_FINISHED].indexOf(msg.status)
            ) {
                forAdmin(function (roomsDetails) {
                    roomsDetails.voting_status = msg.status;
                    saveRoom(roomsDetails);

                    switch (msg.status) {
                        case STATUS_PENDING:
                            clearVotes(roomsDetails.id);
                            socket.emit(EMIT_USER_LAST_VOTE, undefined);
                            break;
                        case STATUS_IN_PROCESS:
                            hideVotes(roomsDetails.id);
                            db.votings.find({rooms_id: roomsDetails.id, users_id: socket.user_details.id}).toArray(function (err, docs) {
                                if (undefined != docs[0]) {
                                    socket.emit(EMIT_USER_LAST_VOTE, docs[0].vote);
                                } else {
                                    socket.emit(EMIT_USER_LAST_VOTE, undefined);
                                }
                            });
                            break;
                        case STATUS_FINISHED:
                            showVotes(roomsDetails.id);
                            break;
                    }
                });
            }
        });

        /**
         * VOTE
         */
        socket.on(VOTE, function (msg) {
            if (
                undefined != msg.vote
                && undefined != socket.user_details.room_id
            ) {
                // @todo: check if vote in sequence
                saveVoting(socket.user_details.room_id, socket.user_details.id, msg.vote);


                // join private user channel
                socket.join('user_' + socket.user_details.id);

                io.to('user_' + socket.user_details.id).emit(EMIT_USER_LAST_VOTE, msg.vote);

                infoLog('VOTED', msg.vote);
            }
        });

        /**
         * CANCEL_VOTE
         */
        socket.on(CANCEL_VOTE, function (msg) {
            cancelVote(socket.user_details.room_id, socket.user_details.id);
        });


        function forAdmin(callback) {
            findRoomById(socket.user_details.room_id, function (err, docs) {
                if (undefined != docs[0]) {
                    if (false !== docs[0] && docs[0].admin === socket.user_details.id) {
                        callback(docs[0]);
                    }
                }
            });
        }

        /**
         * LEAVE ROOM
         * @param roomsId
         */
        function leaveRoom(roomsId) {
            findRoomById(roomsId, function (err, docs) {
                if (undefined != docs[0]) {

                    var roomsDetails = docs[0];
                    // edit room details
                    delete roomsDetails.users[socket.user_details.id];
                    // cancel vote
                    cancelVote(socket.user_details.room_id, socket.user_details.id);

                    saveRoom(roomsDetails);

                    socket.emit(EMIT_LEAVE_ROOM_SUCCESS);

                    // join room
                    socket.leave('room_' + roomsDetails.id);
                }
                infoLog('ROOM LEFT', [roomsId, socket.user_details.id]);
            });
        }

        socket.on(DISCONNECT, function () {
            removeUserConnection(function (connectionsLeft) {
                var liveConnections = checkCloseForgottenConnections(connectionsLeft);

                // remove current socket
                db.users_connections.remove({ users_id: socket.user_details.id, sockets_id: socket.id });
                for (var k in liveConnections)
                    if (socket.id == liveConnections[k].sockets_id) delete liveConnections[k];

                if (undefined === liveConnections || liveConnections.length == 0) {
                    // no connections left - forget user
                    if (undefined != socket.user_details.room_id) {
                        leaveRoom(socket.user_details.room_id);
                    }
                    infoLog('USER FULLY DISCONNECTED', socket.user_details)
                } else {
                    infoLog('USER DISCONNECTED ONE SOCKET', socket.user_details)
                }
            });
        });

        /**
         * JOIN ROOM
         * @param roomsDetails
         */
        function previewRoom(roomsDetails) {

            // join room
            socket.join('room_' + roomsDetails.id);

            // voting details if exists
            emitVotingDetails(roomsDetails);

            // emit new details to room users
            io.to('room_' + roomsDetails.id).emit(EMIT_ROOM_DETAILS, roomsDetails);
            infoLogGlobal('emited room details to room', {channel_name: 'room_' + roomsDetails.id});

            // emit succes to user
            socket.emit(EMIT_PREVIEW_ROOM_CONNECTED);
            socket.emit(EMIT_PREVIEW_ROOM_DETAILS, roomsDetails);
            infoLog('PREVIEW_ROOM_CONNECTED and details send', roomsDetails);
        }

        /**
         * JOIN ROOM
         * @param roomsDetails
         */
        function joinRoom(roomsDetails) {
            // edit room details
            if (undefined == roomsDetails.users[socket.user_details.id]) {
                roomsDetails.users[socket.user_details.id] = {};
            }
            roomsDetails.users[socket.user_details.id].id = socket.user_details.id;

            // join room
            socket.join('room_' + roomsDetails.id);

            saveRoom(roomsDetails);

            socket.user_details.room_id = roomsDetails.id;

            // save user
            saveUser();

            // voting details if exists
            emitVotingDetails(roomsDetails);

            // emit succes to user
            socket.emit(EMIT_JOIN_ROOM_SUCCESS);
            infoLog('ROOM JOINED', roomsDetails);

            emitUsersAlreadyVoted(roomsDetails.id);

            return true;
        }

        /**
         * saveUserDetails
         */
        function saveUser() {
            db.users.replaceOne(
                {id: socket.user_details.id},
                socket.user_details,
                {upsert: true},
                function (err, res) {
                    if (null === err) {
                        socket.emit(EMIT_USER_DETAILS, socket.user_details);
                        infoLog(EMIT_USER_DETAILS, socket.user_details);
                    }
                }
            );
        }

        /**
         * Emits voting details
         */
        function emitVotingDetails(roomsDetails) {
            db.votings.find({rooms_id: roomsDetails.id}).toArray(function (err, docs) {
                if (undefined != docs[0]) {
                    var usersAlreadyVoted = [];
                    for (var k in docs) {
                        usersAlreadyVoted.push(docs[k].users_id);

                        // last user vote
                        if (docs[k].id == socket.user_details.id) {
                            socket.emit(EMIT_USER_LAST_VOTE, docs[k].vote);
                        }
                    }

                    io.to('room_' + roomsDetails.id).emit(EMIT_USERS_ALREADY_VOTED, usersAlreadyVoted);
                    infoLogGlobal('EMITED USERS_ALREADY_VOTED #1');

                    if (roomsDetails.voting_status == STATUS_FINISHED) {
                        showVotes(roomsDetails.id);
                    }
                }
            });
        }

        /**
         * INFO TO CONSOLE
         * @param log_name
         * @param log
         */
        function infoLog(log_name, log) {
            var info_log = {};
            info_log.pipe = socket.picked_pipe;
            info_log.client_id = socket.client.id;
            info_log.ip = socket.handshake.address;
            // merge two objects
            if (undefined != log && 'object' === typeof log) {
                for (var attrname in log) {
                    info_log[attrname] = log[attrname];
                }
            }
            var logDate = new Date();
            logDate = logDate.toISOString().split('T').join(' ').split('Z').join('');
            console.log(logDate + '|' + log_name + '|' + JSON.stringify(info_log));
        }

        function saveUserConnection() {
            db.users_connections.insert({ users_id: socket.user_details.id, sockets_id: socket.id }, function () {
                db.users_connections.find({ users_id: socket.user_details.id}).toArray(function (err, docs) {
                    checkCloseForgottenConnections(docs);
                });
            });
        }

        function removeUserConnection(callback) {
            db.users_connections.remove({ users_id: socket.user_details.id, sockets_id: socket.id }, function () {
                db.users_connections.find({ users_id: socket.user_details.id}).toArray(function (err, docs) {
                    callback(docs);
                });
            });
        }

        function checkCloseForgottenConnections(connectionsLeft) {
            var liveConnections = connectionsLeft;
            for (var k in liveConnections) {
                if (undefined == io.sockets.sockets[liveConnections[k].sockets_id]) {
                    db.users_connections.remove({ users_id: socket.user_details.id, sockets_id: liveConnections[k].sockets_id });
                    delete liveConnections[k];
                }
            }

            return liveConnections;
        }

        infoLog('CONNECTION - introduce_yourself');
        socket.emit(EMIT_INTRODUCE_YOURSELF);
    });


    function findUserById(usersId, callback) {
        db.users.find({id: usersId}).toArray(callback);
    }

    function findUserByName(name, callback) {
        db.users.find({name: name}).toArray(callback);
    }

    function findUserByNameAndPassword(name, password, callback) {
        db.users.find({name: name, password: password}).toArray(callback);
    }

    function saveRoom(roomsDetails, callback) {
        var roomsDetailsToSave = roomsDetails,
            usersList = [];

        for (var k in roomsDetailsToSave.users) {
            usersList.push(roomsDetailsToSave.users[k].id);
        }

        db.users
            .find({id: {$in: usersList}})
            .toArray(function (err, usersInRoom) {

                for (var k in usersInRoom) {
                    roomsDetailsToSave.users[usersInRoom[k].id] = usersInRoom[k];
                }

                db.rooms.replaceOne(
                    { id: roomsDetailsToSave.id },
                    roomsDetailsToSave,
                    { upsert: true },
                    function (err, res) {
                        if (null === err) {
                            // emit new details to room users
                            io.to('room_' + roomsDetailsToSave.id).emit(EMIT_ROOM_DETAILS, roomsDetailsToSave);
                            infoLogGlobal('emited room details to room', {channel_name: 'room_' + roomsDetailsToSave.id});

                            // check admin status
                            pickAdmin(roomsDetailsToSave);

                            if ('function' == typeof callback) callback(roomsDetailsToSave);
                        }
                    }
                );
            });
    }

    function saveVoting(roomsId, usersId, vote) {
        db.votings.replaceOne(
            { rooms_id: roomsId, users_id: usersId },
            { rooms_id: roomsId, users_id: usersId, vote: vote },
            { upsert: true },
            function (err, res) {
                if (null === err) {
                    emitUsersAlreadyVoted(roomsId);
                }
            }
        );
    }

    function emitUsersAlreadyVoted(roomsId) {
        db.votings.find({rooms_id: roomsId}).toArray(function (err, docs) {
            var usersVoted = [];
            if (undefined != docs[0]) {
                for (var k in docs) {
                    usersVoted.push(docs[k].users_id);
                }
            }

            io.to('room_' + roomsId).emit(EMIT_USERS_ALREADY_VOTED, usersVoted);
            infoLogGlobal('EMITED USERS_ALREADY_VOTED #2', {users_voted: usersVoted});
        });
    }

    function cancelVote(roomsId, usersId) {
        db.votings.remove({rooms_id: roomsId, users_id: usersId}, function () {
            emitUsersAlreadyVoted(roomsId);
            infoLogGlobal('VOTE CANCELED');
        });
    }

    function showVotes(roomsId) {
        db.votings.find({rooms_id: roomsId}).toArray(function (err, docs) {
            if (undefined != docs[0]) {
                var userVotes = {};
                for (var k in docs) {
                    userVotes[docs[k].users_id] = docs[k].vote;
                }

                io.to('room_' + roomsId).emit(EMIT_USERS_VOTES, userVotes);
                infoLogGlobal('showVotes');
            }
        });
    }

    function hideVotes(roomsId) {
        io.to('room_' + roomsId).emit(EMIT_USERS_VOTES, {});
        infoLogGlobal('hideVotes');
    }

    function clearVotes(roomsId) {
        db.votings.remove({rooms_id: roomsId});
        io.to('room_' + roomsId).emit(EMIT_USERS_VOTES, {});
        infoLogGlobal('clearVotes');

        io.to('room_' + roomsId).emit(EMIT_USERS_ALREADY_VOTED, []);
        infoLogGlobal('EMITED USERS_ALREADY_VOTED #4');
    }

    function findRoomById(roomsId, callback) {
        db.rooms.find({id: roomsId}).toArray(callback);
    }

    function findRoomByNameAndPass(name, password, callback) {
        db.rooms.find({name: name, password: password}).toArray(callback);
    }

    function pickAdmin(roomsDetails, afterWaitPeriod) {
        infoLogGlobal('CHECKING ROOM ADMIN', roomsDetails);
        // if admin present in room
        for (var a in roomsDetails.users) {
            if (roomsDetails.admin == roomsDetails.users[a].id) {
                infoLogGlobal('CHECKING ROOM ADMIN | same admin');
                return true;
            }
        }

        if (true === afterWaitPeriod) {
            // admin left - pick next use ras admin
            for (var k in roomsDetails.users) {
                infoLogGlobal('CHECKING ROOM ADMIN | admin changed');
                db.rooms.update(
                    {id: roomsDetails.id},
                    {$set: {admin: roomsDetails.users[k].id}},
                    function () {
                        // emit new details to room users
                        roomsDetails.admin = roomsDetails.users[k].id;
                        io.to('room_' + roomsDetails.id).emit(EMIT_ROOM_DETAILS, roomsDetails);
                        infoLogGlobal('emited room details to room after admin change', {channel_name: 'room_' + roomsDetails.id, new_admin: roomsDetails.users[k].id});
                    }
                );
                return true;
            }
        } else {
            // wait few seconds in case of reloading
            setTimeout(function () {
                findRoomById(roomsDetails.id, function (err, docs) {
                        if (undefined != docs[0]) pickAdmin(docs[0], true);
                    }
                )
            }, 5000);
        }
    }


    /**
     * INFO TO CONSOLE
     * @param log_name
     * @param log
     */
    function infoLogGlobal(log_name, log) {
        var info_log = {};
        // merge two objects
        if (undefined != log && 'object' === typeof log) {
            for (var attrname in log) {
                info_log[attrname] = log[attrname];
            }
        }
        var logDate = new Date();
        logDate = logDate.toISOString().split('T').join(' ').split('Z').join('');
        console.log(logDate + '|' + log_name + '|' + JSON.stringify(info_log));
    }

    http.listen(3003, function () {
        console.log('listening on *:3003');
    });
}