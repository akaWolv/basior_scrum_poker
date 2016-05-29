import AppDispatcher from '../dispatcher/AppDispatcher';
import RoomConstants from '../constants/RoomConstants';

var RoomActions = {
    create: function(details) {
        AppDispatcher.handleViewAction(RoomConstants.ACTION_CREATE_NEW_ROOM, details);
    },

    joinRoomByNameAndPassword: function(name, password) {
        AppDispatcher.handleViewAction(RoomConstants.ACTION_JOIN_ROOM_BY_NAME_AND_PASSWORD, {name, password});
    },
    leaveRoom: function(id) {
        AppDispatcher.handleViewAction(RoomConstants.ACTION_LEAVE_ROOM, {id: id});
    },
    joinRoomById: function(id) {
        AppDispatcher.handleViewAction(RoomConstants.ACTION_JOIN_ROOM_BY_ID, {id: id});
    },
};

export default RoomActions;