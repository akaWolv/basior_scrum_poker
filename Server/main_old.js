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

const CREATE_NEW_ROOM = 'create_new_room';
const CONNECTION = 'connection';
const FORGET_ABOUT_LAST_VISITED_ROOM = 'forget_about_last_visited_room';
const JOIN_ROOM_BY_ID = 'join_room_by_id';
const JOIN_ROOM_BY_NAME = 'join_room_by_name';
const LEAVE_ROOM = 'leave_room';
const REGISTER_USER = 'register_user';
const REQUEST_USER_DETAILS = 'request_user_details';
const REQUEST_ROOM_DETAILS = 'request_room_details';
const START_NEW_VOTING = 'start_new_voting';
const FINISH_VOTING = 'finish_voting';
const CONTINUE_VOTING = 'continue_voting';
const VOTE = 'vote';

const EMIT_CREATE_NEW_ROOM_FAIL = 'create_new_room_fail';
const EMIT_CREATE_NEW_ROOM_SUCCESS = 'create_new_room_success';
const EMIT_INTRODUCE_YOURSELF = 'introduce_yourself';
const EMIT_JOIN_ROOM_FAIL = 'join_room_fail';
const EMIT_JOIN_ROOM_SUCCESS = 'join_room_success';
const EMIT_LEAVE_ROOM_FAIL = 'leave_room_fail';
const EMIT_LEAVE_ROOM_SUCCESS = 'leave_room_success';
const EMIT_REGISTER_USER_FAIL = 'register_user_fail';
const EMIT_REGISTER_USER_SUCCESS = 'register_user_success';
const EMIT_ROOM_DETAILS = 'room_details';
const EMIT_ROOM_NOT_EXISTS = 'room_not_exists';
const EMIT_USER_DETAILS = 'user_details';
const EMIT_USER_NOT_EXISTS = 'user_not_exists';
const EMIT_VOTING_STATUS_CHANGED = 'voting_status_changed';
const EMIT_VOTES_SHOW_VALUES = 'votes_show_values';
const EMIT_VOTES_HIDE_VALUES = 'votes_hide_values';
const EMIT_VOTES_STATUS_CHANGE = 'votes_status_change';

io.on(CONNECTION, function (socket) {

    socket.user_details = {
        id: undefined,
        name: undefined,
        user_logged_in: undefined,
        connected_to_room_id: undefined,
        last_visited_room: undefined
    };
    //socket.picked_team = undefined;
    //socket.user_name = undefined;
    //socket.user_email = undefined;
    //socket.admin_role = false;

    /**
     * REGISTER USER
     */
    socket.on(REGISTER_USER, function (msg) {
        if (undefined != msg.id) {
            if (true === registerExistingUser(msg.id)) {
                infoLog('USER REGISTERED', socket.user_details);
                _users[socket.user_details.id] = socket.user_details;
                socket.emit(EMIT_REGISTER_USER_SUCCESS, socket.user_details);
                return true;
            }
        }

        if (-1 == [msg.name].indexOf(undefined)) {
            if (true === registerNewUser(msg.name)) {
                infoLog('USER REGISTERED', socket.user_details);
                _users[socket.user_details.id] = socket.user_details;
                socket.emit(EMIT_REGISTER_USER_SUCCESS, socket.user_details);
                return true;
            }
        }

        infoLog('USER NOT REGISTERED', msg);
        socket.emit(EMIT_REGISTER_USER_FAIL);
        return false;
    });

    socket.on(FORGET_ABOUT_LAST_VISITED_ROOM, function () {
        socket.user_details.last_visited_room = undefined;
        socket.emit(EMIT_USER_DETAILS);
        socket.leave(channelNameRoomDetails(roomsId));
        infoLog('FORGOT ABOUT LAST VISITED ROOM');
        return true;
    });

    function registerExistingUser(uid) {
        if (undefined != _users[uid]) {
            socket.user_details.id = _users[uid].id;
            socket.user_details.name = _users[uid].name;
            socket.user_details.connected_to_room_id = _users[uid].connected_to_room_id;
            socket.user_details.last_visited_room = _users[uid].last_visited_room;
            return true;
        }
        return false;
    }

    function registerNewUser(name) {

        // clear user data
        socket.user_details = {};

        var uid = uuid.v4();
        if (undefined == _users[uid]) {
            socket.user_details.id = uid;
            socket.user_details.name = name;
            socket.user_details.connected_to_room_id = undefined;
            socket.user_details.last_visited_room = undefined;
            return true;
        }
        return false;
    }

    /**
     * CREATE NEW ROOM
     */
    socket.on(CREATE_NEW_ROOM, function (msg) {
        var errorMsg;
        if (undefined == socket.user_details.id) {
            errorMsg = 'Invalid user';
        } else if (-1 < [msg.name, msg.password, msg.admin_password, msg.sequence].indexOf(undefined)) {
            errorMsg = 'All fields should be provided';
        }

        if (undefined == errorMsg) {
            var roomsId = createNewRoom(msg.name, msg.password, msg.admin_password, msg.sequence, socket.user_details.id);
            if (false !== roomsId) {
                infoLog('NEW ROOM CREATED', _rooms[roomsId]);
                socket.emit(EMIT_CREATE_NEW_ROOM_SUCCESS, _rooms[roomsId]);

                if (true === joinRoom(roomsId, socket.user_details.id)) {
                    infoLog('ROOM JOINED AFTER CREATING IT', _rooms[socket.connected_to_room_id]);
                    socket.emit(EMIT_JOIN_ROOM_SUCCESS, _rooms[socket.user_details.connected_to_room_id]);
                    socket.emit(EMIT_USER_DETAILS, socket.user_details);
                } else {
                    infoLog('ROOM NOT JOINED BUT CREATED', msg);
                    socket.emit(EMIT_JOIN_ROOM_FAIL);
                }

                if (setRoomAdmin(roomsId, socket.user_details.id)) {
                    infoLog('ADMIN CHANGED', {rooms_id: socket.connected_to_room_id, users_id: socket.user_details.id});
                    socket
                        .to(channelNameRoomDetails(socket.user_details.connected_to_room_id))
                        .emit(EMIT_ROOM_DETAILS, socket.user_details.id);
                }
                return true;
            }
        }

        infoLog('NEW ROOM NOT CREATED', {errorMsg: errorMsg});
        socket.emit(EMIT_CREATE_NEW_ROOM_FAIL);
        return false;
    });

    function createNewRoom(name, password, admin_password, sequence, usersId) {
        var roomsId = uuid.v4();
        if (undefined == _rooms[roomsId]) {

            _rooms[roomsId] = {
                id: roomsId,
                name: name,
                password: password,
                admin_password: admin_password,
                sequence: sequence,
                users_roles: {admins: {}},
                users_connected: {}
            };
            return roomsId;
        }
        return false;
    }


    /**
     * JOIN ROOM
     */
    socket.on(JOIN_ROOM_BY_ID, function (msg) {
        if (undefined != msg.id && undefined != socket.user_details.id) {

            var roomDetails = findRoomById(msg.id);

            if (true === joinRoom(roomDetails.id, socket.user_details.id)) {

                infoLog('ROOM JOINED', _rooms[msg.id]);
                socket.emit(EMIT_JOIN_ROOM_SUCCESS, _rooms[socket.user_details.connected_to_room_id]);

                socket
                    .to(socket.user_details.connected_to_room_id)
                    .emit(EMIT_ROOM_DETAILS, _rooms[socket.user_details.connected_to_room_id].users_roles.admins);

                if (roomDetails.admin_password == msg.password && true === setRoomAdmin(roomDetails.id, socket.user_details.id)) {
                    infoLog('ADMIN CHANGED', {rooms_id: socket.connected_to_room_id, users_id: socket.user_details.id});
                }

                socket.emit(EMIT_USER_DETAILS, socket.user_details);

                return true;
            }
        }

        infoLog('ROOM NOT JOINED', msg);
        socket.emit(EMIT_JOIN_ROOM_FAIL);
        return false;
    });

    function findRoomById(roomsId) {
        for (var k in _rooms) {
            if (roomsId == _rooms[k].id) {
                return _rooms[k];
            }
        }
        return false;
    }

    socket.on(JOIN_ROOM_BY_NAME, function (msg) {

        var errorMsg;
        if (undefined != msg.name && undefined != msg.password && undefined != socket.user_details.id) {

            var roomDetails = findRoomByName(msg.name);

            if (false !== roomDetails) {
                if (roomDetails.password != msg.password || roomDetails.admin_password != msg.password) {
                    if (true === joinRoom(roomDetails.id, socket.user_details.id)) {

                        socket.to(socket.user_details.connected_to_room_id).emit(EMIT_ROOM_DETAILS, _rooms[socket.user_details.connected_to_room_id].users_roles.admins);

                        socket.emit(EMIT_USER_DETAILS, socket.user_details);

                        if (roomDetails.admin_password == msg.password && true === setRoomAdmin(roomDetails.id, socket.user_details.id)) {
                            infoLog('ADMIN CHANGED', {
                                rooms_id: socket.connected_to_room_id,
                                users_id: socket.user_details.id
                            });
                        }

                        infoLog('ROOM JOINED', _rooms[msg.id]);
                        socket.emit(EMIT_JOIN_ROOM_SUCCESS, roomDetails);

                        return true;
                    } else {
                        errorMsg = 'Cannot join room';
                    }
                } else {
                    errorMsg = 'Password not match';
                }
            } else {
                errorMsg = 'Room not found';
            }
        } else {
            errorMsg = 'Invalid data';
        }

        infoLog('ROOM NOT JOINED', {errorMsg: errorMsg});
        socket.emit(EMIT_JOIN_ROOM_FAIL);
        return false;
    });

    function findRoomByName(roomsName) {
        for (var k in _rooms) {
            if (roomsName == _rooms[k].name) {
                return _rooms[k];
            }
        }
        return false;
    }

    function joinRoom(roomsId, usersId) {
        if (undefined != _rooms[roomsId] && undefined != _users[usersId]) {
            // first - disconnect from previous room details voting
            if (undefined != socket.user_details.last_visited_room) {
                socket.leave(channelNameRoomVoting(socket.user_details.last_visited_room));
                socket.leave(channelNameRoomDetails(socket.user_details.last_visited_room));
            }
            // subscribe user to room
            _rooms[roomsId].users_connected[usersId] = {id: usersId, name: _users[usersId].name};
            // save room info in user
            _users[usersId].connected_to_room_id = roomsId;
            // save last visited room
            _users[usersId].last_visited_room = roomsId;
            // save room info in socket
            socket.user_details.connected_to_room_id = roomsId;
            // save last visited room
            _users[usersId].last_visited_room = roomsId;
            // join room socket for voting
            socket.join(channelNameRoomVoting(roomsId));
            // join room socket for details
            socket.join(channelNameRoomDetails(roomsId));

            return true;
        }
        return false;
    }

    function setRoomAdmin(roomsId, usersId) {
        if (undefined !== _rooms[roomsId]) {
            _rooms[roomsId].users_roles.admins[usersId] = usersId;
            return true;
        }
        return false;
    }

    function removeRoomAdmin(roomsId, usersId) {
        if (undefined !== _rooms[roomsId]) {
            delete _rooms[roomsId].users_roles.admins[usersId];
            return true;
        }
        return false;
    }


    /**
     * LEAVE ROOM
     */
    socket.on(LEAVE_ROOM, function (msg) {
        if (undefined != msg.id) {
            if (true === leaveRoom(msg.id, socket.user_details.id)) {

                infoLog('ROOM LEFT', _rooms[msg.id]);

                socket.emit(EMIT_LEAVE_ROOM_SUCCESS);

                if (true === removeRoomAdmin(msg.id, socket.user_details.id)) {
                    setNextUserAsRoomAdmin(msg.id);
                    infoLog('ADMIN CHANGED', {rooms_id: socket.connected_to_room_id, users_id: socket.user_details.id});
                }

                socket.emit(EMIT_USER_DETAILS, socket.user_details);

                socket
                    .to(channelNameRoomDetails(msg.id))
                    .emit(EMIT_ROOM_DETAILS, _rooms[msg.id]);

                return true;
            }
        }

        infoLog('ROOM NOT LEFT', msg);
        socket.emit(EMIT_LEAVE_ROOM_FAIL);
        return false;
    });

    function setNextUserAsRoomAdmin(roomsId) {
        if (undefined !== _rooms[roomsId] && 0 == _rooms[roomsId].users_roles.admins.length) {

            // no admin right now - set new
            for (var k in _rooms[roomsId].users_connected) break;

            if (undefined != _users[_rooms[roomsId].users_connected[k].id]) {
                setRoomAdmin(roomsId, _rooms[roomsId].users_connected[k].id);
                return true;
            }

            return false;
        }
    }

    function leaveRoom(roomsId, usersId) {
        if (undefined != _rooms[roomsId]) {
            // unsubscribe user from room
            delete _rooms[roomsId].users_connected[usersId];
        }

        if (undefined != _users[usersId]) {
            // remove room info in user
            _users[usersId].connected_to_room_id = undefined;
            // remove room info in socket
            socket.user_details.connected_to_room_id = undefined;
        }

        // leave room socket
        socket.leave(channelNameRoomVoting(roomsId));

        return true;
    }

    function channelNameRoomVoting(roomsId) {
        return 'roomVoting_' + roomsId;
    }

    function channelNameRoomDetails(roomsId) {
        return 'roomDetails_' + roomsId;
    }


    /**
     * VOTING ACTIONS
     */
    socket.on(START_NEW_VOTING, function (msg) {
        infoLog('REQUESTED START NEW VOTING');
        if (true === isAdmin()) {
            socket
                .to(channelNameRoomDetails(socket.user_details.connected_to_room_id))
                .emit(EMIT_VOTING_STATUS_CHANGED, 'voting started');
            socket
                .to(channelNameRoomVoting(socket.user_details.connected_to_room_id))
                .emit(EMIT_VOTING_STATUS_CHANGED, 'voting started');
            infoLog('VOTING STARTED');
        } else {
            infoLog('NOT AN ADMIN');
        }
    });

    socket.on(FINISH_VOTING, function (msg) {
        infoLog('REQUESTED FINISH VOTING');
        if (true === isAdmin()) {
            socket
                .to(channelNameRoomVoting(socket.user_details.connected_to_room_id))
                .emit(EMIT_VOTING_STATUS_CHANGED, 'voting finished');
            infoLog('VOTING FINISHED');
        } else {
            infoLog('NOT AN ADMIN');
        }
    });

    socket.on(CONTINUE_VOTING, function (msg) {
        infoLog('REQUESTED CONTINUE VOTING');
        if (true === isAdmin()) {
            socket
                .to(channelNameRoomVoting(socket.user_details.connected_to_room_id))
                .emit(EMIT_VOTING_STATUS_CHANGED, 'voting continued');
            infoLog('VOTING CONTINUED');
        } else {
            infoLog('NOT AN ADMIN');
        }
    });

    socket.on(VOTE, function (msg) {
        infoLog('VOTE');
    });

    function isAdmin() {
        var roomDetails = findRoomById(socket.user_details.connected_to_room_id);
        return undefined != roomDetails.users_roles.admins[socket.user_details.id];
    }


    /**
     * REQUEST DETAILS
     */
    socket.on(REQUEST_USER_DETAILS, function (msg) {
        infoLog('USER DETAILS REQUESTED');
        if (undefined != msg.id) {
            infoLog('USER DETAILS SEND');
            var userDetails = findUserById(msg.id);

            if (undefined == userDetails.connected_to_room_id || false === findRoomById(userDetails.connected_to_room_id)) {
                userDetails.connected_to_room_id = undefined;
            }

            if (undefined == userDetails.last_visited_room || false === findRoomById(userDetails.last_visited_room)) {
                userDetails.last_visited_room = undefined;
            }

            if (false !== userDetails) {
                socket.emit(EMIT_USER_DETAILS, userDetails);
            } else {
                socket.emit(EMIT_USER_NOT_EXISTS, {id: msg.id});
            }
        }
    });

    socket.on(REQUEST_ROOM_DETAILS, function (msg) {
        infoLog('ROOM DETAILS REQUESTED', msg);
        if (undefined != msg.id) {
            infoLog('ROOM DETAILS SEND');
            var roomDetails = findRoomById(msg.id);
            if (false !== roomDetails) {
                socket.emit(EMIT_ROOM_DETAILS, roomDetails);
            } else {
                socket.emit(EMIT_ROOM_NOT_EXISTS, {id: msg.id});
            }
        }
    });

    function findUserById(usersId) {
        for (var k in _users) {
            if (usersId == _users[k].id) {
                return _users[k];
            }
        }
        return false;
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


http.listen(3003, function () {
    console.log('listening on *:3003');
});