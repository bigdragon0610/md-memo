#[tauri::command]
fn get_file_name() -> String {
    if cfg!(debug_assertions) {
        "index.dev.md".to_string()
    } else {
        "index.md".to_string()
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![get_file_name])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
