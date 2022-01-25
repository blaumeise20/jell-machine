<script lang="ts">
    import { showHelp } from "../uiState";

    const actions = [
        ["Left click", "place cell"],
        ["Right click", "delete cell"],
        ["Shift+click", "edit placables"],
        ["WASD", "move camera"],
        ["Scroll", "zoom"],
        ["Q or E", "rotate cell"],
        ["ctrl+drag", "select area"],
        ["C", "copy selected area"],
        ["X", "cut selected area"],
        ["arrow keys", "move selected area"],
        ["Right click while selecting", "delete selection"],
        ["Q and E while selecting", "rotate selection"],
        ["R and F while selecting", "flip selection"],
        ["ESC", "open menu"],
        ["F1", "toggle UI around cells"],
        ["space", "toggle simulation"],
    ];
</script>

<style lang="scss">
    .overlay_container {
        background-color: #363636;
        left: 0;
        position: fixed;
        top: 0;
        z-index: 102;
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
</style>

{#if $showHelp}
    <div class="overlay_container">
        <div class="overlay">
            {#each actions as [ trigger, what ]}
                <p><b>{trigger}:</b> {what}</p>
            {/each}
            <div class="space"></div>
            <button class="center" on:click={() => $showHelp = false}>Back</button>
        </div>
    </div>
{/if}
