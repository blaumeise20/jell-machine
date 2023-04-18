<script lang="ts">
    import type { Stack } from "@utils/stack";
    import { on } from "../keys";

    export let visible: boolean;
    export let layers: Stack<string>;

    on("escape").when(() => visible).down(() => layers = layers.back());
</script>

<style lang="scss">
    @use "../../defs.scss" as *;

    .overlay_container {
        background-color: rgba($bg-base, 0.9);
        left: 0;
        position: fixed;
        top: 0;
        z-index: 100;
        width: 100%;
        height: 100%;
    }

    .overlay {
        color: #fff;
        font: 400 17px/20px "Roboto", sans-serif;
        left: 50%;
        height: auto;
        position: fixed;
        top: 50%;
        transform: translate(-50%, -50%);
        width: 500px;
        z-index: 102;
    }
</style>

{#if visible}
    <div class="overlay_container">
        <div class="overlay">
            <h2>Mods</h2>
            <div class="space"></div>
            <p>Soon ™</p>
            <p>Might be renamed to either "Extensions" or "Plugins"</p>
            <div class="space"></div>
            <button class="center" on:click={() => layers = layers.back()}>Back</button>
        </div>
    </div>
{/if}
