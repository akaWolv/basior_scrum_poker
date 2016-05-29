import React from 'react';
import Paper from 'material-ui/Paper';
import {blue100, lime500, grey400, deepOrange400} from 'material-ui/styles/colors';
import VotingStore from '../stores/VotingStore';
import VotingConstants from '../constants/VotingConstants';
import VotingActions from '../actions/VotingActions';
import ReactSwipe from 'react-swipe';

import {List, ListItem} from 'material-ui/List';
import ContentInbox from 'material-ui/svg-icons/content/inbox';
import ContentClear from 'material-ui/svg-icons/content/clear';
import MapsLocalCafe from 'material-ui/svg-icons/maps/local-cafe';
import ActionHelpOutline from 'material-ui/svg-icons/action/help-outline';
import ActionAccessibility from 'material-ui/svg-icons/action/accessibility';
import Avatar from 'material-ui/Avatar';
import {grey800, orange200, cyan500, grey700, pinkA200, transparent, black} from 'material-ui/styles/colors';

import FlatButton from 'material-ui/FlatButton'
import RaisedButton from 'material-ui/RaisedButton';


const styles = {
    paper_info: {
        marginBottom: 10
    },

    paper_users_list_box: {
        padding: 20,
        height: '100%',
        textAlign: 'left'
    },

    header_text_pending: {
        textAlign: 'center',
        color: grey400
    },
    header_text_in_process: {
        textAlign: 'center',
        color: deepOrange400
    },
    header_text_voted: {
        textAlign: 'center',
        color: lime500
    },
    header_text_finished: {
        textAlign: 'center',
        color: cyan500
    },

    slide_box: {
        margin: '0 auto',
        width: '100%',
        height: 100,
    },
    slide_box_item: {
        border: 'solid 1px red',
        width: 100,
        height: 100
    },

    voting_box: {
        paddingTop: '3%',
        height: '100%',
        textAlign: 'left'
    },
    voting_box_list: {
        textAlign: 'center'
    },
    sequence_sign: {
        left: 8,
        backgroundColor: transparent,
        color: pinkA200
    },
    root: {
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-around'
    },
    gridList: {
        width: '100%',
        height: 'auto'
    },
    sequence_picker: {
        width: '100%',
        height: '100%',
        fontSize: '2em',
        backgroundColor: pinkA200,
        color: black
    },
    sequence_picker_special_cancel: {
        width: '100%',
        height: '100%',
        fontSize: '2em',
        backgroundColor: transparent
    },
    sequence_picker_special: {
        width: '100%',
        height: '100%',
        fontSize: '2em',
        backgroundColor: grey700,
        color: cyan500
    },
    sequence_picker_picked: {
        backgroundColor: orange200,
        //color: cyan500
        color: grey800
    }
};

const texts = {
    vote: 'Vote',
    pending: 'No voting right now. Waiting for admin to start it.',
    in_process: 'Voting in process',
    finished: 'Voting is finished',
    not_voted: 'You did not voted',
    you_voted: 'You have voted:'
};

import {GridList, GridTile} from 'material-ui/GridList';
import IconButton from 'material-ui/IconButton';
import StarBorder from 'material-ui/svg-icons/toggle/star-border';

class RoomVotingPanel extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            //voting_status: VotingStore.getStatus(),
            vote_picked: undefined
        };

        this.listeners = [
            VotingStore.registerListener(VotingConstants.EVENT_USER_VOTE, this.handleUserVote.bind(this))
        ];
    }

    componentWillUnmount() {
        for (let k in this.listeners) {
            this.listeners[k].deregister();
        }
    }

    handleUserVote() {
        this.setState({vote_picked: VotingStore.getUserVote()});
    }

    renderPending() {
        return (
            <div style={styles.paper_users_list_box}>
                <h4 style={styles.header_text_pending}>
                    {texts.pending}
                </h4>
            </div>
        );
    }

    renderInProcess() {
        return (
            <div style={styles.root}>
                <GridList
                    cols={3}
                    cellHeight={100}
                    padding={1}
                    style={styles.gridList} >
                    <GridTile
                        key='cancel' >
                        <FlatButton
                            label={<ContentClear style={{width: '30%', height: '30%'}} />}
                            style={this.sequenceStyle('cancel', styles.sequence_picker_special_cancel)}
                            onClick={this.handlePickVote.bind(this, 'cancel')}
                            secondary={true} />
                    </GridTile>
                    {this.props.sequence.map((elem) => (
                        <GridTile
                            key={elem.value}
                            title={undefined == elem.title || 0 == elem.title.length ? '' : elem.title} >
                            <FlatButton
                                label={elem.value}
                                style={this.sequenceStyle(elem.value, styles.sequence_picker)}
                                onClick={this.handlePickVote.bind(this, elem.value)}
                                secondary={true} />
                        </GridTile>
                    ))}
                    <GridTile
                        key='?' >
                        <FlatButton
                            label={<ActionHelpOutline style={{width: '30%', height: '30%'}} />}
                            style={this.sequenceStyle('?', styles.sequence_picker_special)}
                            onClick={this.handlePickVote.bind(this, '?')}
                            secondary={true} />
                    </GridTile>
                    <GridTile
                        key='big' >
                        <FlatButton
                            label={<ActionAccessibility style={{width: '30%', height: '30%'}} />}
                            style={this.sequenceStyle('big', styles.sequence_picker_special)}
                            onClick={this.handlePickVote.bind(this, 'big')}
                            secondary={true} />
                    </GridTile>
                    <GridTile
                        key='cafe' >
                        <FlatButton
                            label={<MapsLocalCafe style={{width: '30%', height: '30%'}} />}
                            style={this.sequenceStyle('cafe', styles.sequence_picker_special)}
                            onClick={this.handlePickVote.bind(this, 'cafe')}
                            secondary={true} />
                    </GridTile>
                </GridList>
            </div>
        );
    }
    sequenceStyle(value, style) {
        let returnStyle = {};
        if (undefined != this.state.vote_picked && value == this.state.vote_picked) {
            Object.assign(returnStyle, style, styles.sequence_picker_picked);
        } else {
            returnStyle = style;
        }

        return returnStyle;
    }
    handlePickVote(picked) {
        console.log(picked);
        this.setState({vote_picked: picked});
        VotingActions.vote(picked);
    }

    renderFinished() {
        return (
            <div style={styles.paper_users_list_box}>
                <h4 style={styles.header_text_finished}>
                    {texts.finished}
                </h4>
                <h4 style={styles.header_text_finished}>
                    {
                        undefined == this.state.vote_picked || 'cancel' == this.state.vote_picked
                        ? texts.not_voted
                        : texts.you_voted + ' \'' + this.state.vote_picked + '\''
                    }
                </h4>
            </div>
        );
    }

    renderByStatus() {
        switch (this.props.voting_status) {
            case VotingConstants.STATUS_PENDING:
                return this.renderPending();
            case VotingConstants.STATUS_IN_PROCESS:
                return this.renderInProcess();
            case VotingConstants.STATUS_FINISHED:
                return this.renderFinished();
        }
    }

    render() {
        return (
            <Paper style={styles.paper_info} zDepth={1}>
                {this.renderByStatus()}
            </Paper>
        );
    }
}

RoomVotingPanel.defaultProps = {
    sequence: VotingStore.getSequence()
};

export default RoomVotingPanel;