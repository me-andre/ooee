# Object-Oriented Event Emitter

`ooee` is a small, typed event emitter with one twist: **the emitter has no `off()` method**. Instead, `on()` returns a
`Listener`, and the listener removes itself. You don't need to remember which events you subscribed to or keep a
reference to the exact callback (which breaks as soon as you use `.bind()` or an inline arrow function). Keep the
listeners, call `off()` on each when you're done, and nothing leaks.

Listeners are also disposable, so `using` and `DisposableStack` clean them up for you, and an `AbortSignal` can remove a
whole group at once.

Zero dependencies, ESM, TypeScript types included.

## Install

```bash
pnpm add ooee
```

## Usage

Describe your events as a map from event name to payload type. Events without a payload use `void`.

```ts
import { Emitter } from 'ooee';

type StoreEvents = { change: number; ready: void };

class Store extends Emitter<StoreEvents> {
  #count = 0;
  increment() {
    this.emit('change', ++this.#count);
  }
}

const store = new Store();
const listener = store.on('change', (count) => console.log(count)); // count: number
store.increment(); // logs 1
store.emit('ready');
listener.off();
```

If your class already extends something else, use an emitter as a field instead:

```ts
class Widget extends HTMLElement {
  readonly events = new Emitter<{ resize: DOMRect }>();
}
```

Event names and payloads are type-checked: `store.emit('change')` and `store.emit('change', 'one')` are both errors.
Both `type` and `interface` event maps work. `new Emitter()` without a type argument accepts any event name and payload.

## Handlers

A handler is either a function or an object with a `handleEvent()` method, the same interface DOM event listeners use:

```ts
store.on('change', (count) => render(count));

class CountView {
  handleEvent(count: number) {
    this.render(count); // `this` is the view
  }
  render(count: number) { /* ... */ }
}

store.on('change', new CountView());

store.on('change', {
  total: 0,
  handleEvent(count) {
    this.total += count; // `this` is the object literal, with its own members typed
  },
});
```

`handleEvent` is looked up each time an event is dispatched, so you can swap it out later.

Pass `context` to choose what `this` is inside a function handler. The type of `this` is inferred from it:

```ts
store.on('change', function (count) {
  this.render(count);
}, { context: view });
```

Without a context, `this` is `undefined`. You can't combine `context` with a `handleEvent` object, because the object is
already its own `this`: that's a type error, and `on()` also throws a `TypeError` at runtime. It throws the same error
when the handler isn't a function or a `handleEvent` object.

## Removing listeners

```ts
const listener = store.on('change', render);
listener.off();     // safe to call more than once, including from inside the handler
listener.active;    // false

store.once('change', render);                  // removed right before its first call
store.on('change', render, { once: true });    // same thing

const controller = new AbortController();
store.on('change', render, { signal: controller.signal });
store.on('ready', init, { signal: controller.signal });
controller.abort();                            // removes both
```

A listener registered with an already aborted signal is never added, and its `active` is `false` from the start.

Listeners implement `Symbol.dispose`, so they work with explicit resource management:

```ts
{
  using listener = store.on('change', render);
  // ...
} // removed here

const subscriptions = new DisposableStack();
subscriptions.use(store.on('change', render));
subscriptions.use(store.on('ready', init));
subscriptions.dispose(); // removes both
```

## Dispatch rules

`emit()` calls listeners in the order they were added, and follows the same rules as DOM events:

- A listener added during a dispatch is called starting with the next `emit()`.
- A listener removed during a dispatch is skipped if it hasn't run yet. Removing the current listener never affects the
  others.
- A `once` listener is removed before its handler runs, so it fires once even if the handler emits the same event
  again, and even if the handler throws.

Two things differ from the DOM:

- An error thrown by a handler propagates out of `emit()` and stops the dispatch, like Node's `EventEmitter`.
- Adding the same handler twice creates two independent listeners. The DOM ignores the duplicate.

## Requirements

- Node.js 22 or newer, or any modern browser.
- `ooee` is ESM only. CommonJS code can still `require('ooee')` on Node.js 22.12 and newer.
- `Symbol.dispose` support is only added where the runtime has `Symbol.dispose`. Everywhere else, use `off()`.

## Migrating from 0.2

- The mixin is gone. Use `class X extends Emitter<Events>`, or an `Emitter` field. The `namespace` option is gone too,
  because listeners are now stored in a private field.
- `on(event, fn, context)` becomes `on(event, fn, { context })`.
- `on(event, object, 'method')` becomes `on(event, (payload) => object.method(payload))`, or
  `on(event, object.method, { context: object })`.
- `handleEvent` objects work as before.
- Without a context, `this` in a handler is now `undefined` rather than the global object.
- `emit()` still takes a single payload.

## Development

```bash
pnpm install
```

```bash
pnpm test
```

```bash
pnpm typecheck
```

```bash
pnpm build
```

## License

MIT
