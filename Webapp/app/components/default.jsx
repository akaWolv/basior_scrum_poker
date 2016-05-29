import React from 'react';
import ReactDOM from 'react-dom';
import { Link } from 'react-router'

class Default extends React.Component {
    render() {
        console.log(this.props);
        return (
            <div>
                Welcome!<br />
                Default!<br />
                It is {(new Date()).toTimeString()}<br />
                <Link to={'/create_room'}>CreateRoom</Link><br />
                <h1><center>404</center></h1>
            </div>
        );
    }
}

export default Default;