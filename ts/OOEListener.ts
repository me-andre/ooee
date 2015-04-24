/// <reference path='OOEEmitter.ts'/>
/// <reference path='OOEHandlerInterface.ts'/>
/// <reference path='LinkedItem.ts'/>

class OOEListener extends LinkedItem {
    private _list: LinkedList;
    private _event: string;
    private _handler: OOEHandlerInterface;

    constructor(event: string, handler: OOEHandlerInterface, list: LinkedList) {
        super();
        this._event = event;
        this._handler = handler;
        this._list = list;
    }

    handle(eventObject: any) {
        this._handler.handleEvent(eventObject);
    }

    off() {
        this._list.detach(this);
        this._list = null;
        this.remove();
    }
}