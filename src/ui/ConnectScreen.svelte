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
    @use "../defs.scss" as *;

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
        left: 50%;
        position: fixed;
        top: 50%;
        height: auto;
        transform: translate(-50%, -50%);
        width: auto;
        z-index: 102;
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
