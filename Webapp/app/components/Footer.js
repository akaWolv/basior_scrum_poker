import React from 'react';
import Basior from '../components/Basior';
import Paper from 'material-ui/Paper';

const styles = {
    paper_footer: {
        marginBottom: 20,
        padding: 10
    },
    footer_container: {
        height: '100%',
        textAlign: 'center'
    }
};

class Footer extends React.Component {
    render() {
        return (
            <div className="row center-xs">
                <div className="col-xs-12 col-sm-6 col-md-4">
                    <div className="box">
                        <center>
                            <Paper style={styles.paper_footer} zDepth={1}>
                                <div style={styles.footer_container}>
                                    Brought to you by <Basior />
                                </div>
                            </Paper>
                        </center>
                    </div>
                </div>
            </div>
        );
    }
}

export default Footer;


