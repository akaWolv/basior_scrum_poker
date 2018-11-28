import AppDispatcher from '../dispatcher/AppDispatcher';
import { EventEmitter } from 'events';
import UserConstants from '../constants/UserConstants';
import uuid from 'uuid';
import RoomActions from '../actions/RoomActions';
import SocketSession from '../handlers/SocketSession'
import Cookies from 'cookies-js';
import StoreMixin from '../mixins/StoreMixin';

var _userDetails = {
    id: Cookies.get('_userDetails.id'),
    name: Cookies.get('_userDetails.name'),
    room_id: Cookies.get('_userDetails.room_id')
};

function clearUserDetails() {
    _userDetails.id = undefined;
    _userDetails.name = undefined;
    _userDetails.room_id = undefined;
    Cookies.expire('_userDetails.id');
    Cookies.expire('_userDetails.name');
    Cookies.expire('_userDetails.room_id');
    UserStore.emit(UserConstants.EVENT_USER_DETAILS);
}

var UserStore = Object.assign({}, StoreMixin, EventEmitter.prototype, {

    getUserId: function () {
        return _userDetails.id;
    },
    getUserName: function () {
        return _userDetails.name;
    },
    getRoomId: function () {
        return _userDetails.room_id;
    },

    getUserDetails: function () {
        return _userDetails;
    },

    dispatcherIndex: AppDispatcher.register(function (payload) {
        switch (payload.action) {
            case UserConstants.ACTION_REGISTER_USER_BY_ID:
                SocketSession.emit('register_existing_user', {id: payload.details.id});
                break;
            case UserConstants.ACTION_REGISTER_USER_BY_NAME_AND_PASSWORD:
                SocketSession.emit('register_existing_user', {name: payload.details.name, password: payload.details.password});
                break;
            case UserConstants.ACTION_REGISTER_NEW_USER:
                SocketSession.emit('register_new_user', {name: payload.details.name, password: payload.details.password});
                break;
            case UserConstants.ACTION_CLEAR_USER_DETAILS:
                clearUserDetails();
                break;

            case UserConstants.ACTION_FORGET_ABOUT_LAST_VISITED_ROOM:
                //SocketActions.emitForgetAboutLastVisitedRoom();
                SocketSession.emit('forget_about_last_visited_room', {});
                break;
            case UserConstants.ACTION_REQUEST_USER_DETAILS:
                SocketSession.emit('request_user_details', {id: payload.details.id});
                break;
        }

        return true;
    })
});

SocketSession.on('user_details', function (msg) {
    _userDetails.id = msg.id;
    _userDetails.name = msg.name;
    _userDetails.room_id = undefined != msg.room_id ? msg.room_id : undefined;

    Cookies
        .set('_userDetails.id', _userDetails.id)
        .set('_userDetails.name', _userDetails.name)
        .set('_userDetails.room_id', _userDetails.room_id);

    UserStore.emit(UserConstants.EVENT_USER_DETAILS);
});

SocketSession.on('user_not_found', function () {
    UserStore.emit(UserConstants.EVENT_USER_NOT_FOUND);
    clearUserDetails();
});

SocketSession.on('register_user_success', function () {
    UserStore.emit(UserConstants.EVENT_USER_REGISTERED);
});

SocketSession.on('register_user_already_exists', function () {
    UserStore.emit(UserConstants.EVENT_REGISTER_USER_ALREADY_EXISTS);
});

SocketSession.on('register_user_fail', function () {
    UserStore.emit(UserConstants.EVENT_USER_REGISTER_FAIL);
});

export default UserStore;