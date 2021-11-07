<script>
    import { UIElement } from "@core/ui/components/element";
    import { onMount } from "svelte";

    export let root: UIElement;

    let el: HTMLElement;

    onMount(() => {
        el.appendChild(root.element);
    });
</script>

<div bind:this={el}></div>
