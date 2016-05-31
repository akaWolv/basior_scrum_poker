import React from 'react';
import { Link } from 'react-router'
import RoomStore from '../stores/RoomStore';
import Paper from 'material-ui/Paper';

import RoomVotingPanel from '../components/RoomVotingPanel';

import RoomConstants from '../constants/RoomConstants';
import RoomAction from '../actions/RoomActions';
import VotingConstants from '../constants/VotingConstants';
import StatesConstants from '../constants/StatesConstants';
import UserStore from '../stores/UserStore';
import VotingStore from '../stores/VotingStore';
import VotingAction from '../actions/VotingActions';

import Avatar from 'material-ui/Avatar';
import {List, ListItem} from 'material-ui/List';
import Subheader from 'material-ui/Subheader';
import Divider from 'material-ui/Divider';
import ActionDone from 'material-ui/svg-icons/action/done';
import ActionHourGlass from 'material-ui/svg-icons/action/hourglass-empty';
import ActionEventSeat from 'material-ui/svg-icons/action/event-seat';
import {pink900, blue100, orange400, lime600, grey400} from 'material-ui/styles/colors';

import RaisedButton from 'material-ui/RaisedButton';
import _ from 'underscore';
import Footer from '../components/Footer';
import BackBox from '../components/BackBox.jsx';

const styles = {
    paper_info: {
        marginBottom: 10,
        textAlign: 'left'
    },
    text_box_info: {
        padding: 20,
        height: '100%',
        textAlign: 'left'
    },
    text_box_info_details: {
        fontSize: '.8em'
    },

    paper_users_list: {
        textAlign: 'left',
        marginBottom: 10
    },
    paper_users_list_box: {
        paddingTop: 20,
        paddingLeft: 20,
        paddingRight: 20,
        paddingBottom: 0,
        height: '100%',
        textAlign: 'left'
    },

    users_list_status_icon: {
        float: 'right',
        fontSize: '1.5em'
    },

    no_voting_header: {
        textAlign: 'center',
        color: grey400
    },

    admin_box: {
        padding: 20,
        backgroundColor: pink900,
        marginBottom: 10
    },
    admin_panel_header: {
        textAlign: 'left'
    },
    admin_panel_button: {
        width: '100%'
    }
};

const texts = {
    header: 'Room: ',
    admin_name: 'room admin: ',
    voting_status: 'voting status: ',
    voting_status_text: {},
    connected_info: 'users connected: ',
    user_status: 'Users votes',
    start_new_voting: 'Start new voting',
    stop_voting: 'End voting',
    finish_voting: 'Finish and show values',
    continue_voting: 'Continue voting',
    admin_panel_header: 'Admin control'
};

texts.voting_status_text[VotingConstants.STATUS_PENDING] = 'pending';
texts.voting_status_text[VotingConstants.STATUS_IN_PROCESS] = 'in_process';
texts.voting_status_text[VotingConstants.STATUS_FINISHED] = 'finished';

class Room extends React.Component {
    constructor(props, context) {
        super(props, context);

        let roomDetails = RoomStore.getRoomDetails();

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

        this.listeners = [
            RoomStore.registerListener(RoomConstants.EVENT_CHANGE_ROOM_DETAILS, this.onChangeRoomDetails.bind(this)),
            VotingStore.registerListener(VotingConstants.EVENT_USERS_ALREADY_VOTED, this.onChangeUsersAlreadyVoted.bind(this)),
            VotingStore.registerListener(VotingConstants.EVENT_USERS_VOTES, this.onChangeUsersVotes.bind(this))
        ];
    };

    componentWillUnmount() {
        for (let k in this.listeners) {
            this.listeners[k].deregister();
        }
    }

    onChangeUsersVotes() {
        this.setState({users_votes: VotingStore.getUsersVotes()});
    }

    onChangeUsersAlreadyVoted() {
        this.setState({users_already_voted: VotingStore.getUsersAlreadyVoted()});
    }

    onChangeRoomDetails() {
        let roomDetails = RoomStore.getRoomDetails();

        this.detectAdminChange(this.state.room_admin, roomDetails.admin);

        this.setState({
            room_id: roomDetails.id,
            room_name: roomDetails.name,
            room_sequence: roomDetails.sequence,
            room_admin: roomDetails.admin,
            room_users: roomDetails.users,
            voting_status: roomDetails.voting_status
        });
    }

    detectAdminChange(oldValue, newValue) {
        console.log(oldValue, newValue, UserStore.getUserId());
        console.log((oldValue != newValue && newValue == UserStore.getUserId()));
        if (undefined != oldValue && oldValue != newValue && newValue == UserStore.getUserId()) {
            alert('You are admin now!');
        }
    }

    handleStartNewVotingButton() {
        VotingAction.startNewVoting();
    }

    handleFinishVoting() {
        VotingAction.finishVoting();
    }

    handleStopVoting() {
        VotingAction.stopVoting();
    }

    handleContinueVoting() {
        VotingAction.continueVoting();
    }

    renderVotingStatusHints() {
        switch (this.state.voting_status) {
            case VotingConstants.STATUS_PENDING:
                return <p>Start collecting users votes.</p>;
            case VotingConstants.STATUS_IN_PROCESS:
                var votes = Object.keys(this.state.users_already_voted).length,
                    users = Object.keys(this.state.room_users).length;
                return <p>Voting status (<span style={{color: votes != users ? orange400 : lime600}}>votes: <b>{votes}</b> / users: <b>{users}</b></span>)</p>;
            case VotingConstants.STATUS_FINISHED:
                return <p>Continue current voting or finalize it.</p>;
        }
    }

    renderAdminPanel() {
        if (this.state.room_admin == UserStore.getUserId()) {
            return (
                <Paper style={styles.paper_info} zDepth={1}>
                    <div style={styles.admin_box}>
                        <h4 style={styles.admin_panel_header}>
                            {texts.admin_panel_header}
                        </h4>
                        { this.renderVotingStatusHints() }
                        { this.renderAdminPanelButtons() }
                    </div>
                </Paper>
            )
        } else {
            return null;
        }
    }

    renderAdminPanel2() {
        if (this.state.room_admin == UserStore.getUserId() && VotingConstants.STATUS_IN_PROCESS === this.state.voting_status) {
            return (
                <Paper style={styles.paper_info} zDepth={1}>
                    <div style={styles.admin_box}>
                        <div className="row center-xs">
                            <div className="col-xs-12">
                                <RaisedButton
                                    label={texts.finish_voting}
                                    primary={true}
                                    style={styles.admin_panel_button}
                                    onClick={this.handleFinishVoting.bind(this)}/>
                            </div>
                        </div>
                    </div>
                </Paper>
            )
        } else {
            return null;
        }
    }

    renderAdminPanelButtons() {
        switch (this.state.voting_status) {
            case VotingConstants.STATUS_PENDING:
                return (
                    <div className="row center-xs">
                        <div className="col-xs-12">
                            <RaisedButton
                                label={texts.start_new_voting}
                                primary={true}
                                style={styles.admin_panel_button}
                                onClick={this.handleStartNewVotingButton.bind(this)}/>
                        </div>
                    </div>
                );
            case VotingConstants.STATUS_IN_PROCESS:
                return (
                    <div className="row center-xs">
                        <div className="col-xs-12">
                            <RaisedButton
                                label={texts.finish_voting}
                                primary={true}
                                style={styles.admin_panel_button}
                                onClick={this.handleFinishVoting.bind(this)}/>
                        </div>
                    </div>
                );
            case VotingConstants.STATUS_FINISHED:
                return (
                    <div className="row center-xs">
                        <div className="col-xs-6">
                            <RaisedButton
                                label={texts.continue_voting}
                                primary={true}
                                style={styles.admin_panel_button}
                                onClick={this.handleContinueVoting.bind(this)}/>
                        </div>
                        <div className="col-xs-6">
                            <RaisedButton
                                label={texts.stop_voting}
                                primary={true}
                                style={styles.admin_panel_button}
                                onClick={this.handleStopVoting.bind(this)}/>
                        </div>
                    </div>
                );
        }
    }

    renderStatusIcon(usersId) {
        if (VotingConstants.STATUS_IN_PROCESS === this.state.voting_status) {
            if (undefined != this.state.users_already_voted && -1 < this.state.users_already_voted.indexOf(usersId)) {
                return <ActionDone style={styles.users_list_status_icon} color={lime600} />;
            } else {
                return <ActionHourGlass style={styles.users_list_status_icon} color={orange400} />;
            }
        } else if (VotingConstants.STATUS_FINISHED === this.state.voting_status) {
            console.log(this.state.users_votes);
            if (undefined != this.state.users_votes[usersId]) {
                return <span style={styles.users_list_status_icon}><b>{this.state.users_votes[usersId]}</b></span>;
            } else {
                return <span style={styles.users_list_status_icon}><i>no vote</i></span>;
            }
        }

        return <ActionEventSeat style={styles.users_list_status_icon} color={blue100} />;
    }

    render() {
        return (
            <div>
                <div className="row center-xs">
                    <div className="col-xs-12  col-sm-6  col-md-4">
                        <div className="box">
                            <Paper style={styles.paper_info} zDepth={1}>
                                <div style={styles.text_box_info}>
                                    <h4>{texts.header}{this.state.room_name}</h4>
                                    <div style={styles.text_box_info_details}>
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
                                    </div>
                                </div>
                            </Paper>
                        </div>
                    </div>
                </div>
                <div className="row center-xs">
                    <div className="col-xs-12  col-sm-6  col-md-4">
                        <div className="box">
                            {this.renderAdminPanel()}
                        </div>
                    </div>
                </div>
                <div className="row center-xs">
                    <div className="col-xs-12  col-sm-6  col-md-4">
                        <div className="box">
                            <RoomVotingPanel
                                voting_status={this.state.voting_status}/>
                        </div>
                    </div>
                </div>
                <div className="row center-xs">
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
                <div className="row center-xs">
                    <div className="col-xs-12  col-sm-6  col-md-4">
                        <div className="box">
                            {this.renderAdminPanel2()}
                        </div>
                    </div>
                </div>
                <BackBox backLink={StatesConstants.WELCOME_USER} backText="Back to dashboard"/>
                <Footer />
            </div>
        );
    }
}

Room.contextTypes = {
    router: function () {
        return React.PropTypes.func.isRequired;
    }
};

export default Room;