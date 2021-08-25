<script>
    import "@utils/config";
    import "@utils/texturePacks";
    import EditorMain from "./ui/editor/EditorMain.svelte";
    import MainScreen from "./ui/MainScreen.svelte";
    import CreateOverlay from "./ui/CreateOverlay.svelte";
    import HelpScreen from "./ui/help/HelpScreen.svelte";
    import { on } from "./ui/keys";
    import { openLevel } from "@core/grid";
    import { menuOpen, importLevel, showHelp, createLevel } from "./ui/uiState";

    // onkey("Escape", () => $openLevel && ($menuOpen = !$menuOpen));
    on("escape").when(() => !$importLevel && $openLevel).down(() => $menuOpen = !$menuOpen);
    on("escape").when(() => $importLevel && $openLevel && !$showHelp && !$showHelp).down(() => $importLevel = false);
    on("escape").when(() => $showHelp).down(() => $showHelp = false);
    on("escape").when(() => $createLevel).down(() => $createLevel = false);
    // on("escape").when(() => $createLevel).down(() => ($importLevel = true, $createLevel = false));
</script>

<EditorMain />

<MainScreen />

<CreateOverlay />

<HelpScreen />
