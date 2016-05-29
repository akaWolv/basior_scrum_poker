export default {
    registerListener: function (eventName, callback) {
        var callbackReference = callback;
        this.on(eventName, callbackReference);
        return {
            deregister: this.removeListener.bind(this, eventName, callbackReference)
        }
    },
    registerListenerOnce: function (eventName, callback) {
        var callbackReference = callback;
        this.once(eventName, callbackReference);
        return {
            deregister: this.removeListener.bind(this, eventName, callbackReference)
        }
    }
}