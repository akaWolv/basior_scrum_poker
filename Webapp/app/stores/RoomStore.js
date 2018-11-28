import AppDispatcher from '../dispatcher/AppDispatcher';
import { EventEmitter } from 'events';
import RoomConstants from '../constants/RoomConstants';
import StoreMixin from '../mixins/StoreMixin';

// temporary defaults
import UserStore from '../stores/UserStore';
import SocketActions from '../actions/SocketActions';
import SocketSession from '../handlers/SocketSession'
import StateMachine from '../controllers/StateMachine'

var _roomDetails = {
    id: undefined,
    name: undefined,
    sequence: undefined,
    admin: undefined,
    users: {},
    voting_status: undefined,
    password: undefined
};

var RoomStore = Object.assign({}, StoreMixin, EventEmitter.prototype, {

    getRoomDetails: function () {
        return _roomDetails;
    },
    getRoomId: function () {
        return _roomDetails.id;
    },

    dispatcherIndex: AppDispatcher.register(function (payload) {
        switch (payload.action) {
            case RoomConstants.ACTION_CREATE_NEW_ROOM:
                SocketSession.emit('create_room', {
                    name: payload.details.name,
                    password: payload.details.password,
                    sequence: payload.details.sequence
                });
                break;
            case RoomConstants.ACTION_JOIN_ROOM_BY_NAME_AND_PASSWORD:
                SocketSession.emit('join_room_by_name_and_pass', {
                    name: payload.details.name,
                    password: payload.details.password
                });
                break;
            //case RoomConstants.ACTION_JOIN_ROOM_BY_ID:
            //    SocketSession.emit('join_room_by_id', {id: payload.details.id});
            //    break;
            case RoomConstants.ACTION_JOIN_ROOM_BY_ID:
                SocketSession.emit('join_room', {id: payload.details.id});
                break;
            case RoomConstants.ACTION_LEAVE_ROOM:
                SocketSession.emit('leave_room', {id: payload.details.id});
                break;
            case RoomConstants.ACTION_REQUEST_ROOM_DETAILS:
                SocketSession.emit('request_room_details', {id: payload.details.id});
                break;
            case RoomConstants.ACTION_SET_ADMIN:
                setAdmin();
                break;
        }

        return true;
    })

});

//SocketSession.on('create_new_room_success', function (msg) {
//    'function' == callback || callback(true, msg);
//});

SocketSession.on('create_new_room_fail', function () {
    alert('Create room error');
});


SocketSession.on('join_room_success', function () {
    RoomStore.emit(RoomConstants.EVENT_JOINED_ROOM);
});

SocketSession.on('join_room_fail', function () {
    alert('Error while joining room.');
});

SocketSession.on('room_not_found', function () {
    RoomStore.emit(RoomConstants.EVENT_ROOM_NOT_FOUND);
});

SocketSession.on('room_details', function (msg) {
    _roomDetails = {
        id: msg.id,
        name: msg.name,
        sequence: msg.sequence,
        admin: msg.admin,
        users: msg.users,
        voting_status: msg.voting_status,
        password: msg.password
    };

    RoomStore.emit(RoomConstants.EVENT_CHANGE_ROOM_DETAILS);
});

export default RoomStore;