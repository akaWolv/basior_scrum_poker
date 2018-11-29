'use strict';

import React from 'react';
import SocketSession from '../handlers/SocketSession'
import UserActions from '../actions/UserActions'
import UserStore from '../stores/UserStore';
import RoomStore from '../stores/RoomStore';
import UserConstants from '../constants/UserConstants';
import StatesConstants from '../constants/StatesConstants';
import RoomConstants from '../constants/RoomConstants';
import Cookies from 'cookies-js';
import { Router, Route, browserHistory, IndexRoute } from 'react-router'
import RoomActions from '../actions/RoomActions';

import Welcome from '../components/Welcome.jsx'
import WelcomeUser from '../components/WelcomeUser.jsx'
import UserDetails from '../components/UserDetails.jsx'
import LoginUser from '../components/LoginUser.jsx'
import PreviewRoom from '../components/PreviewRoom.jsx'
import CreateRoom from '../components/CreateRoom.jsx'
import JoinRoom from '../components/JoinRoom.jsx'
import Room from '../components/Room.jsx'
import Voting from '../components/default.jsx'
import Results from '../components/default.jsx'
import NoMatch from '../components/default.jsx'
import NoAccess from '../components/NoAccess.jsx'
import ConnectionProblem from '../components/ConnectionProblem.jsx'

const _statesHandlers = {
    Welcome: {register_user_only: false},
    UserDetails: {register_user_only: false},
    LoginUser: {register_user_only: false},
    WelcomeUser: {register_user_only: true},
    CreateRoom: {register_user_only: true},
    JoinRoom: {register_user_only: true},
    Room: {register_user_only: true},
    Voting: {register_user_only: true},
    Results: {register_user_only: true},
    NoMatch: {register_user_only: false},
    ConnectionProblem: {register_user_only: false},
};


var _pathList = [];
var _pathName = undefined;

class StateMachine extends React.Component {
    constructor(props) {
        console.log('state machine constructed');
        super(props);

        browserHistory.listen(function (ev) {
            _pathName = ev.pathname;
            _pathList.unshift(_pathName);
            _pathList.slice(0, 5);
        });

        if (!SocketSession.connected) {
            if (StateMachine.getCurrentPath() !== StatesConstants.CONNECTION_PROBLEM) {
                StateMachine.changeState(StatesConstants.CONNECTION_PROBLEM);
            }

            SocketSession.on('connect', function() {

                console.log(_pathList);
                if (undefined !== _pathList[1] && StatesConstants.CONNECTION_PROBLEM !== _pathList[1]) {
                    StateMachine.changeState(_pathList[1]);
                } else {
                    StateMachine.changeState(StatesConstants.WELCOME);
                }
            });
        }

        SocketSession.on('disconnect', function() {
            if (StateMachine.getCurrentPath() !== StatesConstants.CONNECTION_PROBLEM) {
                StateMachine.changeState(StatesConstants.CONNECTION_PROBLEM);
            }
        });

        SocketSession.on('introduce_yourself', function () {
            var usersId = Cookies.get('_userDetails.id');
            if (undefined != usersId) {
                UserActions.registerUserById(usersId);
            } else {
                console.log('introduce_yourself : unknown user - no details saved');
            }
        });

        SocketSession.on('register_user_fail', function() {
            alert('User unregistered.');

            UserActions.clearUserDetails();

            StateMachine.changeState(StatesConstants.WELCOME)
        });
    }

    static changeState(state) {
        browserHistory.push(state);
    }

    static checkAccess(handler) {
        if (
            undefined == _statesHandlers[handler.name]
            || false === _statesHandlers[handler.name].register_user_only
        ) {
            return handler;
        }

        return NoAccess;
    }

    static getCurrentPath() {
        return _pathName;
    }

    render() {
        return (
            <Router history={browserHistory}>
                <Route path={StatesConstants.MAIN} component={Welcome}/>
                <Route path={StatesConstants.WELCOME} component={Welcome}/>
                <Route path={StatesConstants.WELCOME_USER} component={WelcomeUser}/>
                <Route path={StatesConstants.WELCOME_USER + '/:terefere'} component={WelcomeUser}/>
                <Route path={StatesConstants.USER_DETAILS_RECONNECT} component={UserDetails}/>
                <Route path={StatesConstants.PREVIEW_ROOM} component={PreviewRoom}/>
                <Route path={StatesConstants.PREVIEW_ROOM_ID} component={PreviewRoom}/>
                <Route path={StatesConstants.USER_DETAILS} component={UserDetails}/>
                <Route path={StatesConstants.LOGIN_USER} component={LoginUser}/>
                <Route path={StatesConstants.CREATE_ROOM} component={CreateRoom}/>
                <Route path={StatesConstants.JOIN_ROOM} component={JoinRoom}/>
                <Route path={StatesConstants.JOIN_ROOM_RECONNECT} component={JoinRoom}/>
                <Route path={StatesConstants.ROOM} component={Room}/>
                <Route path={StatesConstants.VOTING} component={Voting}/>
                <Route path={StatesConstants.RESULTS} component={Results}/>
                <Route path={StatesConstants.CONNECTION_PROBLEM} component={ConnectionProblem}/>
                <Route path={StatesConstants.NO_MATCH} component={NoMatch}/>
            </Router>
        )
    }
}

export default StateMachine;