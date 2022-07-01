<script lang="ts">
    import { Stack } from "@utils/stack";
    import { on } from "../keys";
    import Settings from "./Settings.svelte";

    export let visible: boolean;
    export let layers: Stack<string>;

    on("escape").when(() => visible).down(() => layers = layers.back());
</script>

<style lang="scss">
    .overlay_container {
        background-color: #363636;
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
        left: 35%;
        height: auto;
        padding: 20px;
        position: fixed;
        top: 50%;
        transform: translateY(-50%);
        width: 30%;
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
