<script lang="ts">
    export let visible: boolean;
</script>

<style lang="scss">
    .popup_backdrop {
        background-color: rgba(0, 0, 0, 0.5);
        bottom: 0;
        left: 0;
        position: fixed;
        right: 0;
        top: 0;
        z-index: 1000;
    }
    .popup_overlay {
        background-color: #363636;
        left: 50%;
        padding: 20px;
        position: fixed;
        top: 50%;
        transform: translate(-50%, -50%);
        z-index: 1001;
    }
</style>

{#if visible}
    <div class="popup_backdrop"></div>
    <div class="popup_overlay">
        <slot />
    </div>
{/if}
