var _ = require('lodash');

module.exports = LinkedItem;

function LinkedItem () {
    this.reset();
}

_.assign(LinkedItem.prototype, {
    reset: function () {
        this.prev = this.next = null;
    },
    attach: function () {
        if (this.next)
            this.next.prev = this;
        if (this.prev)
            this.prev.next = this;
    },
    detach: function () {
        if (this.prev)
            this.prev.next = this.next;
        if (this.next)
            this.next.prev = this.prev;
        this.reset();
    },
    after: function (item) {
        this.detach();
        this.prev = item;
        if (item)
            this.next = item.next;
        this.attach();
    },
    before: function (item) {
        this.detach();
        this.next = item;
        if (item)
            this.prev = item.prev;
        this.attach();
    }
});
