/// <reference path='OOEListener.ts'/>
/// <reference path='OOEHandler.ts'/>
/// <reference path='OOEHandlerInterface.ts'/>
/// <reference path='LinkedList.ts'/>

class OOEEmitter {
    private _listeners: { [event: string]: LinkedList };
    private static PREFIX: string = '__';

    constructor() {
        this._listeners = {};
    }

    emit(event: string, eventObject: any) {
        event = this.prefix(event);
        var listeners = this._listeners[event];
        if (!listeners) return;
        listeners.each(function(listener) {
            listener.handle(eventObject);
        });
    }

    on(event: string, handler: any): OOEListener {
        var listeners = this.listeners(this.prefix(event)),
            listener = new OOEListener(event, handler, listeners);
        listeners.push(listener);
        return listener;
    }

    private normalizeHandler(handler: any): OOEHandlerInterface {
        if (typeof handler === 'function') {
            handler = new OOEHandler(handler);
        } else if (!OOEHandler.implementsInterface(handler)) {
            throw new Error('please specify a valid handler');
        }
        return handler;
    }

    private listeners(event: string): LinkedList {
        event = this.prefix(event);
        var listeners = this._listeners[event];
        if (!listeners) {
            listeners = this._listeners[event] = new LinkedList();
        }
        return listeners;
    }

    private prefix(event: string): string {
        return OOEEmitter.PREFIX + event;
    }
}
