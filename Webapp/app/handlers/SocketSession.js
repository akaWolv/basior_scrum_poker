var socket_host = window.location.hostname + ':3003';
var socket = require('socket.io-client')(socket_host);

export default socket;