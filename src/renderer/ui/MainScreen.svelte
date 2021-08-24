<script>
    // import { cubicInOut } from "svelte/easing";
    // import { fade } from "svelte/transition";
    import { CellGrid, openLevel } from "@core/grid";
    import { clip } from "@utils/misc";
    import { importLevel, showHelp } from "./uiState";
    import logo from "../logo.png";

    let showSpoiler = false;
    let clipboardContent = "";

    const loadFromClipboard = async () => {
        try {
            if ($importLevel) clipboardContent = clip();
        }
        catch {}

        showSpoiler = clipboardContent.startsWith("V2;");

        // console.log(clipboardContent);
        setTimeout(loadFromClipboard, 500);
    };

    loadFromClipboard();

    function importClipboard() {
        clipboardContent = clip();
        if (clipboardContent.startsWith("V2;")) {
            alert("WHY YOU USING V2 nobody uses v2 except you so go and load level in different format");
            return;
        }

        const res = CellGrid.loadFromString(clipboardContent);

        if (res[0]) {
            $importLevel = false;
            $openLevel = res[1];
        }
        else {
            alert("oh an error occured make sure to copy a valid string");
        }
    }
</script>

<style>
    .overlay_container {
        background-color: #363636;
        left: 0;
        position: fixed;
        top: 0;
        z-index: 100;
        width: 100%;
        height: 100%;
    }

    .overlay {
        left: 35%;
        position: fixed;
        top: 50%;
        padding: 20px;
        height: auto;
        transform: translateY(-50%);
        width: 30%;
    }

    img {
        margin-bottom: 50px;
        width: 100%;
    }

    .import_warning {
        color: #fff;
        font: 400 20px/25px "Roboto", sans-serif;
        margin: 20px 0;
        text-align: center;
    }

    .help_button {
        bottom: 20px;
        left: 20px;
        position: absolute;
    }
</style>

{#if $importLevel}
    <div class="overlay_container">
        <div class="overlay">
            <img src="{logo}" alt="Logo" />
            <button class="big" on:click={importClipboard}>Import from clipboard</button>
            {#if showSpoiler}
                <div class="import_warning">SPOILER: be careful with the thing you have in your clipboard</div>
            {/if}
            <div class="space"></div>
            <button class="big" on:click={() => {
                $openLevel = CellGrid.createEmpty();
                $importLevel = false;
            }}>Create new level</button>
            {#if $openLevel}
                <div class="space"></div>
                <button class="center" on:click={() => $importLevel = false}>Back</button>
            {/if}
        </div>
        <button class="center help_button big" on:click={() => $showHelp = true}>Help</button>
    </div>
{/if}
