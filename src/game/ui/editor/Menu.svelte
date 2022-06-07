<script lang="ts">
    import { clip } from "@utils/misc";
    import { openLevel } from "@core/cells/grid";
    import { selection } from "../uiState";
    import { Menu } from "@core/ui/menu";
    import UiElementViewer from "../UIElementViewer.svelte";
    import { BorderMode } from "@core/cells/border";
    import { Stack } from "@utils/stack";

    export let open: boolean;
    export let layers: Stack<string>;

    const copiedText = "Copied!";
    $: copyText = $selection ? "Copy selected area" : "Copy to Clipboard";
    let copyButtonLabel = "Copy to Clipboard";
    let copyTimeout: any = null;
</script>

<style lang="scss">
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

        /* button {
            margin-bottom: 10px;
        } */
    }

    .action_buttons {
        border-top: 2px solid #404040;
        padding: 1px 7px;

        button {
            margin: 5px 0;
        }
    }
</style>

{#if open}
    <div class="sidebar_backdrop" on:click={() => open = false}></div>
    <div class="sidebar">
        <div class="actions">
            Border mode:
            <button on:click={() => $openLevel && ($openLevel.borderMode = BorderMode.Default)}>Default</button>
            <button on:click={() => $openLevel && ($openLevel.borderMode = BorderMode.Wrap)}>Wrap</button>
            <button on:click={() => $openLevel && ($openLevel.borderMode = BorderMode.Delete)}>Delete</button>
            {#each Menu.uiComponents as component, i}
                {#if i}
                    <div class="space" />
                    <div class="space" />
                {/if}
                <UiElementViewer root={component} />
            {/each}
        </div>
        <div class="tools">
            <!-- {#each Object.values(Extension.tools) as tool}
                <button on:click={() => {
                    if ($openLevel) {
                        open = false;
                        tool.runTool($openLevel);
                    }
                }}>{tool.viewText}</button>
            {/each} -->
        </div>
        <div class="action_buttons">
            <button on:click={() => {
                open = false;
                layers = layers.next("main");
            }}>Go to main screen</button>
            <button on:click={() => {
                if ($openLevel) {
                    let string = $selection ?
                        $openLevel.extract($selection).toString("V3")
                        : $openLevel.toString("V3");
                    if (string) clip(string);

                    copyButtonLabel = copiedText;
                    copyTimeout && clearTimeout(copyTimeout);
                    copyTimeout = setTimeout(() => {
                        copyButtonLabel = copyText;
                    }, 1000);
                }
            }}>{copyButtonLabel} V3</button>
            <button on:click={() => {
                if ($openLevel) {
                    let string = $selection ?
                        $openLevel.extract($selection).toString("J1")
                        : $openLevel.toString("J1");
                    if (string) clip(string);

                    copyButtonLabel = copiedText;
                    copyTimeout && clearTimeout(copyTimeout);
                    copyTimeout = setTimeout(() => {
                        copyButtonLabel = copyText;
                    }, 1000);
                }
            }}>{copyButtonLabel} J1</button>
        </div>
    </div>
{/if}
