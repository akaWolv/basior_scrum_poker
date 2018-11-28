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

import RoomConstants from '../constants/RoomConstants';
import StateMachine from '../controllers/StateMachine';
import StatesConstants from '../constants/StatesConstants';
import BackBox from '../components/BackBox.jsx';

const styles = {
    paper: {
        padding: 20,
        height: 450,
        marginBottom: 20
    },
    button: {
        width: '100%'
    },
    form_box: {
        height: '85%',
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
        fontSize: '0.8em',
        marginTop: 5
    }
};

const texts = {
    input_label_room_name: 'Room name',
    input_label_room_password: 'Password',
    save_button: 'Continue',
    room_name_invalid: 'Invalid name',
    room_password_invalid: 'Invalid password',
    box_title: 'Create new room'
};

class CreateRoom extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            room_name:  '',
            room_password:  '',
            sequence:  props.available_sequences[0].value,
            room_name_valid: true,
            room_password_valid: true,
            sequence_hint:  props.available_sequences[0].hint
        };
        this.listeners = {};
    }

    onJoinedRoom() {
        StateMachine.changeState(StatesConstants.ROOM);
    }

    componentWillUnmount() {
        for (let k in this.listeners) {
            if (undefined != this.listeners[k].deregister) {
                this.listeners[k].deregister()
            }
        }
    }

    collectInputValue(event) {
        let stateToSet = {};
        stateToSet[event.target.name] = event.target.value;
        stateToSet.room_name_valid = true;
        stateToSet.room_password_valid = true;
        this.setState(stateToSet);
    }

    handleSequenceChange(event, index, sequence) {
        let sequence_hint = '';

        for (let k in this.props.available_sequences) {
            if (sequence == this.props.available_sequences[k].value) {
                sequence_hint = this.props.available_sequences[k].hint;
                break;
            }
        }

        this.setState({sequence, sequence_hint});
    }

    handleSave() {
        var stateToSet = {};

        stateToSet.room_name_valid = this.state.room_name.length > 0;
        stateToSet.room_password_valid = this.state.room_password.length > 0;

        if (false === stateToSet.room_name_valid || false === stateToSet.room_password_valid) {
            this.setState(stateToSet);
        } else {
            if (undefined == this.listeners.join_room) {
                this.listeners.join_room = RoomStore.registerListener(RoomConstants.EVENT_JOINED_ROOM, this.onJoinedRoom.bind(this));
            }

            RoomActions.create({
                name: this.state.room_name,
                password: this.state.room_password,
                sequence: this.state.sequence
            });
        }

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
                                            value={this.state.room_password}
                                            onChange={this.collectInputValue.bind(this)}
                                            errorText={this.state.room_password_valid ? '' : texts.room_password_invalid} />
                                        <SelectField
                                            name='sequence'
                                            disable={'disabled'}
                                            value={this.state.sequence}
                                            onChange={this.handleSequenceChange.bind(this)}
                                            style={styles.select_input} >
                                            {
                                                this.props.available_sequences.map(function (elem) {
                                                    return <MenuItem key={elem.value} value={elem.value} primaryText={elem.text} />;
                                                })
                                            }
                                        </SelectField>
                                        <p style={styles.hint_under_select}>{this.state.sequence_hint}</p>
                                    </div>
                                    <RaisedButton
                                        label={texts.save_button}
                                        primary={true}
                                        style={styles.button}
                                        onClick={this.handleSave.bind(this)} />
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
    router: function() { return React.PropTypes.func.isRequired; }
};
CreateRoom.defaultProps = {
    available_sequences: [
        {
            value: 'fibonacci-1-21',
            text: 'Fibbonacci 1-21',
            hint: '1, 3, 5, 8, 13, 21'
        }
    ]
};

export default CreateRoom;