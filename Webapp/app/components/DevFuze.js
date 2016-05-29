import React from 'react';

const styles = {
    button: {
        display: 'inline',
        fontSize: 15,
        width: 150,
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

class DevFuze extends React.Component {
    handleOnClick() {
        window.open("http://devfuze.com");
    }
    render() {
        return (
            <button style={styles.button} onClick={this.handleOnClick.bind(this)}>
                <b>
                    <span style={styles.color_green}>devFuze</span>(!){<span style={styles.color_purple}>com</span>}
                </b>
            </button>
        );
    }
}

export default DevFuze;


