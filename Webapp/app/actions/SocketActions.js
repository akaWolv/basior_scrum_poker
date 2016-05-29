import AppDispatcher from '../dispatcher/AppDispatcher';
import SocketConstants from '../constants/SocketConstants';

var SocketActions = {
    emitRegisterUser: function(userDetails) {
        AppDispatcher.handleViewAction(SocketConstants.ACTION_EMIT_REGISTER_USER, {user_details: userDetails});
    },
    emitRegisterUserById: function(id) {
        AppDispatcher.handleViewAction(SocketConstants.ACTION_EMIT_REGISTER_USER_BY_ID, {id});
    },
    emitCreateNewRoom: function(name, password, admin_password, sequence) {
        AppDispatcher.handleViewAction(SocketConstants.ACTION_EMIT_CREATE_NEW_ROOM, {name, password, admin_password, sequence});
    },
    emitJoinRoomByName: function(name, password) {
        AppDispatcher.handleViewAction(SocketConstants.ACTION_EMIT_JOIN_ROOM_BY_NAME, {name, password});
    },
    emitJoinRoomById: function(id) {
        AppDispatcher.handleViewAction(SocketConstants.ACTION_EMIT_JOIN_ROOM_BY_ID, {id});
    },
    emitForgetAboutLastVisitedRoom: function() {
        AppDispatcher.handleViewAction(SocketConstants.ACTION_EMIT_FORGET_ABOUT_LAST_VISITED_ROOM);
    },
};

module.exports = SocketActions;