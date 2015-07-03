var _ = require('lodash');

module.exports = LinkedList;

function LinkedList () {
    this.first = this.last = null;
}

_.assign(LinkedList.prototype, {
    each: function (callback, context) {
        if (!context)
            context = global;
        var i = 0, item = this.first;
        while (item) {
            callback.call(context, item, i++);
            item = item.next;
        }
    },
    push: function (item) {
        if (!this.first)
            this.first = item;
        item.after(this.last);
        this.last = item;
    },
    detach: function (item) {
        if (item === this.first)
            this.first = item.next;
        if (item === this.last)
            this.last = item.prev;
    }
});
