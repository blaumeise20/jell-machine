<script lang="ts">
    import { config } from "@utils/config";
</script>

<style lang="scss">
    table {
        border: 0;
        border-collapse: separate;
        border-spacing: 0 15px;
        height: 100%;
        width: 100%;

        > tr {
            > td:first-child {
                font-weight: bold;
                padding-right: 10px;
                text-align: right;
                white-space: nowrap;
            }
            > td:last-child {
                width: 100%;

                > input:not([type="checkbox"]) {
                    width: 100%;
                }
            }
        }
    }
</style>

<table>
    <tr><td>Tick Speed (ms):</td><td><input type="number" bind:value={$config.tickSpeed} /></td></tr>
    <tr><td>UI Scale:</td><td><input type="range" min="0.2" max="5" step="0.02" bind:value={$config.uiScale} /> {$config.uiScale}</td></tr>
    <tr><td>Animations:</td><td><input type="checkbox" bind:checked={$config.animation} /></td></tr>
    <tr><td>Main background:</td><td><input type="checkbox" bind:checked={$config.mainScreenBackground} /></td></tr>
    <tr><td>Keyboard-only mode:</td><td><input type="checkbox" bind:checked={$config.keyboardOnly} /></td></tr>
    <tr><td>Note sound length:</td><td><input type="number" bind:value={$config.troh} /></td></tr>
</table>
