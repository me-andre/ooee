module.exports = OOEHandlerCallback;

function OOEHandlerCallback (callback) {
    this._callback = callback;
}

OOEHandlerCallback.prototype.handleEvent = function (eventObject) {
    this._callback(eventObject);
};
