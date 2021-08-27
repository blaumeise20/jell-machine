import { onMount } from "svelte/internal";

export class Animator {
    private frame = -1;
    private interval = 0;

    constructor(private fn: () => any) {

    }

    setInterval(delay: number) {
        this.interval = delay;
    }

    start() {
        let lastTime = 0;
        const loop = (time: number) => {
            if (!lastTime) lastTime = time;
            this.frame = requestAnimationFrame(loop);

            if (time - lastTime >= this.interval) {
                this.fn();
                lastTime = time;
            }
        }
        this.frame = requestAnimationFrame(loop);
    }

    stop() {
        cancelAnimationFrame(this.frame);
    }

    bindToComponent() {
        onMount(() => (this.start(), () => this.stop()));
    }
}
