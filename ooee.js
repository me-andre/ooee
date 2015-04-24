var ooee = function() {
var LinkedItem = (function () {
    function LinkedItem() {
        this.reset();
    }
    LinkedItem.prototype.reset = function () {
        this.prev = this.next = null;
    };
    LinkedItem.prototype.attach = function () {
        if (this.next)
            this.next.prev = this;
        if (this.prev)
            this.prev.next = this;
    };
    LinkedItem.prototype.remove = function () {
        if (this.prev)
            this.prev.next = this.next;
        if (this.next)
            this.next.prev = this.prev;
        this.reset();
    };
    LinkedItem.prototype.after = function (item) {
        this.remove();
        this.prev = item;
        if (item)
            this.next = item.next;
        this.attach();
    };
    LinkedItem.prototype.before = function (item) {
        this.remove();
        this.next = item;
        if (item)
            this.prev = item.prev;
        this.attach();
    };
    return LinkedItem;
})();
/// <reference path='LinkedItem.ts'/>
var root = this;
var LinkedList = (function () {
    function LinkedList() {
        this.first = this.last = null;
    }
    LinkedList.prototype.each = function (callback, context) {
        if (!context)
            context = root;
        var i = 0, item = this.first;
        while (item) {
            callback.call(context, item, i++);
            item = item.next;
        }
    };
    LinkedList.prototype.push = function (item) {
        if (!this.first)
            this.first = item;
        item.after(this.last);
        this.last = item;
    };
    LinkedList.prototype.detach = function (item) {
        if (item === this.first)
            this.first = item.next;
        if (item === this.last)
            this.last = item.prev;
    };
    return LinkedList;
})();
/// <reference path='OOEEmitter.ts'/>
/// <reference path='OOEHandlerInterface.ts'/>
/// <reference path='LinkedItem.ts'/>
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var OOEListener = (function (_super) {
    __extends(OOEListener, _super);
    function OOEListener(event, handler, list) {
        _super.call(this);
        this._event = event;
        this._handler = handler;
        this._list = list;
    }
    OOEListener.prototype.handle = function (eventObject) {
        this._handler.handleEvent(eventObject);
    };
    OOEListener.prototype.off = function () {
        this._list.detach(this);
        this._list = null;
        this.remove();
    };
    return OOEListener;
})(LinkedItem);
/// <reference path='OOEHandlerInterface.ts'/>
var OOEHandler = (function () {
    function OOEHandler(handler) {
        this._handler = handler;
    }
    OOEHandler.implementsInterface = function (object) {
        return typeof object.handleEvent === 'function';
    };
    OOEHandler.prototype.handleEvent = function (eventObject) {
        this._handler(eventObject);
    };
    return OOEHandler;
})();
/// <reference path='OOEListener.ts'/>
/// <reference path='OOEHandler.ts'/>
/// <reference path='OOEHandlerInterface.ts'/>
/// <reference path='LinkedList.ts'/>
var OOEEmitter = (function () {
    function OOEEmitter() {
        this._listeners = {};
    }
    OOEEmitter.prototype.emit = function (event, eventObject) {
        event = this.prefix(event);
        var listeners = this._listeners[event];
        if (!listeners)
            return;
        listeners.each(function (listener) {
            listener.handle(eventObject);
        });
    };
    OOEEmitter.prototype.on = function (event, handler) {
        var listeners = this.listeners(this.prefix(event)), listener = new OOEListener(event, handler, listeners);
        listeners.push(listener);
        return listener;
    };
    OOEEmitter.prototype.normalizeHandler = function (handler) {
        if (typeof handler === 'function') {
            handler = new OOEHandler(handler);
        }
        else if (!OOEHandler.implementsInterface(handler)) {
            throw new Error('please specify a valid handler');
        }
        return handler;
    };
    OOEEmitter.prototype.listeners = function (event) {
        event = this.prefix(event);
        var listeners = this._listeners[event];
        if (!listeners) {
            listeners = this._listeners[event] = new LinkedList();
        }
        return listeners;
    };
    OOEEmitter.prototype.prefix = function (event) {
        return OOEEmitter.PREFIX + event;
    };
    OOEEmitter.PREFIX = '__';
    return OOEEmitter;
})();

return OOEEmitter;
}();