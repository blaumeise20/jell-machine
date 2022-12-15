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
    import { config } from "@utils/config";

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

<style lang="scss">
    .bg-image::after {
        animation: bg-menu 30s linear infinite;
        background: url(./background.png) repeat;
        background-size: 30vw 30vw;
        background-position: 0 0;
        bottom: -20px;
        content: "";
        filter: saturate(180%) blur(10px);
        -webkit-filter: saturate(180%) blur(10px);
        left: -20px;
        opacity: 1;
        position: fixed;
        right: -20px;
        top: -20px;
        z-index: 99;
    }

    @keyframes bg-menu {
        0% {
            background-position: 0 0;
        }
        100% {
            background-position: 30vw 30vw;
        }
    }
</style>

<svelte:body
    on:contextmenu|preventDefault
    on:keydown={e => {
        if (e.key === "Escape") {
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

{#if $config.mainScreenBackground && layers.peek() !== "editor"}
    <div class="bg-image"></div>
{/if}

{#each layerList as [layer, id]}
    <svelte:component
        this={layer}
        visible={layers.peek() == id}
        bind:layers
    />
{/each}
