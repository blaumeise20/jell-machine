<script lang="ts">
    import "@utils/config";
    import "@utils/texturePacks";
    import EditorScreen from "./ui/editor/EditorScreen.svelte";
    import MainScreen from "./ui/MainScreen.svelte";
    import CreateScreen from "./ui/CreateScreen.svelte";
    import ConnectScreen from "./ui/ConnectScreen.svelte";
    import HelpScreen from "./ui/help/HelpScreen.svelte";
    import SettingsScreen from "./ui/settings/SettingsScreen.svelte";
    import { Stack } from "@utils/stack";
    import { modifiers } from "./ui/keys";

    const layerList = [
        [EditorScreen, "editor"],
        [MainScreen, "main"],
        [CreateScreen, "create"],
        [ConnectScreen, "connect"],
        [HelpScreen, "help"],
        [SettingsScreen, "settings"],
    ] as const;
    let layers = new Stack<string>().next("main");
</script>

<svelte:body
    on:contextmenu|preventDefault
    on:keydown={e => {
        if (!modifiers.cmdOrCtrl()) {
            e.preventDefault();
        }
    }}
    on:wheel|nonpassive|preventDefault|stopPropagation
></svelte:body>
<svelte:window on:beforeunload={e => {
    if (layers.peek() === "editor") {
        e.preventDefault();
        e.returnValue = "Are you sure you want to exit?";
        return false;
    }
    return;
}} />

{#each layerList as [layer, id]}
    <svelte:component
        this={layer}
        visible={layers.peek() == id}
        bind:layers
    />
{/each}
