<script>
    import { clip } from "@utils/misc";
    import { openLevel } from "@core/grid";
    import { mainMenu, menuOpen, selection } from "../uiState";
    import { Extension } from "@core/extensions";

    const copiedText = "Copied!";
    $: copyText = $selection ? "Copy selected area" : "Copy to Clipboard";
    let copyButtonLabel = "Copy to Clipboard";
    let copyTimeout: any = null;
</script>

<style>
    .sidebar_backdrop {
        background-color: rgba(0, 0, 0, .2);
        width: 100%;
        top: 0;
        left: 0;
        height: 100%;
        position: fixed;
        z-index: 94;
    }

    .sidebar {
        border-left: 2px solid #404040;
        background-color: #363636;
        display: flex;
        height: 100%;
        flex-direction: column;
        position: fixed;
        right: 0;
        top: 0;
        width: 300px;
        z-index: 95;
    }

    .actions {
        flex: 1;
        font: 400 17px/20px "Roboto", sans-serif;
        color: #fff;
        padding: 10px;
    }

    .tools {
        flex: 1;
        font: 400 17px/20px "Roboto", sans-serif;
        color: #fff;
        padding: 10px;

        button {
            margin-bottom: 10px;
        }
    }

    .action_buttons {
        border-top: 2px solid #404040;
        padding: 1px 7px;

        button {
            margin: 5px 0;
        }
    }
</style>

{#if $menuOpen}
    <div class="sidebar_backdrop" on:click={() => $menuOpen = false}></div>
    <div class="sidebar">
        <div class="actions">
            Tick Count: {$openLevel?.tickCount}
            <button on:click={() => $openLevel?.reset()}>Reset</button>

        </div>
        <div class="tools">
            {#each Object.values(Extension.tools) as tool}
                <button on:click={() => {
                    if ($openLevel) {
                        $menuOpen = false;
                        tool.runTool($openLevel);
                    }
                }}>{tool.viewText}</button>
            {/each}
        </div>
        <div class="action_buttons">
            <button on:click={() => $mainMenu = true}>Go to main screen</button>
            <!-- {#if $openLevel.isInfinite} -->
                <button on:click={() => {
                    if ($openLevel) {
                        if ($selection) clip($openLevel.extract($selection).toString());
                        else clip($openLevel.toString());
                        copyButtonLabel = copiedText;
                        copyTimeout && clearTimeout(copyTimeout);
                        copyTimeout = setTimeout(() => {
                            copyButtonLabel = copyText;
                        }, 1000);
                    }
                }}>{copyButtonLabel}</button>
                <!-- <button>Copy (advanced)</button>
                <button>Copy selection</button> -->
            <!-- {:else}
                <button on:click={() => clip("helotest")}>Copy everything</button>
                <button>Copy selection</button>
            {/if} -->
        </div>
    </div>
{/if}
