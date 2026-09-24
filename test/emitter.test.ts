import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import { Emitter, type Listener } from '../src/index.js';

type Events = { change: number; message: string; ready: void };

interface InterfaceEvents {
  change: number;
}

describe('on / emit', () => {
  it('delivers the payload to listeners in registration order', () => {
    const emitter = new Emitter<Events>();
    const calls: string[] = [];
    emitter.on('change', (n) => calls.push(`a${n}`));
    emitter.on('change', (n) => calls.push(`b${n}`));
    emitter.emit('change', 1);
    expect(calls).toEqual(['a1', 'b1']);
  });

  it('does nothing for an event without listeners', () => {
    const emitter = new Emitter<Events>();
    expect(() => emitter.emit('change', 1)).not.toThrow();
  });

  it('keeps events and emitters apart', () => {
    const a = new Emitter<Events>();
    const b = new Emitter<Events>();
    const onA = vi.fn();
    const onB = vi.fn();
    const onReady = vi.fn();
    a.on('change', onA);
    b.on('change', onB);
    a.on('ready', onReady);
    a.emit('change', 1);
    expect(onA).toHaveBeenCalledExactlyOnceWith(1);
    expect(onB).not.toHaveBeenCalled();
    expect(onReady).not.toHaveBeenCalled();
  });

  it('registers the same handler twice as two independent listeners', () => {
    const emitter = new Emitter<Events>();
    const handler = vi.fn();
    const first = emitter.on('change', handler);
    emitter.on('change', handler);
    emitter.emit('change', 1);
    expect(handler).toHaveBeenCalledTimes(2);
    first.off();
    emitter.emit('change', 2);
    expect(handler).toHaveBeenCalledTimes(3);
  });
});

describe('Listener.off', () => {
  it('stops delivery, is idempotent and updates active', () => {
    const emitter = new Emitter<Events>();
    const handler = vi.fn();
    const listener = emitter.on('change', handler);
    expect(listener.active).toBe(true);
    listener.off();
    expect(listener.active).toBe(false);
    expect(() => listener.off()).not.toThrow();
    emitter.emit('change', 1);
    expect(handler).not.toHaveBeenCalled();
  });

  it('lets later listeners run when a listener removes itself during dispatch', () => {
    const emitter = new Emitter<Events>();
    const calls: string[] = [];
    const self: Listener = emitter.on('change', () => {
      calls.push('self');
      self.off();
    });
    emitter.on('change', () => calls.push('next'));
    emitter.emit('change', 1);
    emitter.emit('change', 2);
    expect(calls).toEqual(['self', 'next', 'next']);
  });

  it('skips a later listener removed during dispatch', () => {
    const emitter = new Emitter<Events>();
    emitter.on('change', () => later.off());
    const handler = vi.fn();
    const later = emitter.on('change', handler);
    emitter.emit('change', 1);
    expect(handler).not.toHaveBeenCalled();
  });

  it('does not call a listener added during dispatch until the next emit', () => {
    const emitter = new Emitter<Events>();
    const added = vi.fn();
    let adding = true;
    emitter.on('change', () => {
      if (adding) emitter.on('change', added);
      adding = false;
    });
    emitter.emit('change', 1);
    expect(added).not.toHaveBeenCalled();
    emitter.emit('change', 2);
    expect(added).toHaveBeenCalledExactlyOnceWith(2);
  });

  it('accepts new listeners after the last one was removed', () => {
    const emitter = new Emitter<Events>();
    const removed = vi.fn();
    const current = vi.fn();
    emitter.on('change', removed).off();
    emitter.on('change', current);
    emitter.emit('change', 1);
    expect(removed).not.toHaveBeenCalled();
    expect(current).toHaveBeenCalledExactlyOnceWith(1);
  });
});

describe('handleEvent objects', () => {
  it('calls handleEvent with the object as this', () => {
    const emitter = new Emitter<Events>();
    const handler = {
      seen: [] as number[],
      handleEvent(n: number) {
        this.seen.push(n);
      },
    };
    emitter.on('change', handler);
    emitter.emit('change', 3);
    expect(handler.seen).toEqual([3]);
  });

  it('accepts class instances', () => {
    class View {
      rendered: number[] = [];
      handleEvent(n: number) {
        this.render(n);
      }
      render(n: number) {
        this.rendered.push(n);
      }
    }
    const emitter = new Emitter<Events>();
    const view = new View();
    emitter.on('change', view);
    emitter.emit('change', 4);
    expect(view.rendered).toEqual([4]);
  });

  it('looks up handleEvent at dispatch time', () => {
    const emitter = new Emitter<Events>();
    const before = vi.fn();
    const after = vi.fn();
    const handler = { handleEvent: before };
    emitter.on('change', handler);
    handler.handleEvent = after;
    emitter.emit('change', 1);
    expect(before).not.toHaveBeenCalled();
    expect(after).toHaveBeenCalledExactlyOnceWith(1);
  });

  it('rejects values that are not handlers', () => {
    const emitter = new Emitter<Events>();
    // @ts-expect-error: a string is not a handler
    expect(() => emitter.on('change', 'handler')).toThrow(TypeError);
    for (const value of [{}, null, undefined, 42, { handleEvent: 'nope' }]) {
      expect(() => emitter.on('change', value as never)).toThrow(TypeError);
    }
  });
});

describe('context', () => {
  it('calls a function handler with the context as this', () => {
    const emitter = new Emitter<Events>();
    const context = { name: 'context' };
    let seen: unknown;
    emitter.on(
      'change',
      function () {
        seen = this;
      },
      { context },
    );
    emitter.emit('change', 1);
    expect(seen).toBe(context);
  });

  it('accepts primitive contexts', () => {
    const emitter = new Emitter<Events>();
    let seen: unknown;
    emitter.on(
      'change',
      function () {
        seen = this;
      },
      { context: 'primitive' },
    );
    emitter.emit('change', 1);
    expect(seen).toBe('primitive');
  });

  it('uses undefined as this without a context', () => {
    const emitter = new Emitter<Events>();
    let seen: unknown = 'not called';
    emitter.on('change', function () {
      seen = this;
    });
    emitter.emit('change', 1);
    expect(seen).toBeUndefined();
  });

  it('keeps the context with the once option and the once() method', () => {
    const emitter = new Emitter<Events>();
    const context = {};
    const seen: unknown[] = [];
    const record = function (this: object) {
      seen.push(this);
    };
    emitter.on('change', record, { once: true, context });
    emitter.once('change', record, { context });
    emitter.emit('change', 1);
    emitter.emit('change', 2);
    expect(seen).toEqual([context, context]);
  });

  it('rejects a context combined with a handleEvent object', () => {
    const emitter = new Emitter<Events>();
    expect(() => emitter.on('change', { handleEvent() {} }, { context: {} })).toThrow(TypeError);
  });
});

describe('once', () => {
  it('fires a listener registered with the once option only once', () => {
    const emitter = new Emitter<Events>();
    const handler = vi.fn();
    const listener = emitter.on('change', handler, { once: true });
    emitter.emit('change', 1);
    emitter.emit('change', 2);
    expect(handler).toHaveBeenCalledExactlyOnceWith(1);
    expect(listener.active).toBe(false);
  });

  it('fires a listener registered with once() only once', () => {
    const emitter = new Emitter<Events>();
    const handler = vi.fn();
    emitter.once('change', handler);
    emitter.emit('change', 1);
    emitter.emit('change', 2);
    expect(handler).toHaveBeenCalledExactlyOnceWith(1);
  });

  it('fires only once when the handler emits the same event again', () => {
    const emitter = new Emitter<Events>();
    const handler = vi.fn(() => emitter.emit('change', 2));
    emitter.once('change', handler);
    emitter.emit('change', 1);
    expect(handler).toHaveBeenCalledExactlyOnceWith(1);
  });

  it('can be removed before it fires', () => {
    const emitter = new Emitter<Events>();
    const handler = vi.fn();
    emitter.once('change', handler).off();
    emitter.emit('change', 1);
    expect(handler).not.toHaveBeenCalled();
  });
});

describe('signal', () => {
  it('removes every listener tied to the signal when it aborts', () => {
    const emitter = new Emitter<Events>();
    const controller = new AbortController();
    const onChange = vi.fn();
    const onMessage = vi.fn();
    const change = emitter.on('change', onChange, { signal: controller.signal });
    const message = emitter.on('message', onMessage, { signal: controller.signal });
    controller.abort();
    expect(change.active).toBe(false);
    expect(message.active).toBe(false);
    emitter.emit('change', 1);
    emitter.emit('message', 'hi');
    expect(onChange).not.toHaveBeenCalled();
    expect(onMessage).not.toHaveBeenCalled();
  });

  it('registers nothing for an already aborted signal', () => {
    const emitter = new Emitter<Events>();
    const handler = vi.fn();
    const listener = emitter.on('change', handler, { signal: AbortSignal.abort() });
    expect(listener.active).toBe(false);
    emitter.emit('change', 1);
    expect(handler).not.toHaveBeenCalled();
    expect(() => listener.off()).not.toThrow();
  });

  it('stops listening to the signal once the listener is removed', () => {
    const emitter = new Emitter<Events>();
    const { signal } = new AbortController();
    const add = vi.spyOn(signal, 'addEventListener');
    const remove = vi.spyOn(signal, 'removeEventListener');
    emitter.on('change', () => {}, { signal }).off();
    expect(remove).toHaveBeenCalledOnce();
    expect(remove.mock.calls[0]?.[1]).toBe(add.mock.calls[0]?.[1]);
  });

  it('stops listening to the signal after a once listener fires', () => {
    const emitter = new Emitter<Events>();
    const { signal } = new AbortController();
    const remove = vi.spyOn(signal, 'removeEventListener');
    emitter.once('change', () => {}, { signal });
    emitter.emit('change', 1);
    expect(remove).toHaveBeenCalledOnce();
  });
});

describe('disposal', () => {
  it('removes the listener with Symbol.dispose', () => {
    const emitter = new Emitter<Events>();
    const listener = emitter.on('change', () => {});
    listener[Symbol.dispose]();
    expect(listener.active).toBe(false);
  });

  it('removes the listener when a using block exits', () => {
    const emitter = new Emitter<Events>();
    const handler = vi.fn();
    {
      using _listener = emitter.on('change', handler);
      emitter.emit('change', 1);
    }
    emitter.emit('change', 2);
    expect(handler).toHaveBeenCalledExactlyOnceWith(1);
  });

  it('removes every listener added to a DisposableStack', () => {
    const emitter = new Emitter<Events>();
    const onChange = vi.fn();
    const onReady = vi.fn();
    const stack = new DisposableStack();
    stack.use(emitter.on('change', onChange));
    stack.use(emitter.on('ready', onReady));
    stack.dispose();
    emitter.emit('change', 1);
    emitter.emit('ready');
    expect(onChange).not.toHaveBeenCalled();
    expect(onReady).not.toHaveBeenCalled();
  });
});

describe('errors', () => {
  it('propagates a handler error and stops the dispatch', () => {
    const emitter = new Emitter<Events>();
    const later = vi.fn();
    emitter.on('change', () => {
      throw new Error('boom');
    });
    emitter.on('change', later);
    expect(() => emitter.emit('change', 1)).toThrow('boom');
    expect(later).not.toHaveBeenCalled();
  });

  it('removes a once listener even when it throws', () => {
    const emitter = new Emitter<Events>();
    const handler = vi.fn(() => {
      throw new Error('boom');
    });
    emitter.once('change', handler);
    expect(() => emitter.emit('change', 1)).toThrow('boom');
    emitter.emit('change', 2);
    expect(handler).toHaveBeenCalledOnce();
  });
});

describe('subclassing', () => {
  it('lets a subclass emit its own events', () => {
    class Counter extends Emitter<{ change: number }> {
      #count = 0;
      increment() {
        this.emit('change', ++this.#count);
      }
    }
    const counter = new Counter();
    const handler = vi.fn();
    counter.on('change', handler);
    counter.increment();
    counter.increment();
    expect(handler.mock.calls).toEqual([[1], [2]]);
  });
});

describe('types', () => {
  it('checks event names and payloads', () => {
    const emitter = new Emitter<Events>();
    emitter.on('change', (n) => expectTypeOf(n).toEqualTypeOf<number>());
    emitter.on('message', (s) => expectTypeOf(s).toEqualTypeOf<string>());
    emitter.emit('change', 1);
    emitter.emit('ready');
    // @ts-expect-error: unknown event
    emitter.emit('unknown');
    // @ts-expect-error: unknown event
    emitter.on('unknown', () => {});
    // @ts-expect-error: wrong payload type
    emitter.emit('change', 'one');
    // @ts-expect-error: missing payload
    emitter.emit('change');
  });

  it('makes the payload optional only when undefined is allowed', () => {
    const emitter = new Emitter<{ maybe: number | undefined; anything: unknown }>();
    emitter.emit('maybe');
    emitter.emit('anything');
    const untyped = new Emitter();
    untyped.on('anything', (payload) => expectTypeOf(payload).toBeUnknown());
    untyped.emit('anything');
    untyped.emit('anything', 1);
  });

  it('accepts interface event maps', () => {
    const emitter = new Emitter<InterfaceEvents>();
    emitter.on('change', (n) => expectTypeOf(n).toEqualTypeOf<number>());
    emitter.emit('change', 1);
  });

  it('types this from the context', () => {
    const emitter = new Emitter<Events>();
    emitter.on(
      'change',
      function () {
        expectTypeOf(this).toEqualTypeOf<{ name: string }>();
      },
      { context: { name: 'context' } },
    );
    // @ts-expect-error: without a context, this is undefined
    emitter.on('change', function () { this.name; });
    // @ts-expect-error: a this annotation does not supply a context
    emitter.on('change', function (this: { name: string }) {});
  });

  it('types the listener as disposable', () => {
    const emitter = new Emitter<Events>();
    expectTypeOf(emitter.on('change', () => {})).toEqualTypeOf<Listener>();
    expectTypeOf(emitter.on('change', () => {})).toExtend<Disposable>();
  });
});
