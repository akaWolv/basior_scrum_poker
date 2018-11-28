import AppDispatcher from '../dispatcher/AppDispatcher';
import { EventEmitter } from 'events';
import VotingConstants from '../constants/VotingConstants';
import StoreMixin from '../mixins/StoreMixin';
import SocketSession from '../handlers/SocketSession'

var _votingDetails = {
    id: undefined,
    //status: VotingConstants.STATUS_PENDING,
    sequence: [
        { value: 1 },
        { value: 2 },
        { value: 3 },
        { value: 5 },
        { value: 8 },
        { value: 13 },
        { value: 21 }
    ],
    vote: undefined,
    users_already_voted: [],
    users_votes: {}
};

var VotingStore = Object.assign({}, StoreMixin, EventEmitter.prototype, {

    getVotingDetails: function () {
        return _votingDetails;
    },

    getStatus: function () {
        return _votingDetails.status;
    },

    getSequence: function () {
        return _votingDetails.sequence;
    },

    getUsersAlreadyVoted: function () {
        return _votingDetails.users_already_voted;
    },

    getUsersVotes: function () {
        return _votingDetails.users_votes;
    },

    getUserVote: function () {
        return _votingDetails.vote;
    },

    dispatcherIndex: AppDispatcher.register(function (payload) {

        switch (payload.action) {
            case VotingConstants.ACTION_START_NEW_VOTING:
                SocketSession.emit('change_voting_status', {status: VotingConstants.STATUS_IN_PROCESS});
                break;
            case VotingConstants.ACTION_FINISH_VOTING:
                SocketSession.emit('change_voting_status', {status: VotingConstants.STATUS_FINISHED});
                break;
            case VotingConstants.ACTION_CONTINUE_VOTING:
                SocketSession.emit('change_voting_status', {status: VotingConstants.STATUS_IN_PROCESS});
                break;
            case VotingConstants.ACTION_STOP_VOTING:
                SocketSession.emit('change_voting_status', {status: VotingConstants.STATUS_PENDING});
                break;
            case VotingConstants.ACTION_VOTE:
                if ('cancel' == payload.details.value) {
                    _votingDetails.vote = undefined;
                    SocketSession.emit('cancel_vote');
                } else {
                    _votingDetails.vote = payload.details.value;
                    SocketSession.emit('vote', {vote: payload.details.value});
                }
                break;
        }

        return true;
    })
});

//SocketSession.on('voting_status_changed', function (msg) {
//    console.log('voting_status_changed', msg);
//
//    switch (msg) {
//        case 'voting started':
//            _votingDetails.status = VotingConstants.STATUS_IN_PROCESS;
//            break;
//        case 'voting finished':
//            _votingDetails.status = VotingConstants.STATUS_FINISHED;
//            break;
//        case 'voting continued':
//            _votingDetails.status = VotingConstants.STATUS_IN_PROCESS;
//            break;
//        default:
//            _votingDetails.status = VotingConstants.STATUS_PENDING;
//            break;
//    }
//
//    VotingStore.emit(VotingConstants.EVENT_VOTING_STATUS_CHANGED);
//});

SocketSession.on('users_already_voted', function (msg) {
    _votingDetails.users_already_voted = msg;
    VotingStore.emit(VotingConstants.EVENT_USERS_ALREADY_VOTED);
});

SocketSession.on('users_votes', function (msg) {
    _votingDetails.users_votes = msg;
    VotingStore.emit(VotingConstants.EVENT_USERS_VOTES);
});

SocketSession.on('user_last_vote', function (msg) {
    _votingDetails.vote = msg;
    VotingStore.emit(VotingConstants.EVENT_USER_VOTE);
});




export default VotingStore;