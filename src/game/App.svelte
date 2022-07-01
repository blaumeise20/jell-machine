<script lang="ts">
    import "@utils/config";
    import "@utils/texturePacks";
    import EditorMain from "./ui/editor/EditorMain.svelte";
    import MainScreen from "./ui/MainScreen.svelte";
    import CreateScreen from "./ui/CreateScreen.svelte";
    import ConnectScreen from "./ui/ConnectScreen.svelte";
    import HelpScreen from "./ui/help/HelpScreen.svelte";
    import SettingsScreen from "./ui/settings/SettingsScreen.svelte";
    import { Stack } from "@utils/stack";
    import { onConnectionClose } from "@core/multiplayer/connection";

    const layerList = [
        [EditorMain, "editor"],
        [MainScreen, "main"],
        [CreateScreen, "create"],
        [ConnectScreen, "connect"],
        [HelpScreen, "help"],
        [SettingsScreen, "settings"],
    ];
    let layers = new Stack<string>().next("main");

    onConnectionClose[0] = () => layers = layers.back();
</script>

{#each layerList as [layer, id]}
    <svelte:component
        this={layer}
        visible={layers.peek() == id}
        bind:layers
    />
{/each}
