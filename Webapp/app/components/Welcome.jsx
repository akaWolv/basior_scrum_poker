'use strict';

import React from 'react';
import { Link } from 'react-router'

import {CardHeader, CardText} from 'material-ui/Card';
import RaisedButton from 'material-ui/RaisedButton';
import Paper from 'material-ui/Paper';
import Cookies from 'cookies-js';
import UserActions from '../actions/UserActions';
import UserStore from '../stores/UserStore';
import UserConstants from '../constants/UserConstants';
import StateMachine from '../controllers/StateMachine';
import StatesConstants from '../constants/StatesConstants';
import Footer from '../components/Footer';


const styles = {
    paper_welcome: {
        marginBottom: 20,
        padding: 20
    },
    text_box_welcome: {
        height: '100%',
        textAlign: 'justify'
    },
    button_welcome: {
        width: '100%',
        marginTop: 15,
        marginBottom: 15
    }
};

const texts = {
    button_new_user: 'New user details',
    button_existing_user: 'Use existing details',
    button_continue_as_part_1: 'Continue as ',
    button_spectate: 'Spectate',
    welcome_header: 'Scrum Poker (by basior.net)',
    welcome_text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla pretium, lorem id imperdiet.',
    info: '<b>Planning poker</b>, also called <b>Scrum poker</b>, is a consensus-based, gamified technique for estimating, ' +
    'mostly used to estimate effort or relative size of development goals in software development. <br /><br />In planning poker, ' +
    'members of the group make estimates by playing numbered cards face-down to the table, instead of speaking them aloud. ' +
    'The cards are revealed, and the estimates are then discussed. <br /><br />By hiding the figures in this way, the group can avoid the ' +
    'cognitive bias of anchoring, where the first number spoken aloud sets a precedent for subsequent estimates.' +
    '<br /><br />source <a href="https://en.wikipedia.org/wiki/Planning_poker" target="_blank"><i>Wikipedia</i></a>'
};

class Welcome extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            user_name: UserStore.getUserName()
        };

        this.listeners = {};
        this.listeners.user_details = UserStore.registerListener(UserConstants.EVENT_USER_DETAILS, this.onChangeUserDetails.bind(this));
    }

    componentWillUnmount() {
        for (let k in this.listeners) {
            if (undefined != this.listeners[k].deregister) {
                this.listeners[k].deregister()
            }
        }
    }

    onChangeUserDetails() {
        this.setState({user_name: UserStore.getUserName()});
    }

    handleContinueAs() {
        if (undefined == this.listeners.user_registered) {
            this.listeners.user_registered = UserStore.registerListenerOnce(UserConstants.EVENT_USER_REGISTERED, this.onUserRegistered.bind(this));
        }
        UserActions.registerUserById(UserStore.getUserId());
    }

    onUserRegistered() {
        StateMachine.changeState(StatesConstants.WELCOME_USER);
        UserStore.removeListener(UserConstants.EVENT_USER_REGISTERED, this.onUserRegistered.bind(this));
    }

    render() {
        return (
            <div>
                <div className="row center-xs">
                    <div className="col-xs-12  col-sm-6  col-md-4">
                        <div className="box">
                            <Paper style={styles.paper_welcome} zDepth={1}>
                                <div style={styles.text_box_welcome}>
                                    <h4>{texts.welcome_header}</h4>
                                </div>
                            </Paper>
                        </div>
                    </div>
                </div>
                <div className="row center-xs">
                    <div className="col-xs-12  col-sm-6  col-md-4">
                        <div className="box-row">
                            <center>
                                <Paper style={styles.paper_welcome} zDepth={1}>
                                    <Link to={'/user_details'}>
                                        <RaisedButton label={texts.button_new_user} primary={true}
                                                      style={styles.button_welcome}/>
                                    </Link>
                                    <Link to={'/login_user'}>
                                        <RaisedButton label={texts.button_existing_user} primary={true}
                                                      style={styles.button_welcome}/>
                                    </Link>
                                    {
                                        undefined != this.state.user_name
                                            ?
                                            <RaisedButton
                                                label={texts.button_continue_as_part_1 + this.state.user_name}
                                                primary={true} style={styles.button_welcome}
                                                onClick={this.handleContinueAs.bind(this)}/>
                                            :
                                            ''
                                    }
                                    <Link to={StatesConstants.PREVIEW_ROOM}>
                                        <RaisedButton label={texts.button_spectate} primary={true}
                                                      style={styles.button_welcome}/>
                                    </Link>
                                </Paper>
                            </center>
                        </div>
                    </div>
                </div>
                <div className="row center-xs">
                    <div className="col-xs-12  col-sm-6  col-md-4">
                        <div className="box">
                            <center>
                                <Paper style={styles.paper_welcome} zDepth={1}>
                                    <div style={styles.text_box_welcome}>
                                        <p dangerouslySetInnerHTML={{__html: texts.info}} ></p>
                                    </div>
                                </Paper>
                            </center>
                        </div>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }
}

export default Welcome;