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
import PreviewRoomStore from '../stores/PreviewRoomStore.js';

import PreviewRoomActions from '../actions/PreviewRoomActions';
import RoomActions from '../actions/RoomActions';
import UserActions from '../actions/UserActions';
import StateMachine from '../controllers/StateMachine';
import StatesConstants from '../constants/StatesConstants';
import PreviewRoomConstants from '../constants/PreviewRoomConstants';

import RoomConstants from '../constants/RoomConstants';

import VotingStore from '../stores/VotingStore';
import VotingConstants from '../constants/VotingConstants';

import {List, ListItem} from 'material-ui/List';
import _ from 'underscore';
import Avatar from 'material-ui/Avatar';
import ActionDone from 'material-ui/svg-icons/action/done';
import ActionHourGlass from 'material-ui/svg-icons/action/hourglass-empty';
import ActionEventSeat from 'material-ui/svg-icons/action/event-seat';
import {blue100, orange400, lime500, grey400} from 'material-ui/styles/colors';
import DevFuze from '../components/DevFuze';

const styles = {
    paper: {
        padding: 20,
        marginBottom: 10,
        textAlign: 'left'
    },
    button: {
        width: '100%'
    },
    text_input: {
        width: '100%'
    },
    paper_users_list: {
        textAlign: 'left'
    },
    paper_users_list_box: {
        paddingTop: '3%',
        paddingLeft: 20,
        height: '100%',
        textAlign: 'left'
    },

    users_list_status_icon: {
        float: 'right',
        fontSize: '1.5em'
    },
    paper_bottom_nav: {
        marginBottom: 10,
        padding: 20,
        textAlign: 'left'
    },
    paper_bottom_nav_button: {
        width: '100%'
    },
    paper_footer: {
        marginBottom: 20,
        padding: 10
    },
    footer_container: {
        height: '100%',
        textAlign: 'center'
    }
};

const texts = {
    input_label_room_name: 'Room name',
    input_label_room_password: 'Room password',
    input_label_room_admin_password: 'Admin password',
    admin_name: 'room admin: ',
    save_button: 'Continue',
    box_title: 'Preview room',
    room_name_invalid: 'Invalid name...',
    connected_info: 'users connected: ',
    room_password_invalid: '...or password',
    voting_status: 'voting status: ',
    user_status: 'Users status',
    voting_status_text: {}
};
texts.voting_status_text[VotingConstants.STATUS_PENDING] = 'pending';
texts.voting_status_text[VotingConstants.STATUS_IN_PROCESS] = 'in_process';
texts.voting_status_text[VotingConstants.STATUS_FINISHED] = 'finished';

class PreviewRoom extends React.Component {
    constructor(props) {
        super(props);
        let roomDetails = PreviewRoomStore.getRoomDetails();

        this.state = {
            room_id: roomDetails.id,
            room_name: roomDetails.name,
            room_sequence: roomDetails.sequence,
            room_admin: roomDetails.admin,
            room_users: roomDetails.users,
            voting_status: roomDetails.voting_status,
            users_already_voted: VotingStore.getUsersAlreadyVoted(),
            users_votes: VotingStore.getUsersVotes()
        };

        this.listeners = [];

        this.listeners = [
            PreviewRoomStore.registerListener(PreviewRoomConstants.EVENT_CHANGE_PREVIEW_ROOM_DETAILS, this.onRoomDetails.bind(this)),
            VotingStore.registerListener(VotingConstants.EVENT_USERS_ALREADY_VOTED, this.onChangeUsersAlreadyVoted.bind(this)),
            VotingStore.registerListener(VotingConstants.EVENT_USERS_VOTES, this.onChangeUsersVotes.bind(this))
        ];


        PreviewRoomActions.findRoomById(this.props.room_id);
    }

    componentWillUnmount() {
        for (let k in this.listeners) {
            if (undefined != this.listeners[k].deregister) {
                this.listeners[k].deregister()
            }
        }
    }

    onChangeUsersVotes() {
        this.setState({users_votes: VotingStore.getUsersVotes()});
    }

    onChangeUsersAlreadyVoted() {
        this.setState({users_already_voted: VotingStore.getUsersAlreadyVoted()});
    }

    onRoomDetails() {
        let roomDetails = PreviewRoomStore.getRoomDetails();
        this.setState({
            room_id: roomDetails.id,
            room_name: roomDetails.name,
            room_sequence: roomDetails.sequence,
            room_admin: roomDetails.admin,
            room_users: roomDetails.users,
            voting_status: roomDetails.voting_status
        });
    }

    renderStatusIcon(usersId) {
        if (VotingConstants.STATUS_IN_PROCESS === this.state.voting_status) {
            if (undefined != this.state.users_already_voted && -1 < this.state.users_already_voted.indexOf(usersId)) {
                return <ActionDone style={styles.users_list_status_icon} color={lime500}/>;
            } else {
                return <ActionHourGlass style={styles.users_list_status_icon} color={orange400}/>;
            }
        } else if (VotingConstants.STATUS_FINISHED === this.state.voting_status) {
            console.log(this.state.users_votes);
            if (undefined != this.state.users_votes[usersId]) {
                return <span style={styles.users_list_status_icon}><b>{this.state.users_votes[usersId]}</b></span>;
            } else {
                return <span style={styles.users_list_status_icon}><i>no vote</i></span>;
            }
        }

        return <ActionEventSeat style={styles.users_list_status_icon} color={blue100}/>;
    }

    render() {
        return (
            <div>
                <div className="row center-xs">
                    <div className="col-xs-12  col-sm-6  col-md-4">
                        <div className="box">
                            <center>
                                <Paper style={styles.paper} zDepth={1}>
                                    <h4>{texts.box_title}: {this.state.room_name}</h4>
                                    <p>
                                        users in room:
                                        <b>{Object.keys(this.state.room_users).length}</b>
                                    </p>
                                    <p>
                                        {texts.admin_name}
                                        <b>{
                                            undefined != this.state.room_users[this.state.room_admin]
                                                ? this.state.room_users[this.state.room_admin].name
                                                : 'unknown'
                                        }</b>
                                    </p>
                                    <p>
                                        {texts.connected_info}
                                        <b>{Object.keys(this.state.room_users).length}</b>
                                    </p>
                                    <p>
                                        {texts.voting_status}
                                        <b>{texts.voting_status_text[this.state.voting_status]}</b>
                                    </p>
                                </Paper>
                            </center>
                        </div>
                        <div className="box">
                            <Paper style={styles.paper_bottom_nav} zDepth={1}>
                                <Link to={StatesConstants.WELCOME}>
                                    <RaisedButton style={styles.paper_bottom_nav_button} secondary={true} label="Back to main page" />
                                </Link>
                            </Paper>
                        </div>
                        <div className="box">
                            <center>
                                <Paper style={styles.paper_footer} zDepth={1}>
                                    <div style={styles.footer_container}>
                                        Brought to you by <DevFuze />
                                    </div>
                                </Paper>
                            </center>
                        </div>
                    </div>
                    <div className="col-xs-12  col-sm-6  col-md-4">
                        <div className="box">
                            <Paper style={styles.paper_users_list} zDepth={1}>
                                <div style={styles.paper_users_list_box}>
                                    <h4>{texts.user_status}</h4>
                                </div>
                                <List>
                                    {_.toArray(this.state.room_users).map(function (element) {
                                        return (
                                            <ListItem
                                                key={element.id}
                                                primaryText={undefined === element.name ? '...' : element.name}
                                                leftAvatar={<Avatar src="" />}>
                                                { this.renderStatusIcon(element.id) }
                                            </ListItem>
                                        )
                                    }.bind(this))}
                                </List>
                            </Paper>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default PreviewRoom;