/// <reference path='LinkedItem.ts'/>

var root = this;

class LinkedList {
    private first: LinkedItem;
    private last: LinkedItem;

    constructor() {
        this.first = this.last = null;
    }

    each(callback: Function, context?: any) {
        if (!context) context = root;
        var i = 0,
            item = this.first;
        while (item) {
            callback.call(context, item, i++);
            item = item.next;
        }
    }

    push(item: LinkedItem) {
        if (!this.first) this.first = item;
        item.after(this.last);
        this.last = item;
    }

    detach(item: LinkedItem) {
        if (item === this.first) this.first = item.next;
        if (item === this.last) this.last = item.prev;
    }
}