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

    const layerList = [
        [EditorScreen, "editor"],
        [MainScreen, "main"],
        [CreateScreen, "create"],
        [ConnectScreen, "connect"],
        [HelpScreen, "help"],
        [SettingsScreen, "settings"],
    ];
    let layers = new Stack<string>().next("main");
</script>

{#each layerList as [layer, id]}
    <svelte:component
        this={layer}
        visible={layers.peek() == id}
        bind:layers
    />
{/each}
