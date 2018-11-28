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
import BackBox from '../components/BackBox.jsx';

const styles = {
    paper: {
        padding: 20,
        height: 350,
        marginBottom: 20
    },
    button: {
        width: '100%'
    },
    form_box: {
        height: '75%',
        width: '100%',
        textAlign: 'left'
    },
    text_input: {
        width: '100%'
    },
    select_input: {
        width: '100%',
        marginTop: 20
    }
};

const texts = {
    input_label_room_name: 'Room name',
    input_label_room_password: 'Room password',
    input_label_room_admin_password: 'Admin password',
    save_button: 'Continue',
    box_title: 'Join room',
    room_name_invalid: 'Invalid name...',
    room_password_invalid: '...or password'
};

class CreateRoom extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            room_name: '',
            room_password: '',
            room_name_valid: true,
            room_password_valid: true
        };

        this.listeners = {};
    }

    componentWillUnmount() {
        for (let k in this.listeners) {
            if (undefined != this.listeners[k].deregister) {
                this.listeners[k].deregister()
            }
        }
    }

    onJoinedRoom() {
        StateMachine.changeState(StatesConstants.ROOM);
    }

    onRoomNotFound() {
        this.setState({room_name_valid: false, room_password_valid: false});
    }

    collectInputValue(event) {
        let stateToSet = {};
        stateToSet[event.target.name] = event.target.value;
        stateToSet['room_name_valid'] = true;
        stateToSet['room_password_valid'] = true;
        this.setState(stateToSet);
    };

    handleJoin() {
        if (undefined == this.listeners.joined_room) {
            this.listeners.joined_room = RoomStore.registerListener(RoomConstants.EVENT_JOINED_ROOM, this.onJoinedRoom.bind(this));
        }

        if (undefined == this.listeners.not_found) {
            this.listeners.not_found = RoomStore.registerListener(RoomConstants.EVENT_ROOM_NOT_FOUND, this.onRoomNotFound.bind(this));
        }

        RoomActions.joinRoomByNameAndPassword(this.state.room_name, this.state.room_password);
    }

    render() {
        return (
            <div>
                <div className="row center-xs">
                    <div className="col-xs-12  col-sm-6  col-md-4">
                        <div className="box">
                            <center>
                                <Paper style={styles.paper} zDepth={1}>
                                    <div style={styles.form_box}>
                                        <h4>{texts.box_title}</h4>
                                        <TextField
                                            floatingLabelText={texts.input_label_room_name}
                                            hintText={texts.input_label_room_name}
                                            style={styles.text_input}
                                            name="room_name"
                                            value={this.state.room_name}
                                            onChange={this.collectInputValue.bind(this)}
                                            errorText={this.state.room_name_valid ? '' : texts.room_name_invalid} />
                                        <TextField
                                            floatingLabelText={texts.input_label_room_password}
                                            hintText={texts.input_label_room_password}
                                            style={styles.text_input}
                                            name="room_password"
                                            type="password"
                                            value={this.state.room_password}
                                            onChange={this.collectInputValue.bind(this)}
                                            errorText={this.state.room_name_valid ? '' : texts.room_password_invalid} />
                                    </div>
                                    <RaisedButton
                                        label={texts.save_button}
                                        primary={true}
                                        style={styles.button}
                                        onClick={this.handleJoin.bind(this)}/>
                                </Paper>
                            </center>
                        </div>
                    </div>
                </div>
                <BackBox backLink={StatesConstants.WELCOME_USER} backText="Back to dashboard"/>
            </div>
        );
    }
}

CreateRoom.contextTypes = {
    router: function () {
        return React.PropTypes.func.isRequired;
    }
};

export default CreateRoom;