class LinkedItem {
    prev: LinkedItem;
    next: LinkedItem;

    constructor() {
        this.reset();
    }

    private reset() {
        this.prev = this.next = null;
    }

    private attach() {
        if (this.next) this.next.prev = this;
        if (this.prev) this.prev.next = this;
    }

    remove() {
        if (this.prev) this.prev.next = this.next;
        if (this.next) this.next.prev = this.prev;
        this.reset();
    }

    after(item: LinkedItem) {
        this.remove();
        this.prev = item;
        if (item) this.next = item.next;
        this.attach();
    }

    before(item: LinkedItem) {
        this.remove();
        this.next = item;
        if (item) this.prev = item.prev;
        this.attach();
    }
}