var _ = require('lodash');

module.exports = OOEHandlerCallback;

function OOEHandlerCallback (callback, context) {
    this._callback = callback;
    this._context = _.isObject(context) ? context : global;
}

OOEHandlerCallback.prototype.handleEvent = function (eventObject) {
    this._callback.call(this._context, eventObject);
};
