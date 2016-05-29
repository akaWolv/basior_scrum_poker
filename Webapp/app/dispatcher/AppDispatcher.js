import Dispatcher from './Dispatcher';

var AppDispatcher = Object.assign({}, Dispatcher.prototype, {

    handleViewAction: function(action, details) {
        this.dispatch({
            source: 'VIEW_ACTION',
            action: action,
            details: details
        });
    }

});

module.exports = AppDispatcher;