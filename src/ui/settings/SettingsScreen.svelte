<script lang="ts">
    import type { Stack } from "@utils/stack";
    import { on } from "../keys";
    import Settings from "./Settings.svelte";

    export let visible: boolean;
    export let layers: Stack<string>;

    on("escape").when(() => visible).down(() => layers = layers.back());
</script>

<style lang="scss">
    @use "../../defs.scss" as *;

    .overlay_container {
        background-color: $bg-base;
        left: 0;
        position: fixed;
        top: 0;
        z-index: 103;
        width: 100%;
        height: 100%;
    }

    .overlay {
        color: #fff;
        font: 400 17px/20px "Roboto", sans-serif;
        left: 50%;
        height: auto;
        padding: 20px;
        position: fixed;
        top: 50%;
        transform: translate(-50%, -50%);
        width: 500px;
    }
</style>

{#if visible}
    <div class="overlay_container">
        <div class="overlay">
            <Settings />
            <div class="space"></div>
            <button class="center" on:click={() => layers = layers.back()}>Back</button>
        </div>
    </div>
{/if}
