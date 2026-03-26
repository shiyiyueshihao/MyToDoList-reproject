// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

use tauri::Manager; // 必须引入这个 Trait 才能调用 .get_webview_window()

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        // 在 setup 闭包里处理初始化逻辑
        .setup(|app| {
            // 注意：这里的 "main" 必须与 tauri.conf.json 中定义的 window label 一致
            // 如果你没改过，默认就是 "main"
            if let Some(window) = app.get_webview_window("main") {
                // 可以在这里设置背景色，防止透明穿透
                // window.set_background_color(Some(tauri::Color(255, 255, 255, 255))).ok();
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}