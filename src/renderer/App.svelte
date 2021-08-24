<script>
    import "@utils/config";
    import "@utils/texturePacks";
    import EditorMain from "./ui/editor/EditorMain.svelte";
    import MainScreen from "./ui/MainScreen.svelte";
    import { on, onkey } from "./ui/keys";
    import { openLevel } from "@core/grid";
    import { menuOpen, importLevel } from "./ui/uiState";

    // onkey("Escape", () => $openLevel && ($menuOpen = !$menuOpen));
    on("escape").when(() => $openLevel).down(() => $menuOpen = !$menuOpen);
    on("escape").when(() => $importLevel && $openLevel).down(() => $importLevel = false);
    // on("escape").when(() => $createLevel).down(() => ($importLevel = true, $createLevel = false));
</script>

<EditorMain />

<MainScreen />
