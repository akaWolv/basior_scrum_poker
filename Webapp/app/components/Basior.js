import React from 'react';

const styles = {
    button: {
        display: 'inline',
        fontSize: 20,
        width: 190,
        height: 50,
        padding: 5,
        backgroundColor: 'black',
        color: 'white',
        textAlign: 'center',
        fontFamily: 'Courier New, Courier, monospace',
        borderRadius: 5,
        MozBorderRadius: 5,
        WebkitBorderRadius: 5,
        border: '2px solid #555',
        cursor: 'pointer'
    },
    color_green: {
        color: '#a6e22e'
    },
    color_purple: {
        color: '#ae81ff'
    }
};

class Basior extends React.Component {
    handleOnClick() {
        window.open("http://basior.net");
    }
    render() {
        return (
            <button style={styles.button} onClick={this.handleOnClick.bind(this)}>
                <img src={'http://basior.net/img/wolf_white.svg'} style={{height: 35, verticalAlign: 'middle', marginRight: 5}}/>
                <span style={{lineHeight: '40px'}}>Basior.net</span>
            </button>
        );
    }
}

export default Basior;


