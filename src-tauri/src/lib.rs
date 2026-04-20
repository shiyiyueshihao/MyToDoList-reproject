// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

use tauri::Manager;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

// 窗口边界限制函数
fn constrain_window_position(window: &tauri::WebviewWindow) {
    if let Ok(Some(monitor)) = window.current_monitor() {
        if let Ok(position) = window.outer_position() {
            if let Ok(size) = window.outer_size() {
                let scale_factor = monitor.scale_factor();
                let available_size = monitor.size();

                // 转换为逻辑坐标
                let available_width = available_size.width as f64 / scale_factor;
                let available_height = available_size.height as f64 / scale_factor;
                let window_width = size.width as f64 / scale_factor;
                let window_height = size.height as f64 / scale_factor;
                let mut x = position.x as f64 / scale_factor;
                let mut y = position.y as f64 / scale_factor;

                // 限制窗口不超出屏幕边界（留出任务栏空间）
                let margin = 5.0; // 更小的边距，更贴近边缘
                if x < margin {
                    x = margin;
                }
                if y < margin {
                    y = margin;
                }
                if x + window_width > available_width - margin {
                    x = available_width - window_width - margin;
                }
                if y + window_height > available_height - margin {
                    y = available_height - window_height - margin;
                }

                // 如果位置发生变化，更新窗口位置
                let new_x = x * scale_factor;
                let new_y = y * scale_factor;
                if (new_x - position.x as f64).abs() > 1.0 || (new_y - position.y as f64).abs() > 1.0 {
                    let _ = window.set_position(tauri::Position::Logical(tauri::LogicalPosition { x, y }));
                }
            }
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_autostart::init(tauri_plugin_autostart::MacosLauncher::LaunchAgent, Some(vec!["--flag1", "--flag2"])))
        .setup(|app| {
            if let Some(window) = app.get_webview_window("main") {
                // 获取主显示器信息并计算右下角位置
                if let Ok(monitor) = window.current_monitor() {
                    if let Some(monitor) = monitor {
                        // 使用 available_size 获取可用区域（排除任务栏）
                        let available_size = monitor.size();
                        let scale_factor = monitor.scale_factor();

                        // 窗口尺寸
                        let window_width = 400.0;
                        let window_height = 600.0;
                        let margin = 10.0; // 减小边距，更贴近任务栏

                        // 计算右下角位置（考虑缩放和任务栏）
                        // 使用物理像素转换为逻辑像素
                        let available_width = available_size.width as f64 / scale_factor;
                        let available_height = available_size.height as f64 / scale_factor;

                        let x = available_width - window_width - margin;
                        let y = available_height - window_height - margin;

                        // 设置位置
                        let _ = window.set_position(tauri::Position::Logical(tauri::LogicalPosition { x, y }));
                    }
                }

                // 监听窗口移动事件，限制窗口边界
                let window_clone = window.clone();
                let _ = window.on_window_event(move |event| {
                    if let tauri::WindowEvent::Moved(_) = event {
                        constrain_window_position(&window_clone);
                    }
                });
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}