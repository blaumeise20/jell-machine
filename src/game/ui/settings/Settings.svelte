<script lang="ts">
    import { config } from "@utils/config";

    let animations = $config.animation ? "on" : "off";
    $: if (animations == "on" || animations == "off") {
        $config.animation = animations == "on";
    }
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
<p><b>UI:</b> <input type="number" bind:value={$config.uiScale}></p>
<p><b>Animations ("on"/"off"):</b> <input type="text" bind:value={animations}></p>
