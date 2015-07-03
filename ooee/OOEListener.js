var LinkedItem = require('./LinkedItem');
var _ = require('lodash');

module.exports = OOEListener;

function OOEListener (handler, list) {
    LinkedItem.call(this);
    this._handler = handler;
    this._list = list;
}

_.assign(OOEListener.prototype, LinkedItem.prototype, {
    handle: function (eventObject) {
        this._handler.handleEvent(eventObject);
    },
    off: function () {
        this._list.detach(this);
        this._list = null;
        this.detach();
    }
});
