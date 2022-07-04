import { readable, Readable, writable, Writable } from "svelte/store";
import { onMount } from "svelte";

type FnString = (key: string) => any;
type EventListener = readonly [
    when: FnString,
    exec: FnString,
    specificity: number,
];
type EventListeners = EventListener[];
const downs: Record<string, EventListeners> = {};
const ups: Record<string, EventListeners> = {};

export const keys = {
    alt: false,
    ctrl: false,
    meta: false,
    shift: false,
};

export const keys$ = writable({
    alt: false,
    ctrl: false,
    meta: false,
    shift: false,
});

on("Alt").observe(keys, "alt").observe$(keys$, "alt");
on("Control").observe(keys, "ctrl").observe$(keys$, "ctrl");
on("Meta").observe(keys, "meta").observe$(keys$, "meta");
on("Shift").observe(keys, "shift").observe$(keys$, "shift");

export const modifiers = {
    alt: () => keys.alt,
    ctrl: () => keys.ctrl,
    meta: () => keys.meta,
    shift: () => keys.shift,
}

export function on(key: string) {
    key = key.toLowerCase();
    try {
        let mounters: any[] = [];
        let unmounters: any[] = [];
        onMount(() => {
            mounters.forEach(m => m());
            return () => unmounters.forEach(u => u());
        });
        return makeObject(key, [], 0, {
            mount(fn: any) { mounters.push(fn) },
            unmount(fn: any) { unmounters.push(fn) },
        });
    }
    catch {
        return makeObject(key, [], 0);
    }
}

function makeObject(key: string, whens: FnString[], specificity: number, mounter?: { mount: any, unmount: any }): KeyListener {
    return {
        when(fn: FnString) {
            return makeObject(key, [...whens, fn], specificity, mounter);
        },
        and(fn: FnString) {
            return makeObject(key, [...whens, fn], specificity + 1, mounter);
        },

        down(down: FnString) {
            const newDown = [
                (key: string) => whens.every(fn => fn(key)),
                down,
                specificity,
            ] as const;

            if (mounter) {
                mounter.mount(() => {
                    if (!downs[key]) downs[key] = [];
                    downs[key].push(newDown);
                });
                mounter.unmount(() => {
                    const index = downs[key].indexOf(newDown);
                    if (index != -1) downs[key].splice(index, 1);
                });
            }
            else {
                if (!downs[key]) downs[key] = [];
                downs[key].push(newDown);
            }
            return this;
        },

        up(up: FnString) {
            const newUp = [
                (key: string) => whens.every(w => w(key)),
                up,
                specificity,
            ] as const;

            if (mounter) {
                mounter.mount(() => {
                    if (!ups[key]) ups[key] = [];
                    ups[key].push(newUp);
                });
                mounter.unmount(() => {
                    const index = ups[key].indexOf(newUp);
                    if (index != -1) ups[key].splice(index, 1);
                });
            }
            else {
                if (!ups[key]) ups[key] = [];
                ups[key].push(newUp);
            }

            return this;
        },

        // @ts-ignore
        observe(object?: any, key?: any) {
            if (object) {
                this.observe().subscribe((v: boolean) => object[key] = v);
                return this;
            }

            return readable(false as boolean, set => void this.down(() => set(true)).up(() => set(false)));
        },
        observe$(object: Writable<any>, key?: any) {
            this.observe().subscribe((v: boolean) => object.update(o => (o[key] = v, o)));
            return this;
        }
    }
}

export interface KeyListener {
    when(fn: FnString): KeyListener;
    and(fn: FnString): KeyListener;

    down(down: FnString): this;
    up(up: FnString): this;

    observe<K extends string>(object: { [U in K]: boolean}, key: K): this;
    observe(): Readable<boolean>;
    observe$<K extends string>(object: Writable<{ [U in K]: boolean}>, key: K): this;
}

// export function observekey(key: string) {
//     return readable(false, set => onkey(key, () => set(true), () => set(false)));
// }

window.addEventListener("keydown", e => {
    callSorted(
        downs[e.key.toLowerCase()] || [],
        e.key,
    );
});

window.addEventListener("keyup", e => {
    callSorted(
        ups[e.key.toLowerCase()] || [],
        e.key,
    );
});

function callSorted(fns: EventListeners, arg: string) {
    // group
    const grouped = fns
        .filter(fn => fn[0](arg))
        .reduce((acc, [_, fn, specificity]) => {
            if (!acc[specificity]) acc[specificity] = [];
            acc[specificity].push(fn);
            return acc;
        }, {} as Record<number, FnString[]>);

    // find highest specificity
    let specificity = 0;
    for (const key in grouped) {
        if (grouped.hasOwnProperty(key)) {
            let s = parseInt(key);
            if (s > specificity) specificity = s;
        }
    }

    // call
    if (specificity in grouped) {
        for (const fn of grouped[specificity]) fn(arg);
    }
}
