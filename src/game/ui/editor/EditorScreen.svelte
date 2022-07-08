<script lang="ts">
    import { gridProvider } from "../uiState";
    import { Stack } from "@utils/stack";
    import EditorMain from "./EditorMain.svelte";

    export let visible: boolean;
    export let layers: Stack<string>;
</script>

{#if visible && $gridProvider}
    <EditorMain bind:layers gridProvider={$gridProvider} />
{/if}
