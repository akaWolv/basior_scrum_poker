import AppDispatcher from '../dispatcher/AppDispatcher';
import { EventEmitter } from 'events';
import StoreMixin from '../mixins/StoreMixin';

import PreviewRoomConstants from '../constants/PreviewRoomConstants';
import SocketSession from '../handlers/SocketSession';

var _roomDetails = {
    id: undefined,
    name: undefined,
    sequence: undefined,
    admin: undefined,
    users: {},
    voting_status: undefined
};

var PreviewRoomStore = Object.assign({}, StoreMixin, EventEmitter.prototype, {

    getRoomDetails: function () {
        return _roomDetails;
    },
    getRoomId: function () {
        return _roomDetails.id;
    },

    dispatcherIndex: AppDispatcher.register(function (payload) {
        switch (payload.action) {
            case PreviewRoomConstants.ACTION_PREVIEW_ROOM_BY_ID:
                console.log({id: payload.details.id});
                SocketSession.emit('preview_room', {id: payload.details.id});
                break;
            case PreviewRoomConstants.ACTION_PREVIEW_ROOM_BY_NAME_AND_PASSWORD:
                SocketSession.emit('preview_room', {
                    name: payload.details.name,
                    password: payload.details.password
                });
                break;
        }

        return true;
    })

});

function updateRoomDetails(msg) {
    _roomDetails = {
        id: msg.id,
        name: msg.name,
        sequence: msg.sequence,
        admin: msg.admin,
        users: msg.users,
        voting_status: msg.voting_status
    };
}

SocketSession.on('room_details', function (msg) {
    updateRoomDetails(msg);
    PreviewRoomStore.emit(PreviewRoomConstants.EVENT_CHANGE_PREVIEW_ROOM_DETAILS);
});
SocketSession.on('preview_room_details', function (msg) {
    updateRoomDetails(msg);
    PreviewRoomStore.emit(PreviewRoomConstants.EVENT_CHANGE_PREVIEW_ROOM_DETAILS);
});

SocketSession.on('preview_room_connected', function (msg) {
    PreviewRoomStore.emit(PreviewRoomConstants.EVENT_PREVIEW_ROOM_CONNECTED);
});

SocketSession.on('preview_room_not_found', function () {
    console.log('preview_room_not_found');
    PreviewRoomStore.emit(PreviewRoomConstants.EVENT_PREVIEW_ROOM_NOT_FOUND);
});

SocketSession.on('preview_room_details', function (msg) {
    console.log('preview_room_details', msg);
});

export default PreviewRoomStore;