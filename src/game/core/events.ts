export namespace Events {
    const callbacks: { [key: string]: ((...args: any[]) => void)[] } = {};

    export function on(event: string, callback: (...args: any[]) => void): void {
        if (!callbacks[event]) callbacks[event] = [];
        callbacks[event].push(callback);
    }

    export function off(event: string, callback: (...args: any[]) => void): void {
        if (!callbacks[event]) return;
        const index = callbacks[event].indexOf(callback);
        if (index !== -1) callbacks[event].splice(index, 1);
    }

    export function emit(event: string, ...args: any[]): void {
        try {
            if (callbacks[event])
                for (const callback of callbacks[event])
                    callback(...args);
        } catch {}
    }
}
