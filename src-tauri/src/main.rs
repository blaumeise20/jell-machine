#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use tauri::{Menu, CustomMenuItem, MenuItem, Submenu, AboutMetadata, Manager};

fn main() {
    let menu = Menu::new()
        .add_submenu(Submenu::new("", Menu::new()
            .add_native_item(MenuItem::About("Jell Machine".to_string(), AboutMetadata::new()))
            .add_item(CustomMenuItem::new("reload", "Reload").accelerator("CommandOrControl+R"))
            .add_native_item(MenuItem::Separator)
            .add_native_item(MenuItem::Quit)
        ));
    tauri::Builder::default()
        .menu(menu)
        .on_menu_event(|event| {
            match event.menu_item_id() {
                "quit" => {
                    event.window().app_handle().exit(0);
                }
                "reload" => {
                    event.window().eval("location.reload();").unwrap();
                }
                _ => {}
            }
        })
        .invoke_handler(tauri::generate_handler![quit])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

// quit command
#[tauri::command]
fn quit(app: tauri::AppHandle) {
    app.exit(0);
}
