'use strict';

import React from 'react';
import { Link } from 'react-router'

import {CardHeader, CardText} from 'material-ui/Card';
import RaisedButton from 'material-ui/RaisedButton';
import Paper from 'material-ui/Paper';
import TextField from 'material-ui/TextField';
import SelectField from 'material-ui/SelectField';
import MenuItem from 'material-ui/MenuItem';
import Cookies from 'cookies-js';

import UserStore from '../stores/UserStore.js';
import UserActions from '../actions/UserActions';
import UserConstants from '../constants/UserConstants';
import StatesConstants from '../constants/StatesConstants';
import StateMachine from '../controllers/StateMachine';
import BackBox from '../components/BackBox.jsx';

const styles = {
    paper: {
        height: 350,
        marginBottom: 10,
        padding: 20
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
    box_title: 'Login details',
    input_label_user_name: 'Name',
    input_label_user_password: 'Password',
    input_label_user_password_confirm: 'Confirm password',
    user_name_invalid: 'Invalid name',
    user_password_invalid: 'Invalid password',
    user_password_confirm_invalid: 'Paswords not match',
    save_button: 'Continue'
};

class UserDetails extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            user_name:  '',
            user_password:  '',
            user_name_valid: true,
            user_password_valid: true
        };
        this.listeners = {};
    }

    componentWillUnmount() {
        for (let k in this.listeners) {
            if (undefined != this.listeners[k].deregister) {
                this.listeners[k].deregister();
            }
        }
    }

    onUserNotFound() {
        this.setState({user_name_valid: false, user_password_valid: false});
    }

    collectInputValue(event) {
        let stateToSet = {};
        stateToSet[event.target.name] = event.target.value;
        stateToSet.user_name_valid = true;
        stateToSet.user_password_valid = true;
        this.setState(stateToSet);
    }

    handleLogin() {
        var stateToSet = {};

        stateToSet.user_name_valid = this.state.user_name.length > 0;
        stateToSet.user_password_valid = this.state.user_password.length > 0;

        if (false === stateToSet.user_name_valid || false === stateToSet.user_password_valid) {
            this.setState(stateToSet);
        } else {
            if (undefined == this.listeners.user_registered) {
                this.listeners.user_registered = UserStore.registerListener(UserConstants.EVENT_USER_REGISTERED, this.onUserRegistered.bind(this));
            }
            if (undefined == this.listeners.not_found) {
                this.listeners.not_found = UserStore.registerListener(UserConstants.EVENT_USER_NOT_FOUND, this.onUserNotFound.bind(this));
            }
            UserActions.registerUserByNameAndPassword(this.state.user_name, this.state.user_password);
        }
    }
    onUserRegistered() {
        StateMachine.changeState(StatesConstants.WELCOME_USER);
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
                                            floatingLabelText={texts.input_label_user_name}
                                            hintText={texts.input_label_user_name}
                                            style={styles.text_input}
                                            name="user_name"
                                            value={this.state.user_name}
                                            onChange={this.collectInputValue.bind(this)}
                                            errorText={this.state.user_name_valid ? '' : texts.user_name_invalid} />
                                        <TextField
                                            floatingLabelText={texts.input_label_user_password}
                                            hintText={texts.input_label_user_password}
                                            style={styles.text_input}
                                            name="user_password"
                                            type="password"
                                            value={this.state.user_password}
                                            onChange={this.collectInputValue.bind(this)}
                                            errorText={this.state.user_password_valid ? '' : texts.user_password_invalid} />
                                    </div>
                                    <RaisedButton
                                        label={texts.save_button}
                                        primary={true}
                                        style={styles.button}
                                        onClick={this.handleLogin.bind(this)} />
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

export default UserDetails;