<script lang="ts">
    import { config } from "@utils/config";
</script>

<style lang="scss">
    p {
        margin: 0 0 5px 0;
    }

    input {
        margin-left: 10px;
    }
</style>

<p><b>Tick Speed (ms):</b> <input type="number" bind:value={$config.tickSpeed}></p>
<p><b>UI Scale:</b> <input type="number" bind:value={$config.uiScale}></p>
<p><b>Animations:</b> <input type="checkbox" bind:checked={$config.animation}></p>
<p><b>Keyboard-only mode:</b> <input type="checkbox" bind:checked={$config.keyboardOnly}></p>

<div class="space"></div>
<p><b>Special</b></p>
<p><b>troh:</b> <input type="number" bind:value={$config.troh} /></p>
