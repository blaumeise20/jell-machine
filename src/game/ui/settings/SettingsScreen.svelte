<script>
    import { config } from "@utils/config";
    import { settings } from "../uiState";
</script>

<style>
    .overlay_container {
        background-color: #363636;
        left: 0;
        position: fixed;
        top: 0;
        z-index: 103;
        width: 100%;
        height: 100%;
    }

    .overlay {
        color: #fff;
        font: 400 17px/20px "Roboto", sans-serif;
        left: 35%;
        height: auto;
        padding: 20px;
        position: fixed;
        top: 50%;
        transform: translateY(-50%);
        width: 30%;
    }

    p {
        margin: 0 0 5px 0;
    }

    input {
        margin-left: 10px;
    }
</style>

{#if $settings}
    <div class="overlay_container">
        <div class="overlay">
            <p>
                <b>Tick Speed (ms):</b> <input type="number" bind:value={$config.tickSpeed}>
            </p>
            <div class="space"></div>
            <button class="center" on:click={() => $settings = false}>Back</button>
        </div>
    </div>
{/if}
