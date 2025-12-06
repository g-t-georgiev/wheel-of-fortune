type EventHandler = {
  context?: any;
  handler: { (...args: any[]): any };
};

type RevocablePromise = {
  promise: Promise<unknown>;
  cancel: { (): void };
};

class EventEmitter {
  #eventsMap: Map<string, Set<EventHandler>> = new Map();

  /** 
   * Attach event handler by providing a handler function and optional call context.
   * 
   * For convenience, a cleanup method is returned.
   */
  on(event: string, handler: EventHandler["handler"], context?: any) {
    if (!this.#eventsMap.has(event)) {
      this.#eventsMap.set(event, new Set());
    }

    this.#eventsMap.get(event)!.add({ context, handler });

    return () => this.off(event, handler);
  }

  /** Register a handler that will be called once. */
  once(event: string, handler: EventHandler["handler"], context?: any) {
    let cleanup: { (): void } = () => { };

    const wrapper = (...args: any[]) => {
      cleanup();
      handler.apply(context, args);
    };

    cleanup = this.on(event, wrapper, context);

    return cleanup;
  }

  /** 
   * Wait for a single occurrence of an event.
   * 
   * Returns a promise that resolves with the event payload data.
   */
  waitForEvent(event: string): RevocablePromise {
    let cancelFn: { (): void } = () => { };

    const promise = new Promise<unknown>((resolve) => {
      cancelFn = this.once(event, (...args) => resolve(args));
    });

    return {
      promise,
      cancel(reason?: string) {
        cancelFn();

        if (reason)
          console.warn(`Promise for event ${event} was cancelled with reason: \n${reason}`);
      },
    }
  }

  /** Detach event handler. */
  off(event: string, fn: EventHandler["handler"]) {
    if (!this.#eventsMap.has(event)) {
      console.warn(`Event "${event}" not implemented.`);
      return false;
    }

    const entries = this.#eventsMap.get(event)!;
    const match = Array.from(entries).find((entry) => Object.is(entry.handler, fn));

    return !!match && entries.delete(match);
  }

  /** Clear all event handlers. */
  clearAll() {
    this.#eventsMap.clear();
  }

  /** Trigger all method handlers associated with an event.  */
  emit(event: string, ...args: any[]) {
    const entries = this.#eventsMap.get(event);

    if (!entries) {
      console.warn(`Event "${event}" not implemented.`);
      return;
    }

    if (!entries.size) return;

    Array.from(entries).forEach(({ context, handler }) =>
      context ? handler.apply(context, args) : handler(...args)
    );
  }
}

/** Global event emitter instance. */
const emitter = new EventEmitter();

export default emitter;