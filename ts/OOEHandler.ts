/// <reference path='OOEHandlerInterface.ts'/>

class OOEHandler implements OOEHandlerInterface {
    private _handler: Function;

    static implementsInterface(object: any): boolean {
        return typeof object.handleEvent === 'function';
    }

    constructor(handler: Function) {
        this._handler = handler;
    }

    handleEvent(eventObject: any) {
        this._handler(eventObject);
    }
}