'use strict';

import React from 'react';
import { Link } from 'react-router'

import {CardHeader, CardText} from 'material-ui/Card';
import RaisedButton from 'material-ui/RaisedButton';
import Paper from 'material-ui/Paper';
import UserStore from '../stores/UserStore';
import RoomStore from '../stores/RoomStore';
import UserConstants from '../constants/UserConstants';
import UserActions from '../actions/UserActions';
import RoomActions from '../actions/RoomActions';
import RoomConstants from '../constants/RoomConstants';
import StateMachine from '../controllers/StateMachine';
import StatesConstants from '../constants/StatesConstants';
import BackBox from '../components/BackBox.jsx';
import Footer from '../components/Footer';

const styles = {
    paper_action: {
        height: 175,
        marginBottom: 10
    },
    text_box_action: {
        paddingTop: '3%',
        paddingLeft: 20,
        height: '60%',
        textAlign: 'left'
    },
    button_action: {
        width: '90%'
    },
    paper_header: {
        marginBottom: 10
    }
};

const texts = {
    user_hello_1: 'Hello ',
    user_hello_2: ',',
    welcome_header: 'Devfuze Scrum Poker'
};

class WelcomeUser extends React.Component {
    constructor(props) {
        super(props);

        StateMachine.checkAccess(WelcomeUser);

        this.state = {
            user_details: UserStore.getUserDetails(),
            room_details: RoomStore.getRoomDetails()
        };

        this.listeners = [
            UserStore.registerListener(UserConstants.EVENT_USER_DETAILS, this.onChangeUserDetails.bind(this)),
            RoomStore.registerListener(RoomConstants.EVENT_CHANGE_ROOM_DETAILS, this.onChangeRoomDetails.bind(this))
        ];
    }

    componentWillUnmount() {
        for (let k in this.listeners) {
            this.listeners[k].deregister();
        }
    }

    onChangeUserDetails() {
        console.log(UserStore.getUserDetails());
        this.setState({user_details: UserStore.getUserDetails()});
    }

    onChangeRoomDetails() {
        this.setState({room_details: RoomStore.getRoomDetails()});
    }

    handleRoomContinue() {
        this.listeners.push(
            RoomStore.registerListenerOnce(RoomConstants.EVENT_JOINED_ROOM, function () { StateMachine.changeState(StatesConstants.ROOM); })
        );

        if (undefined != this.state.room_details.id) {
            RoomActions.joinRoomById(this.state.room_details.id);
        }
    }

    handleRoomQuit() {
        RoomActions.leaveRoom(this.state.room_details.id);
    }

    render() {
        return (
            <div>
                <div className="row center-xs">
                    <div className="col-xs-12  col-sm-6  col-md-4">
                        <div className="box">
                            <center>
                                <Paper style={styles.paper_header} zDepth={1}>
                                    <div style={styles.text_box_action}>
                                        <h4>
                                            {texts.user_hello_1}
                                            {this.state.user_details.name}
                                            {texts.user_hello_2}
                                        </h4>
                                        <p>Nice to see you again!</p>
                                    </div>
                                </Paper>
                            </center>
                        </div>
                    </div>
                </div>
                <div className="row center-xs">
                    <div className="col-xs-12  col-sm-6  col-md-4">
                        <div className="box">
                            <center>
                                <Paper style={styles.paper_action} zDepth={1}>
                                    <div style={styles.text_box_action}>
                                        <h4>Create new room</h4>
                                        <p>Create and moderate new room.</p>
                                    </div>
                                    <Link to={'/create_room'}>
                                        <RaisedButton label="Create new room" primary={true}
                                                      style={styles.button_action}/>
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
                                <Paper style={styles.paper_action} zDepth={1}>
                                    <div style={styles.text_box_action}>
                                        <h4>Join room</h4>
                                        <p>Connect to already existing room.</p>
                                    </div>
                                    <Link to={'/join_room'}>
                                        <RaisedButton label="Join room" primary={true} style={styles.button_action}/>
                                    </Link>
                                </Paper>
                            </center>
                        </div>
                    </div>
                </div>
                {
                    undefined != this.state.user_details.room_id
                        ?
                        <div className="row center-xs">
                            <div className="col-xs-12  col-sm-6  col-md-4">
                                <div className="box">
                                    <center>
                                        <Paper style={styles.paper_action} zDepth={1}>
                                            <div style={styles.text_box_action}>
                                                <h4>Current room:
                                                    <i> {this.state.room_details.name}</i></h4>
                                                <p>Continue current session or quit?</p>
                                            </div>
                                            <div className="row center-xs">
                                                <div className="col-xs-6">
                                                    <RaisedButton label='Continue'
                                                                  onClick={this.handleRoomContinue.bind(this)}
                                                                  primary={true} style={styles.button_action}/>
                                                </div>
                                                <div className="col-xs-6">
                                                    <RaisedButton label="Finish session"
                                                                  onClick={this.handleRoomQuit.bind(this)}
                                                                  primary={true} style={styles.button_action}/>
                                                </div>
                                            </div>
                                        </Paper>
                                    </center>
                                </div>
                            </div>
                        </div>
                        : null
                }
                <BackBox backLink={StatesConstants.WELCOME} backText="Back to main page"/>
                <Footer />
            </div>
        );
    }
}

export default WelcomeUser;