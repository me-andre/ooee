var LinkedList = require('./LinkedList');
var OOEHandlerMethod = require('./OOEHandlerMethod');
var OOEHandlerCallback = require('./OOEHandlerCallback');
var OOEListener = require('./OOEListener');
var _ = require('lodash');

const DEFAULT_OPTIONS = {
    namespace: '_ooee'
};

module.exports = function(options) {
    options = _.assign({}, DEFAULT_OPTIONS, options);

    return {
        emit: function (event, eventObject) {
            var listeners = this[options.namespace];
            if (listeners) listeners = listeners[event];
            if (listeners) {
                listeners.each(function (listener) {
                    listener.handle(eventObject);
                });
            }
        },
        on: function (event, handler, method) {
            handler = normalizeHandler(handler, method);
            var listeners = getListeners(this, event);
            var listener = new OOEListener(handler, listeners);
            listeners.push(listener);
            return listener;
        }
    };

    function getListeners (emitter, event) {
        var listeners = emitter[options.namespace] || (emitter[options.namespace] = Object.create(null));
        return listeners[event] || (listeners[event] = new LinkedList());
    }
};

function normalizeHandler (handler, method) {
    if (_.isString(method)) {
        handler = new OOEHandlerMethod(handler, method);
    } else if (_.isFunction(handler)) {
        handler = new OOEHandlerCallback(handler, method);
    } else if (!isEventHandler(handler)) {
        throw new Error(handler + ' is not an event handler');
    }
    return handler;
}

function isEventHandler (object) {
    return _.isFunction(object.handleEvent);
}
