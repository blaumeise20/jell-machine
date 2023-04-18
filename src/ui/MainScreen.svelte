<script lang="ts">
    import { CellGrid } from "@core/cells/grid";
    import { clip } from "@utils/misc";
    import logo from "./logo.png?blob";
    import type { Stack } from "@utils/stack";
    import Overlay from "./Overlay.svelte";
    import { LevelGridProvider } from "./gridProvider/LevelGridProvider";
    import { gridProvider } from "./uiState";
    import { isWeb, quit } from "@utils/platform";

    const logoURL = URL.createObjectURL(logo);

    export let visible: boolean;
    export let layers: Stack<string>;

    let error = "";

    async function importClipboard() {
        const clipboardContent = await clip();
        const res = CellGrid.loadFromString(clipboardContent);

        if (res[0]) {
            layers = layers.next("editor");
            $gridProvider = new LevelGridProvider(res[1]);
        }
        else {
            error = "Your clipboard doesn't contain a valid level.";
            console.error(res);
        }
    }
    const tips = [
        "Jell Machine was inspired by Pyll Machine",
        "This project is fully free and open source",
        "Try to use keyboard shortcuts as much as you can",
        "Jell Machine has terrible performance lol",
        "This game has been made in over one year",
    ];
    let tip: string;
    $: if (visible) tip = tips[Math.floor(Math.random() * tips.length)];
</script>

<style lang="scss">
    @use "../defs.scss" as *;

    .overlay_container {
        background-color: rgba($bg-base, 0.9);
        height: 100%;
        left: 0;
        position: fixed;
        top: 0;
        z-index: 100;
        width: 100%;
    }

    .overlay {
        left: 50%;
        position: fixed;
        top: 50%;
        height: auto;
        transform: translate(-50%, -50%);
        width: 500px;
        z-index: 102;
    }

    img {
        margin-bottom: 50px;
        width: 100%;
    }

    .help_button {
        bottom: 20px;
        left: 20px;
        position: absolute;
        z-index: 102;
    }
    .tips {
        right: 5%;
        bottom: 4%;
        position: absolute;
        font-size: medium;
        color: #fff;
        font: 400 16px/18px "Roboto", sans-serif;
    }
</style>

{#if visible}
    <div class="overlay_container">
        <div class="overlay">
            <img src={logoURL} alt="Logo" />
            <button class="big" on:click={importClipboard}>Import from clipboard</button>
            <div class="space"></div>
            <button class="big" on:click={() => layers = layers.next("create")}>Create new level</button>
            <div class="space"></div>
            <button class="big" on:click={() => layers = layers.next("connect")}>Connect to server</button>
            <div class="space"></div>
            <div class="cols">
                <button on:click={() => layers = layers.next("settings")}>Settings</button>
                <button on:click={() => layers = layers.next("mods")}>Mods</button>
            </div>
            {#if !isWeb}
                <div class="space"></div>
                <button on:click={quit}>Quit</button>
            {/if}
        </div>
        <button class="center help_button big" on:click={() => layers = layers.next("help")}>Help</button>
        <h1 class="tips">{tip}</h1>
    </div>
{/if}

<Overlay visible={error != ""}>
    {error}
    <div class="space"></div>
    <button class="center" on:click={() => error = ""}>Back</button>
</Overlay>
