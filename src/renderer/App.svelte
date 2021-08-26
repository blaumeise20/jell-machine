<script>
    import "@utils/config";
    import "@utils/texturePacks";
    import EditorMain from "./ui/editor/EditorMain.svelte";
    import MainScreen from "./ui/MainScreen.svelte";
    import CreateOverlay from "./ui/CreateOverlay.svelte";
    import HelpScreen from "./ui/help/HelpScreen.svelte";
    import SettingsScreen from "./ui/settings/SettingsScreen.svelte";
    import { on } from "./ui/keys";
    import { openLevel } from "@core/grid";
    import { menuOpen, importLevel, showHelp, createLevel, settings } from "./ui/uiState";

    on("escape").when(() => !$importLevel && $openLevel).down(() => $menuOpen = !$menuOpen);
    on("escape").when(() => $importLevel && $openLevel && !$showHelp && !$createLevel && !$settings).down(() => $importLevel = false);
    on("escape").when(() => $showHelp).down(() => $showHelp = false);
    on("escape").when(() => $createLevel).down(() => $createLevel = false);
    on("escape").when(() => $settings).down(() => $settings = false);
</script>

<EditorMain />

<MainScreen />

<CreateOverlay />

<HelpScreen />

<SettingsScreen />
