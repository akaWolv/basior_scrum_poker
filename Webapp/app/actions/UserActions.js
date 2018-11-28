import AppDispatcher from '../dispatcher/AppDispatcher';
import UserConstants from '../constants/UserConstants';

var UserActions = {
    registerUserById: function(id) {
        AppDispatcher.handleViewAction(UserConstants.ACTION_REGISTER_USER_BY_ID, {id});
    },
    registerUserByNameAndPassword: function(name, password) {
        AppDispatcher.handleViewAction(UserConstants.ACTION_REGISTER_USER_BY_NAME_AND_PASSWORD, {name, password});
    },
    registerNewUser: function(name) {
        AppDispatcher.handleViewAction(UserConstants.ACTION_REGISTER_NEW_USER, {name});
    },
    clearUserDetails: function(details) {
        AppDispatcher.handleViewAction(UserConstants.ACTION_CLEAR_USER_DETAILS, details);
    },
    forgetAboutLastVisitedRoom: function() {
        AppDispatcher.handleViewAction(UserConstants.ACTION_FORGET_ABOUT_LAST_VISITED_ROOM);
    }
};

export default UserActions;