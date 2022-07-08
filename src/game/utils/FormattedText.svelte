<script lang="ts">
    import { colorFormat } from "./textFormat";

    export let text: string;

    $: spans = colorFormat(text);
</script>

{#each spans as span}
    {#if span[0]}
        <span style={span[0]}>{span[1]}</span>
    {:else}
        {span[1]}
    {/if}
{/each}
