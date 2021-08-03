<script>
    import "./utils/config";
    import "./utils/texturePacks";
    import Menu from "./ui/Menu.svelte";
    import Main from "./ui/Main.svelte";
    import ImportOverlay from "./ui/ImportOverlay.svelte";
    import { on, onkey } from "./ui/keys";
    import { openLevel } from "./core/grid";
    import { menuOpen, importLevel } from "./ui/uiState";
// import CreateOverlay from "./ui/CreateOverlay.svelte";

    // onkey("Escape", () => $openLevel && ($menuOpen = !$menuOpen));
    on("escape").when(() => $openLevel).down(() => $menuOpen = !$menuOpen);
    on("escape").when(() => $importLevel && $openLevel).down(() => $importLevel = false);
    // on("escape").when(() => $createLevel).down(() => ($importLevel = true, $createLevel = false));
</script>

<Main />

<Menu />

<ImportOverlay />
