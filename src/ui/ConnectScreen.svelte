<script lang="ts">
    import type { Stack } from "@utils/stack";
    import { MultiplayerGridProvider } from "./gridProvider/MultiplayerGridProvider";
    import { on } from "./keys";
    import Overlay from "./Overlay.svelte";
    import { gridProvider } from "./uiState";

    export let visible: boolean;
    export let layers: Stack<string>;

    on("escape").when(() => visible && !state).down(() => layers = layers.back());

    let url = "";
    let urlElement = null as any as HTMLInputElement;
    $: if (urlElement) urlElement.focus();

    let state: string | false = false;
</script>

<style lang="scss">
    .overlay_container {
        background-color: #363636;
        left: 0;
        position: fixed;
        top: 0;
        z-index: 101;
        width: 100%;
        height: 100%;
    }

    .overlay {
        left: 50%;
        position: fixed;
        top: 50%;
        padding: 20px;
        height: auto;
        transform: translate(-50%, -50%);
        width: auto;
    }

    h2 {
        color: #fff;
        font: 400 35px/40px "Roboto", sans-serif;
        margin: 0;
        padding: 0;
        text-align: center;
    }

    input {
        text-align: center;
        width: 100%;
        margin: 0;
    }
</style>

{#if visible}
    <div class="overlay_container">
        <div class="overlay">
            <h2>Connect to server</h2>
            <div class="space"></div>
            <input type="url" class="big" placeholder="Location" bind:value={url} bind:this={urlElement} />
            <div class="space"></div>
            <button class="big" on:click={() => {
                $gridProvider = new MultiplayerGridProvider(
                    url,
                    () => layers = layers,
                    s => state = s,
                );
                url = "";
            }}>Connect</button>
            <div class="space"></div>
            <button class="center" on:click={() => layers = layers.back()}>Back</button>
        </div>
    </div>
{/if}

<Overlay visible={state != false}>
    {state}
</Overlay>
