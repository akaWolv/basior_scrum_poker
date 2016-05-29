import React from 'react';
import { Link } from 'react-router'
import Paper from 'material-ui/Paper';
import RaisedButton from 'material-ui/RaisedButton';

const styles = {
    paper_bottom_nav: {
        marginBottom: 10,
        padding: 20,
        textAlign: 'left'
    },
    paper_bottom_nav_button: {
        width: '100%'
    }
};

class BackBox extends React.Component {
    render() {
        return (
            <div className="row center-xs">
                <div className="col-xs-12  col-sm-6  col-md-4">
                    <div className="box">
                        <Paper style={styles.paper_bottom_nav} zDepth={1}>
                            <Link to={this.props.backLink}>
                                <RaisedButton style={styles.paper_bottom_nav_button} secondary={true} label={this.props.backText}/>
                            </Link>
                        </Paper>
                    </div>
                </div>
            </div>
        );
    }
}

BackBox.propTypes = {
    backLink: React.PropTypes.string.isRequired,
    backText: React.PropTypes.string.isRequired
};

export default BackBox;