<script>
    import { cubicInOut } from "svelte/easing";
    import { fade } from "svelte/transition";
    import { createLevel, importLevel } from "./uiState";
</script>

<style>
    .overlay_backdrop {
        background-color: rgba(0,0,0,.3);
        left: 0;
        position: fixed;
        top: 0;
        z-index: 102;
        width: 100%;
        height: 100%;
    }
    .overlay {
        background-color: #363636;
        height: 100%;
        left: calc(50% - 200px);
        position: fixed;
        top: 50%;
        padding: 20px;
        height: auto;
        transform: translateY(-50%);
        width: 400px;
        z-index: 103;
    }
    .import_warning {
        color: #fff;
        font: 400 20px/25px "Roboto", sans-serif;
        margin: 20px 0;
        text-align: center;
    }
</style>

{#if $createLevel}
    <div class="overlay_backdrop" transition:fade={{ easing: cubicInOut }} on:click={() => ($importLevel = true, $createLevel = false)}></div>
    <div class="overlay" transition:fade={{ easing: cubicInOut }}>

        <button class="big" on:click={() => {
            ($importLevel = true, $createLevel = false)
        }}>Create new level</button>
    </div>
{/if}
