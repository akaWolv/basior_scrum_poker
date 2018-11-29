import React from 'react';
import ReactDOM from 'react-dom';
import { Link } from 'react-router'

class ConnectionProblem extends React.Component {
    render() {
        return (
            <div style={{color: 'whitesmoke', textAlign: 'center'}}>
                <h1>Server Connection Problem</h1>
                <br />
                Hamster feeding time...
            </div>
        );
    }
}

export default ConnectionProblem;