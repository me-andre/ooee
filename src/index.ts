/** A DOM-style event listener object: `handleEvent()` is called with the object as `this`. */
export interface HandlerObject<T> {
  handleEvent(payload: T): void;
}

/** Receives an event's payload: a function (called with `options.context` as `this`) or a `HandlerObject`. */
export type Handler<T, C = undefined> = ((this: C, payload: T) => void) | HandlerObject<T>;

/** The part of `AbortSignal` that ooee relies on. DOM and Node signals both satisfy it. */
export interface AbortSignalLike {
  readonly aborted: boolean;
  addEventListener(type: 'abort', listener: () => void, options?: { once?: boolean }): void;
  removeEventListener(type: 'abort', listener: () => void): void;
}

export interface ListenOptions<C = undefined> {
  /** Remove the listener right before its first call. */
  once?: boolean;
  /** Remove the listener when the signal aborts. An already aborted signal registers nothing. */
  signal?: AbortSignalLike;
  /** `this` for a function handler. Not allowed with a `handleEvent` object. */
  context?: C;
}

/** Returned by `on()`: the only way to unsubscribe. */
export interface Listener {
  /** `false` once the listener has been removed (or was never added, see `signal`). */
  readonly active: boolean;
  /** Stop receiving events. Safe to call any number of times, including from inside the handler. */
  off(): void;
  /** Same as `off()`, so that `using listener = emitter.on(...)` unsubscribes at scope exit. */
  [Symbol.dispose](): void;
}

const fire = Symbol('fire');

class Subscription implements Listener {
  readonly #handler: Handler<unknown, unknown>;
  readonly #context: unknown;
  readonly #once: boolean;
  readonly #onOff: (() => void) | undefined;
  #set: Set<Subscription> | null;

  constructor(
    handler: Handler<unknown, unknown>,
    context: unknown,
    once: boolean,
    set: Set<Subscription> | null,
    onOff?: () => void,
  ) {
    this.#handler = handler;
    this.#context = context;
    this.#once = once;
    this.#set = set;
    this.#onOff = onOff;
  }

  get active(): boolean {
    return this.#set !== null;
  }

  off(): void {
    const set = this.#set;
    if (!set) return;
    this.#set = null;
    set.delete(this);
    this.#onOff?.();
  }

  [fire](payload: unknown): void {
    // Removed earlier in the same dispatch.
    if (!this.#set) return;
    if (this.#once) this.off();
    const handler = this.#handler;
    if (typeof handler === 'function') handler.call(this.#context, payload);
    else handler.handleEvent(payload);
  }
}

interface Subscription {
  [Symbol.dispose](): void;
}

// Defined only where the runtime has Symbol.dispose: otherwise a computed key would be "undefined".
if (typeof Symbol.dispose === 'symbol') {
  Object.defineProperty(Subscription.prototype, Symbol.dispose, {
    value: Subscription.prototype.off,
    writable: true,
    configurable: true,
  });
}

function isHandler(value: unknown): boolean {
  return (
    typeof value === 'function' ||
    (typeof value === 'object' &&
      value !== null &&
      'handleEvent' in value &&
      typeof value.handleEvent === 'function')
  );
}

/**
 * An event emitter whose `on()` returns a `Listener`: there is no `emitter.off(event, handler)`.
 *
 * `Events` maps event names to payload types, e.g. `Emitter<{ change: number; ready: void }>`.
 */
export class Emitter<Events extends Record<keyof Events, unknown> = Record<string, unknown>> {
  readonly #listeners = new Map<keyof Events, Set<Subscription>>();

  /** Call `handler` with `options.context` as `this` whenever `event` is emitted. */
  on<K extends keyof Events, C = undefined>(
    event: K,
    handler: (this: NoInfer<C>, payload: Events[K]) => void,
    options?: ListenOptions<C>,
  ): Listener;
  /** Call `handler.handleEvent()` whenever `event` is emitted. */
  on<K extends keyof Events, H extends HandlerObject<Events[K]>>(
    event: K,
    // ThisType lets an inline object literal use its own members through `this`.
    handler: H & ThisType<H>,
    options?: Omit<ListenOptions, 'context'>,
  ): Listener;
  // Implementation signatures use `any`: a callback typed for one payload isn't a Handler<unknown>.
  on(event: keyof Events, handler: Handler<any, any>, options?: ListenOptions<unknown>): Listener {
    return this.#on(event, handler, options);
  }

  /** Same as `on(event, handler, { ...options, once: true })`. */
  once<K extends keyof Events, C = undefined>(
    event: K,
    handler: (this: NoInfer<C>, payload: Events[K]) => void,
    options?: Omit<ListenOptions<C>, 'once'>,
  ): Listener;
  once<K extends keyof Events, H extends HandlerObject<Events[K]>>(
    event: K,
    handler: H & ThisType<H>,
    options?: Omit<ListenOptions, 'context' | 'once'>,
  ): Listener;
  once(event: keyof Events, handler: Handler<any, any>, options?: ListenOptions<unknown>): Listener {
    return this.#on(event, handler, { ...options, once: true });
  }

  #on(event: keyof Events, handler: Handler<unknown, unknown>, options: ListenOptions<unknown> = {}): Listener {
    const { once = false, signal, context } = options;
    if (!isHandler(handler)) {
      throw new TypeError('ooee: handler must be a function or an object with a handleEvent() method');
    }
    if (typeof handler !== 'function' && context !== undefined) {
      throw new TypeError('ooee: context cannot be used with a handleEvent object');
    }
    if (signal?.aborted) return new Subscription(handler, context, once, null);

    const set = this.#listeners.get(event) ?? new Set<Subscription>();
    this.#listeners.set(event, set);
    const abort = () => subscription.off();
    const subscription = new Subscription(handler, context, once, set, () => {
      if (set.size === 0) this.#listeners.delete(event);
      signal?.removeEventListener('abort', abort);
    });
    set.add(subscription);
    signal?.addEventListener('abort', abort, { once: true });
    return subscription;
  }

  /**
   * Call every listener of `event`, in the order they were added. Listeners added during the
   * dispatch are not called until the next `emit()`; listeners removed during it are skipped.
   * An exception thrown by a handler propagates and stops the dispatch.
   */
  emit<K extends keyof Events>(
    event: K,
    ...[payload]: undefined extends Events[K] ? [payload?: Events[K]] : [payload: Events[K]]
  ): void {
    const set = this.#listeners.get(event);
    if (!set) return;
    for (const subscription of [...set]) subscription[fire](payload);
  }
}
