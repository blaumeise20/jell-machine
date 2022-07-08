<script lang="ts">
    import { CellGrid } from "@core/cells/grid";
    import { Stack } from "@utils/stack";
    import { LevelGridProvider } from "./gridProvider/LevelGridProvider";
    import { on } from "./keys";
    import { gridProvider } from "./uiState";

    export let visible: boolean;
    export let layers: Stack<string>;

    on("escape").when(() => visible).down(() => layers = layers.back());

    let width = 100;
    let height = 100;
    let widthElement = null as any as HTMLInputElement;
    let heightElement = null as any as HTMLInputElement;

    $: if (widthElement) widthElement.focus();
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
        width: 150px;
    }
</style>

{#if visible}
    <div class="overlay_container">
        <div class="overlay">
            <h2>Create Level</h2>
            <div class="space"></div>
            <input type="number" class="big" placeholder="Width" bind:value={width} bind:this={widthElement} on:focus={_ => widthElement.select()} />
            <input type="number" class="big" placeholder="Height" bind:value={height} bind:this={heightElement} on:focus={_ => heightElement.select()} />
            <div class="space"></div>
            <button class="big" on:click={() => {
                $gridProvider = new LevelGridProvider(CellGrid.createEmpty(width, height));
                width = 100;
                height = 100;
                layers = layers.replaceTop("editor");
            }}>Create new level</button>
            <div class="space"></div>
            <button class="center" on:click={() => layers = layers.back()}>Back</button>
        </div>
    </div>
{/if}
