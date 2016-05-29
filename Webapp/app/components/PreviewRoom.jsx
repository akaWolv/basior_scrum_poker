'use strict';

import React from 'react';
import { Link } from 'react-router'

import {CardHeader, CardText} from 'material-ui/Card';
import RaisedButton from 'material-ui/RaisedButton';
import Paper from 'material-ui/Paper';
import TextField from 'material-ui/TextField';
import SelectField from 'material-ui/SelectField';
import MenuItem from 'material-ui/MenuItem';
import RoomStore from '../stores/RoomStore';
import UserStore from '../stores/UserStore.js';

import RoomActions from '../actions/RoomActions';
import UserActions from '../actions/UserActions';
import StateMachine from '../controllers/StateMachine';
import StatesConstants from '../constants/StatesConstants';
import RoomConstants from '../constants/RoomConstants';

import PreviewRoomStore from '../stores/PreviewRoomStore';
import PreviewRoomActions from '../actions/PreviewRoomActions';
import PreviewRoomConstants from '../constants/PreviewRoomConstants';

import PreviewRoomLogin from '../components/PreviewRoomLogin.jsx';
import PreviewRoomSpectate from '../components/PreviewRoomSpectate.jsx';


class PreviewRoom extends React.Component {
    constructor(props, context) {
        super(props, context);
        this.state = {
            room_id: this.props.params.roomid
        };

        this.listeners = {};
        this.listeners.preview_room_not_found = PreviewRoomStore.registerListener(PreviewRoomConstants.EVENT_PREVIEW_ROOM_NOT_FOUND, this.onRoomNotFound.bind(this));
    }

    componentWillUnmount() {
        for (let k in this.listeners) {
            if (undefined != this.listeners[k].deregister) {
                this.listeners[k].deregister()
            }
        }
    }

    onRoomNotFound() {
        this.setState({room_id: undefined});
    }
    onRoomFound(room_id) {
        this.setState({room_id});
    }

    render() {
        return (
            undefined == this.state.room_id
            ? <PreviewRoomLogin onRoomFound={this.onRoomFound.bind(this)}/>
            : <PreviewRoomSpectate room_id={this.state.room_id} />
        );
    }
}

export default PreviewRoom;