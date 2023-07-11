/** 
 * Creates an observable object 
 * @example
 * **Create a delayed observable execution, pushing multiple values**
 * 
 * ```
 * const observable1 = new Observable(function (subscriber) {
 *   // Async observable execution
 *   const timeoutId = setTimeout(() => {
 *      // Push multiple values to consumers
 *      subscriber.next('HTTP response data');
 *      subscriber.next('HTTP response data');
 *      subscriber.next('HTTP response data');
 *      subscriber.next('HTTP response data');
 *      // Close observer for receiving values
 *      subscriber.complete();
 *      // Receiving values is ignored
 *      subscriber.next('Should not be displayed.');
 *      subscriber.next('Should not be displayed.');
 *      subscriber.next('Should not be displayed.');
 *      subscriber.next('Should not be displayed.');
 *   }, 1000);
 *   
 *   // Clean-up on observable sources
 *   return function () {
 *       clearTimeout(timeoutId);
 *       console.log('Observable execution canceled');
 *   };
 * });
 *
 * const subscription1 = observable1.subscribe({
 *    next: data => console.log('Received data:', data),
 *    error: error => console.error('Error:', error),
 *    complete: () => console.log('Request complete')
 * });
 *
 * let t1 = setTimeout(function () {
 *    clearTimeout(t1);
 *    // Unsubscribe from observer
 *    subscription1.unsubscribe();
 * }, 500);
 * ```
 * 
 * @example
 * **Create a delayed observable execution, and pushing a single value every second**
 * 
 * ```
 * const observable2 = new Observable(function (subscriber) {
 * let i = 1;
 * const intervalId = setInterval(() => {
 *    subscriber.next(i++);
 * }, 1000);
 * 
 * return function () {
 *    clearInterval(intervalId);
 *    console.log('Interval execution was canceled.');
 * }
 * });
 * 
 * const subscription2 = observable2.subscribe({
 *    next: (data) => console.log('Timer#1:', data)
 * });
 * 
 * const subscription3 = observable2.subscribe({
 *    next: (data) => console.log('Timer#2:', data)
 * });
 * 
 * // Put together multiple subscriptions
 * subscription2.add(subscription3);
 * 
 * let t2 = setTimeout(function () {
 *    clearTimeout(t2);
 *    // Unsubcribe from observer
 *    subscription2.unsubscribe();
 * }, 11e3);
 * ```
 */
export class Observable {
    /**
     * An executor function passed to the Observable constructor,
     * internally passing Observer instance and introducing the  
     * logic for linking the source with the subscriber.
     * @param {Observer} subscriber 
     * @returns {function (): void}
     */
    #subscribeFn = function (subscriber) { return function () { } };

    /**
     * Creates an Observable instance taking as argument 
     * an executor function internally passing Observer instance 
     * and introducing the logic for linking the source with the subscriber.
     * @constructor
     * @param {(subscriber: Observer) => function(): void} subscribeFn 
     */
    constructor(subscribeFn) {
        this.#subscribeFn = subscribeFn;
    }

    /**
     * Creates an Observer instance invoking the executor function and 
     * passing the Observer instance as argument. The return value is 
     * a Subscription instance holding the unsubscribing logic from the 
     * Observer. The relationship is 1 observer : 1 subscription.
     * @param {object} subscriber
     * @param {(value: any) => void} subscriber.next 
     * @param {(error: any) => void} subscriber.error 
     * @param {() => void} subscriber.complete 
     * @returns {Subscription}
     */
    subscribe({ next, error, complete } = {}) {
        const observer = new Observer(next, error, complete);
        const cleanUpHandler = this.#subscribeFn(observer);
        return new Subscription(() => {
            if (!observer.closed) {
                observer.closed = true;
            }

            cleanUpHandler?.();
        });
    }

    /**
     * Takes a set of functions, each receiving a value, 
     * passsing the result to the next one. Returns an Observable.
     * @param  {...((source: Observable) => Observable)} fns 
     * @returns {Observable}
     */
    pipe(...fns) {
        return fns.reduce((source, fn) => fn(source), this);
    }
}

export class Observer {
    #next;
    #error;
    #complete;
    #closed = false;

    /**
     * Creates an Observer instance.
     * @param {(value: any) => void} next 
     * @param {(error: any) => void} [error] 
     * @param {() => void} [complete] 
     * @returns {Observer}
     */
    constructor(next, error, complete) {
        this.#next = next != null && typeof next === 'function' ? next : null;
        this.#error = error != null && typeof error === 'function' ? error : null;
        this.#complete = complete != null && typeof complete === 'function' ? complete : null;
        this.next = this.next.bind(this);
        this.error = this.error.bind(this);
        this.complete = this.complete.bind(this);
    }

    get closed() {
        return this.#closed;
    }

    set closed(value) {
        this.#closed = value;
    }

    next(value) {
        if (!this.closed) {
            this.#next?.(value);
        }
    }

    error(error) {
        if (!this.closed) {
            this.#error?.(error);
        }
    }

    complete() {
        if (!this.closed) {
            this.closed = true;
            this.#complete?.();
        }
    }
}

export class Subscription {
    #closed = false;
    #unsubscribe;
    #childSubscriptions = new Set();

    /**
     * Creates a Subscription instance. The 
     * most important method is the `unsubscribe` 
     * method, which invokes the main logic for 
     * unsubscribing from an oberver and closing it.
     * @param {() => void} unsubscribeHandler 
     */
    constructor(unsubscribeHandler) {
        this.#unsubscribe = unsubscribeHandler != null && typeof unsubscribeHandler === 'function' ? unsubscribeHandler : null;
    }

    /**
     * Puts multiple subscriptions together. So,
     * when parent subscription is unsubscribed, all 
     * child subscriptions are unsubscribed as well.
     * @param {...Subscription} childSubscriptions  
     */
    add(...childSubscriptions) {
        if (!this.#closed) {
            childSubscriptions.forEach(subscription => {
                let isSubscriptionInstance = subscription instanceof Subscription;
                let hasUnsubscribeMethod = 'unsubscribe' in subscription && typeof subscription.unsubscribe === 'function';

                if (isSubscriptionInstance || hasUnsubscribeMethod) {
                    this.#childSubscriptions.add(subscription);
                }
            });
        }
    }

    /**
     * Removes a child subscription.
     * @param {Subscription} childSubscription 
     */
    remove(childSubscription) {
        if (!this.#closed) {
            this.#childSubscriptions.delete(childSubscription);
        }
    }

    /**
     * Unsubscribe method for canceling an observer and clean up resources. 
     * @returns
     */
    unsubscribe() {
        if (!this.closed) {
            this.#closed = true;

            for (const childSubscription of this.#childSubscriptions) {
                childSubscription.unsubscribe?.();
            }

            this.#childSubscriptions.clear();
            this.#unsubscribe?.();
        }
    }
}

export class Subject {
    #observers = new Set();
    #closed = false;

    /**
     * Creates a Subject instance.
     */
    constructor() {
        this.next = this.next.bind(this);
        this.error = this.error.bind(this);
        this.complete = this.complete.bind(this);
    }

    /**
     * Creates an Observer instance invoking the executor function and 
     * passing the Observer instance as argument. The return value is 
     * a Subscription instance holding the unsubscribing logic from the 
     * Observer. The relationship is many observers : 1 subject.
     * @param {object} subscriber
     * @param {(value: any) => void} subscriber.next 
     * @param {(error: any) => void} subscriber.error 
     * @param {() => void} subscriber.complete 
     * @returns {Subscription}
     */
    subscribe({ next, error, complete }) {
        const observer = new Observer(next, error, complete);
        this.#observers.add(observer);
        return new Subscription(() => {
            this.#observers.delete(observer);
        });
    }

    get closed() {
        return this.#closed;
    }

    set closed(value) {
        this.#closed = value;
    }

    get observers() {
        return this.#observers;
    }

    next(value) {
        if (this.closed) return;

        for (const observer of this.observers) {
            if (!observer.closed) {
                observer.next(value);
            }
        }
    }

    error(error) {
        if (this.closed) return;

        for (const observer of this.observers) {
            if (!observer.closed) {
                observer.error(error);
            }
        }
    }

    complete() {
        if (this.closed) return;
        this.closed = true;

        for (const observer of this.observers) {
            if (!observer.closed) {
                observer.complete();
            }
        }
    }

    /**
     * Returns an observable only output from the subject.
     * @returns {Observable}
     * @example
     * **Convert a Subject into Observable**
     * 
     * ```
     * const subject = new Subject();
     * const subject$ = subject.asObservable();
     * 
     * subject$.subscribe({
     *    next(value) {
     *       console.log('Observer 1', value);
     *    }
     * });
     * 
     * const subscription2 = subject$.subscribe({
     *    next(value) {
     *       console.log('Observer 2', value);
     *    }
     * });
     * 
     * subject.next(1);
     * subject.next(2);
     * subject.next(3);
     * 
     * subscription2.unsubscribe();
     * 
     * subject.next(4);
     * ```
     */
    asObservable() {
        const _subject = this;
        return new Observable(function (subscriber) {
            let _subscription;

            try {
                _subscription = _subject.subscribe({
                    next(value) {
                        subscriber.next(value);
                    },
                    error(e) {
                        subscriber.error(e);
                    },
                    complete() {
                        subscriber.complete();
                    }
                });
            } catch (e) {
                subscriber.error(e);
            }

            return function () {
                _subscription.unsubscribe?.();
                // console.log('Unsubscribed from subject');
            }
        });
    }
}

/**
 * Obserbable that immediately emits a complete action 
 * when subscribed to.
 */
export const EMPTY = new Observable(function (subscriber) {
    subscriber.complete();

    return function () {
        // TODO: Remove console log
        console.log('Unsubscribed from `EMPTY` observable.');
    }
});

/**
 * Creates an observable that will create an error instance and push it to the consumer as an error immediately upon subscription.
 * @param {() => any} errorFactory 
 * @returns {Observable} 
 * 
 * @example
 * **Create a simple observable that will emit a new error with a timestamp**
 * 
 * ```
 * let errorCount = 0;
 * 
 * const errorWithTimestamp$ = throwError(() => {
 *    const error = new Error(`This is error number ${++errorCount}`);
 *    error.timestamp = Date.now();
 *    return error;
 * });
 * 
 * errorWithTimestamp$.subscribe({
 *    error: err => console.log(err.timestamp, err.message)
 * });
 *    
 * errorWithTimestamp$.subscribe({
 *    error: err => console.log(err.timestamp, err.message)
 * });
 * ```
 */
export function throwError(errorFactory) {
    return new Observable(function (destination) {
        try {
            const errorInstance = errorFactory();
            destination.error(errorInstance);
        } catch (e) {
            destination.error(e);
        }

        return function () {
            // console.log('Unsubscribed from `throwError` factory method.');
        }
    });
}

/**
 * Creates an Observable that emits a sequence of numbers within a specified range.
 * @param {number} start First integer value from the sequence.
 * @param {number} count Count of integer values to generate.
 */
export function range(start, count) {
    return new Observable(function (subscriber) {
        try {
            let int = start;

            if (count < start) {
                throw new RangeError('From `range` observable: Count argument value cannot be less than start argument value.');
            }

            while (int <= count) {
                subscriber.next(int);
                int++;
            }

            subscriber.complete();
        } catch (e) {
            subscriber.error(e);
        }

        return function () {
            // TODO: Remove console log
            console.log(`Unsubscribed from 'range' (${start}..${count}) observable.`);
        }
    });
}

/**
 * Creates an observable that will wait for a specified time period, or exact date, before emitting the number 0.
 * @param {number | Date} dueTime 
 * @returns {Observable}
 */
export function timer(dueTime) {
    return new Observable(function (destination) {
        let timerId;
        try {
            const start = Date.now();
            let delay = dueTime instanceof Date ? dueTime - start : dueTime;
            delay = delay <= 0 ? 0 : delay;

            timerId = globalThis.setTimeout(() => {
                destination.next(0);
                globalThis.clearTimeout(timerId);
            }, delay);
        } catch (e) {
            destination.error(e);
        }

        return function () {
            globalThis.clearTimeout(timerId);
            // TODO: Remove console log
            console.log(`Unsubscribe from 'timer' observable with delay ${dueTime}.`);
        }
    });
}

/**
 * Creates an Observable that emits sequential numbers every specified interval of time.
 * @param {number} period 
 * @returns {Observable}
 */
export function interval(period = 0) {
    return new Observable(function (destination) {
        let intervalId;
        try {
            let integer = 0;

            intervalId = globalThis.setInterval(function () {
                destination.next(integer++);
            }, period);
        } catch (e) {
            destination.error(e);
        }

        return function () {
            globalThis.clearInterval(intervalId);
            // TODO: Remove console log
            console.log(`Unsubscribed from 'interval' observable with delay ${period}.`);
        }
    });
}

/**
 * Creates an Observable that emits events of a specific type coming from the given event target.
 * @param {EventTarget | HTMLElement | HTMLCollection | NodeList} target 
 * @param {string} eventName 
 * @param {EventListenerOptions | boolean} options 
 * @returns 
 */
export function fromEvent(target, eventName, options) {
    return new Observable(function (destination) {
        const handleEvent = function (ev) {
            destination.next(ev);

            if (options && typeof options === 'object' && options.once) {
                destination.complete();
            }
        }

        try {
            if (!(
                'addEventListener' in target &&
                'removeEventListener' in target
            )) {
                throw new Error('The provided `target` interface does implement add/remove event listener functionality.');
            }

            target.addEventListener(eventName, handleEvent, options);
        } catch (e) {
            destination.error(e);
        }

        return function () {
            target.removeEventListener(eventName, handleEvent);
            // console.log('Unsubscribed from `fromEvent` observable.');
        }
    });
}