import AppDispatcher from '../dispatcher/AppDispatcher';
import VotingConstants from '../constants/VotingConstants';

var VotingActions = {
    startNewVoting: function() {
        AppDispatcher.handleViewAction(VotingConstants.ACTION_START_NEW_VOTING);
    },
    finishVoting: function() {
        AppDispatcher.handleViewAction(VotingConstants.ACTION_FINISH_VOTING);
    },
    continueVoting: function() {
        AppDispatcher.handleViewAction(VotingConstants.ACTION_CONTINUE_VOTING);
    },
    stopVoting: function() {
        AppDispatcher.handleViewAction(VotingConstants.ACTION_STOP_VOTING);
    },
    vote: function(value) {
        AppDispatcher.handleViewAction(VotingConstants.ACTION_VOTE, {value});
    }
};

module.exports = VotingActions;