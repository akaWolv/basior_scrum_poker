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

import PreviewRoomStore from '../stores/PreviewRoomStore';
import PreviewRoomActions from '../actions/PreviewRoomActions';
import UserActions from '../actions/UserActions';
import StateMachine from '../controllers/StateMachine';
import StatesConstants from '../constants/StatesConstants';

import PreviewRoomConstants from '../constants/PreviewRoomConstants';
import BackBox from '../components/BackBox.jsx';

const styles = {
    paper: {
        height: 350,
        padding: 20,
        marginBottom: 10
    },
    paper_footer: {
        marginTop: 10,
        padding: 20,
        textAlign: 'left'
    },
    button: {
        width: '100%'
    },
    form_box: {
        height: '80%',
        width: '100%',
        textAlign: 'left'
    },
    text_input: {
        width: '100%'
    },
    select_input: {
        width: '100%',
        marginTop: 20
    },
    hint_under_select: {
        color: '#bbb',
        textAlign: 'center',
        fontSize: '0.8em',
        marginTop: 5
    }
};

const texts = {
    input_label_room_name: 'Room name',
    input_label_room_password: 'Room password',
    input_label_room_admin_password: 'Admin password',
    save_button: 'Continue',
    box_title: 'Preview room',
    room_name_invalid: 'Invalid name...',
    room_password_invalid: '...or password'
};

class PreviewRoom extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            room_name: '',
            room_password: '',
            room_name_valid: true,
            room_password_valid: true,
            room_id: undefined
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

    onFoundRoom() {
        this.props.onRoomFound(PreviewRoomStore.getRoomId());
        StateMachine.changeState(StatesConstants.PREVIEW_ROOM + '/' + PreviewRoomStore.getRoomId());
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
        if (undefined == this.listeners.room_conneted) {
            this.listeners.room_conneted = PreviewRoomStore.registerListener(PreviewRoomConstants.EVENT_PREVIEW_ROOM_CONNECTED, this.onFoundRoom.bind(this));
        }

        if (undefined == this.listeners.not_found) {
            this.listeners.not_found = PreviewRoomStore.registerListener(PreviewRoomConstants.EVENT_PREVIEW_ROOM_NOT_FOUND, this.onRoomNotFound.bind(this));
        }

        PreviewRoomActions.findRoomByNameAndPassword(this.state.room_name, this.state.room_password);
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
                                        <p style={styles.hint_under_select}>{this.state.sequence_hint}</p>
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
                <BackBox backLink={StatesConstants.WELCOME} backText="Back to main page"/>
            </div>
        );
    }
}

export default PreviewRoom;