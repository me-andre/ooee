module.exports = OOEHandlerMethod;

function OOEHandlerMethod (object, method) {
    this._object = object;
    this._method = method;
}

OOEHandlerMethod.prototype.handleEvent = function (eventObject) {
    this._object[this._method](eventObject);
};
