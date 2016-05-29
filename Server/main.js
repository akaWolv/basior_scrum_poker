var app = require('express')();
var http = require('http').Server(app);
var http_lib = require('http');
var io = require('socket.io')(http);
var crypto = require('crypto');
var uuid = require('uuid');

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

var _users = {};
var _rooms = {};
var _votings = {};

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

//const JOIN_ROOM_BY_NAME = 'join_room_by_name';
//const CREATE_NEW_ROOM = 'create_new_room';
//const FORGET_ABOUT_LAST_VISITED_ROOM = 'forget_about_last_visited_room';
//const REGISTER_USER = 'register_user';
//const REQUEST_USER_DETAILS = 'request_user_details';
//const REQUEST_ROOM_DETAILS = 'request_room_details';
//const START_NEW_VOTING = 'start_new_voting';
//const FINISH_VOTING = 'finish_voting';
//const CONTINUE_VOTING = 'continue_voting';
const VOTE = 'vote';
const CANCEL_VOTE = 'cancel_vote';


const EMIT_CREATE_ROOM_FAIL = 'create_room_fail';
const EMIT_CREATE_ROOM_SUCCESS = 'create_room_success';
const EMIT_INTRODUCE_YOURSELF = 'introduce_yourself';
const EMIT_REGISTER_USER_FAIL = 'register_user_fail';
const EMIT_REGISTER_USER_SUCCESS = 'register_user_success';
const EMIT_JOIN_ROOM_FAIL = 'join_room_fail';
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

//const EMIT_LEAVE_ROOM_FAIL = 'leave_room_fail';
//const EMIT_ROOM_NOT_EXISTS = 'room_not_exists';
//const EMIT_USER_NOT_EXISTS = 'user_not_exists';
//const EMIT_VOTING_STATUS_CHANGED = 'voting_status_changed';
//const EMIT_VOTES_SHOW_VALUES = 'votes_show_values';
//const EMIT_VOTES_HIDE_VALUES = 'votes_hide_values';
//const EMIT_VOTES_STATUS_CHANGE = 'votes_status_change';

const STATUS_PENDING =  'STATUS_PENDING';
const STATUS_IN_PROCESS =  'STATUS_IN_PROCESS';
const STATUS_FINISHED =  'STATUS_FINISHED';

//room_details = {
//    id: undefined,
//    name: undefined,
//    sequence: undefined,
//    admin: undefined,
//    users: {},
//    voting_status: undefined
//};
//_votings = {
//    'uuid': {
//        users_id: vote
//    }
//}


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
        var userDetails;

        if (undefined != msg.id) {
            userDetails = findUserById(msg.id);
        } else if (undefined != msg.name && undefined != msg.password) {
            userDetails = findUserByNameAndPassword(msg.name, msg.password);
            if (false === userDetails) {
                socket.emit(EMIT_USER_NOT_FOUND);
                infoLog(EMIT_USER_NOT_FOUND);
                return false;
            }
        }

        if (undefined != userDetails && false != userDetails) {
            socket.user_details = userDetails;

            if (undefined != socket.user_details.room_id) {
                var roomDetails = findRoomById(socket.user_details.room_id);
                if (false !== roomDetails) {

                    if (false === joinRoom(roomDetails.id)) {
                        socket.user_details.room_id = undefined;
                    }
                }
            }

            saveUser();

            socket.emit(EMIT_REGISTER_USER_SUCCESS);
            infoLog(EMIT_REGISTER_USER_SUCCESS);
            return true;
        }

        socket.emit(EMIT_REGISTER_USER_FAIL);
        infoLog(EMIT_REGISTER_USER_FAIL);
        return false;
    });

    /**
     * REGISTER_NEW_USER
     */
    socket.on(REGISTER_NEW_USER, function (msg) {
        if (undefined != msg.name && undefined != msg.password) {
            socket.user_details = {
                id: uuid.v4(),
                name: msg.name,
                password: msg.password,
                room_id: undefined
            };

            saveUser();

            socket.emit(EMIT_REGISTER_USER_SUCCESS);
            infoLog(EMIT_REGISTER_USER_SUCCESS, socket.user_details);
            return true;
        }

        socket.emit(EMIT_REGISTER_USER_FAIL);
        infoLog(EMIT_REGISTER_USER_FAIL);
        return false;
    });

    /**
     * CREATE_ROOM
     */
    socket.on(CREATE_ROOM, function (msg) {
        if (undefined != msg.name && undefined != msg.sequence) {
            var roomDetails = {
                id: uuid.v4(),
                name: msg.name,
                password: msg.password,
                sequence: msg.sequence,
                users: {},
                admin: socket.user_details.id,
                voting_status: STATUS_PENDING
            };
            saveRoom(roomDetails);

            // join created room
            joinRoom(roomDetails.id);

            saveUser();

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
        var roomDetails;
        if (undefined != msg.id) {
            roomDetails = findRoomById(msg.id);
        } else if (undefined != msg.name && undefined != msg.password) {
            roomDetails = findRoomByNameAndPass(msg.name, msg.password);
        }

        if (undefined != roomDetails && false != roomDetails) {
            previewRoom(roomDetails);
        } else {
            socket.emit(EMIT_PREVIEW_ROOM_NOT_FOUND);
            infoLog('EMIT_PREVIEW_ROOM_NOT_FOUND');
        }
    });

    /**
     * JOIN_ROOM
     */
    socket.on(JOIN_ROOM, function (msg) {
        if (undefined != msg.id && undefined != socket.user_details.id) {
            // join created room
            if (true === joinRoom(msg.id)) {
                socket.user_details.room_id = msg.id;
            } else {
                socket.user_details.room_id = undefined;
            }

            saveUser();
        }
    });

    /**
     * JOIN_ROOM_BY_NAME_AND_PASS
     */
    socket.on(JOIN_ROOM_BY_NAME_AND_PASS, function (msg) {
        if (undefined != msg.name && undefined != msg.password && undefined != socket.user_details.id) {
            // find room
            var roomDetails = findRoomByNameAndPass(msg.name, msg.password);
            if (false !== roomDetails) {

                // join created room
                if (true === joinRoom(roomDetails.id)) {
                    socket.user_details.room_id = roomDetails.id;
                }

                saveUser();
                infoLog('room found and joined');
                return true;
            }
        }

        infoLog('room not found');
        socket.emit(EMIT_ROOM_NOT_FOUND);
        return false;
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
            && true === isAdmin()
            && -1 < [STATUS_PENDING, STATUS_IN_PROCESS, STATUS_FINISHED].indexOf(msg.status)
        ) {
            var roomDetails = findRoomById(socket.user_details.room_id);
            if (false !== roomDetails) {

                roomDetails.voting_status = msg.status;
                saveRoom(roomDetails);

                switch (msg.status) {
                    case STATUS_PENDING:
                        clearVotes(roomDetails.id);
                        userLastVote();
                        break;
                    case STATUS_IN_PROCESS:
                        hideVotes(roomDetails.id);
                        userLastVote();
                        break;
                    case STATUS_FINISHED:
                        showVotes(roomDetails.id);
                        break;
                }
            }
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
            saveVote(socket.user_details.room_id, socket.user_details.id, msg.vote);
            infoLog('VOTED', msg.vote);
        }
    });

    /**
     * CANCEL_VOTE
     */
    socket.on(CANCEL_VOTE, function (msg) {
        cancelVote(socket.user_details.room_id, socket.user_details.id);
        infoLog('VOTE CANCELED');
    });


    function isAdmin() {
        var roomDetails = findRoomById(socket.user_details.room_id);
        if (false !== roomDetails) {
            return roomDetails.admin === socket.user_details.id;
        }
        return false;
    }

    function userLastVote() {
        var vote = undefined;
        if (undefined != _votings[socket.user_details.room_id] && undefined != _votings[socket.user_details.room_id][socket.user_details.id]) {
            vote = _votings[socket.user_details.room_id][socket.user_details.id];
        }
        socket.emit(EMIT_USER_LAST_VOTE, vote);
    }

    /**
     * LEAVE ROOM
     * @param roomsId
     */
    function leaveRoom(roomsId) {
        var roomDetails = findRoomById(roomsId);
        if (false !== roomDetails) {

            // edit room details
            delete roomDetails.users[socket.user_details.id];

            // cancel vote
            cancelVote(socket.user_details.room_id, socket.user_details.id);

            //if (roomDetails.admin == socket.user_details.id) {
            //    var newRoomAdminId = getAdminId(roomDetails.id);
            //    if (false !== newRoomAdminId) {
            //        roomDetails.admin = newRoomAdminId;
            //    }
            //}

            socket.emit(EMIT_LEAVE_ROOM_SUCCESS);

            // join room
            socket.leave('room_' + roomDetails.id);

            saveRoom(roomDetails);
        }

        infoLog('ROOM LEFT', [roomsId, socket.user_details.id]);
    }

    socket.on(DISCONNECT, function () {
        if (undefined != socket.user_details.room_id) {
            leaveRoom(socket.user_details.room_id);
        }
        infoLog('USER DISCONNECTED', socket.user_details)
    });

    /**
     * JOIN ROOM
     * @param roomsId
     * @returns {boolean}
     */
    function previewRoom(roomDetails) {

        // join room
        socket.join('room_' + roomDetails.id);

        // voting details if exists
        emitVotingDetails(roomDetails);

        // emit new details to room users
        io.to('room_' + roomDetails.id).emit(EMIT_ROOM_DETAILS, roomDetails);
        infoLogGlobal('emited room details to room', {channel_name: 'room_' + roomDetails.id});

        // emit succes to user
        socket.emit(EMIT_PREVIEW_ROOM_CONNECTED);
        socket.emit(EMIT_PREVIEW_ROOM_DETAILS, roomDetails);
        infoLog('PREVIEW_ROOM_CONNECTED and details send', roomDetails);
        return true;
    }

    /**
     * JOIN ROOM
     * @param roomsId
     * @returns {boolean}
     */
    function joinRoom(roomsId) {
        var roomDetails = findRoomById(roomsId);
        if (false !== roomDetails) {

            // edit room details
            roomDetails.users[socket.user_details.id] = {};
            roomDetails.users[socket.user_details.id].id = socket.user_details.id;

            // emit succes to user
            socket.emit(EMIT_JOIN_ROOM_SUCCESS);

            // join room
            socket.join('room_' + roomDetails.id);

            saveRoom(roomDetails);

            socket.user_details.room_id = roomDetails.id;

            // voting details if exists
            emitVotingDetails(roomDetails);

            infoLog('ROOM JOINED', roomDetails);
            return true;
        }

        socket.emit(EMIT_JOIN_ROOM_FAIL);
        infoLog('ROOM NOT JOINED', roomsId);
        return false;
    }

    /**
     * saveUserDetails
     */
    function saveUser() {
        if (socket.user_details.room_id) {
            var roomDetails = findRoomById(socket.user_details.room_id);
            if (false !== roomDetails) {
                saveRoom(roomDetails);
            } else {
                socket.user_details.room_id = undefined;
            }
        }

        _users[socket.user_details.id] = socket.user_details;
        socket.emit(EMIT_USER_DETAILS, socket.user_details);
        infoLog(EMIT_USER_DETAILS, socket.user_details);

        return true;
    }

    /**
     * Emits voting details
     */
    function emitVotingDetails(roomDetails) {
        if (undefined != _votings[roomDetails.id]) {
            io.to('room_' + roomDetails.id).emit(EMIT_USERS_ALREADY_VOTED, Object.keys(_votings[roomDetails.id]));
            infoLogGlobal('EMITED USERS_ALREADY_VOTED');

            if (roomDetails.voting_status == STATUS_FINISHED) {
                showVotes(roomDetails.id);
            }

            userLastVote();
        }
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

    infoLog('CONNECTION - introduce_yourself');
    socket.emit(EMIT_INTRODUCE_YOURSELF);
});


function findUserById(usersId) {
    for (var k in _users) {
        if (usersId == _users[k].id) {
            return _users[k];
        }
    }
    return false;
}

function findUserByNameAndPassword(name, password) {
    for (var k in _users) {
        if (name == _users[k].name && password == _users[k].password) {
            return _users[k];
        }
    }
    return false;
}

function saveRoom(roomDetails) {
    _rooms[roomDetails.id] = roomDetails;

    // check admin status
    _rooms[roomDetails.id].admin = getAdminId(roomDetails.id);

    for (var k in _rooms[roomDetails.id].users) {
        _rooms[roomDetails.id].users[k] = findUserById(_rooms[roomDetails.id].users[k].id);
    }

    // emit new details to room users
    io.to('room_' + roomDetails.id).emit(EMIT_ROOM_DETAILS, roomDetails);
    infoLogGlobal('emited room details to room', {channel_name: 'room_' + roomDetails.id});
    return true;
}

function saveVote(roomsId, usersId, vote) {
    if (undefined === _votings[roomsId]) {
        _votings[roomsId] = {};
    }

    _votings[roomsId][usersId] = vote;

    io.to('room_' + roomsId).emit(EMIT_USERS_ALREADY_VOTED, Object.keys(_votings[roomsId]));
    infoLogGlobal('EMITED USERS_ALREADY_VOTED');
}
function cancelVote(roomsId, usersId) {
    if (undefined == _votings[roomsId] || undefined == _votings[roomsId][usersId]) {
        return true;
    }

    delete _votings[roomsId][usersId];

    io.to('room_' + roomsId).emit(EMIT_USERS_ALREADY_VOTED, Object.keys(_votings[roomsId]));
    infoLogGlobal('EMITED USERS_ALREADY_VOTED');
}

function showVotes(roomsId) {
    var votes = {};
    if (undefined != _votings[roomsId]) {
        votes = _votings[roomsId];
    }
    io.to('room_' + roomsId).emit(EMIT_USERS_VOTES, votes);
    infoLogGlobal('showVotes');
}

function hideVotes(roomsId) {
    io.to('room_' + roomsId).emit(EMIT_USERS_VOTES, {});
    infoLogGlobal('hideVotes');
}

function clearVotes(roomsId) {
    _votings[roomsId] = {}
    io.to('room_' + roomsId).emit(EMIT_USERS_VOTES, {});
    infoLogGlobal('clearVotes');


    if (undefined !== _votings[roomsId]) {
        _votings[roomsId] = {};

        io.to('room_' + roomsId).emit(EMIT_USERS_ALREADY_VOTED, []);
        infoLogGlobal('EMITED USERS_ALREADY_VOTED');
    }
}

function findRoomById(roomsId) {
    for (var k in _rooms) {
        if (roomsId == _rooms[k].id) {
            return _rooms[k];
        }
    }
    return false;
}

function findRoomByNameAndPass(name, password) {
    for (var k in _rooms) {
        if (name == _rooms[k].name && password == _rooms[k].password) {
            return _rooms[k];
        }
    }
    return false;
}

function getAdminId(roomsId) {
    var roomsDetails = findRoomById(roomsId);
    if (false !== roomsDetails) {
        // if admin present in room
        for (var a in roomsDetails.users) {
            if (roomsDetails.admin == roomsDetails.users) {
                return roomsDetails.admin;
            }
        }

        // admin left - pick next use ras admin
        for (var k in roomsDetails.users) {
            var usersDetails = findUserById(roomsDetails.users[k].id);
            if (false !== usersDetails) {
                return usersDetails.id;
            }
        }
    }

    return false;
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