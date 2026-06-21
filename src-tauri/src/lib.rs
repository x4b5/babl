use std::net::TcpStream;
use std::process::{Child, Command};
use std::sync::Mutex;
use std::time::Duration;

use tauri::Manager;

/// Houdt het zelf-gestarte backend-proces vast, zodat we het bij afsluiten
/// netjes kunnen stoppen. `None` = de backend draaide al en is niet van ons.
struct BackendProcess(Mutex<Option<Child>>);

/// Check of er al iets op poort 8000 luistert (bijv. een handmatig gestarte backend).
fn backend_already_running() -> bool {
    let addr = "127.0.0.1:8000".parse().expect("vast localhost-adres");
    TcpStream::connect_timeout(&addr, Duration::from_millis(300)).is_ok()
}

/// Bepaal waar de Python-backend staat. Volgorde:
/// 1. `BABL_BACKEND_DIR` (handmatige overschrijving),
/// 2. `../backend` t.o.v. deze crate (ingebakken op build-moment — "voor jouw Mac").
fn backend_dir() -> String {
    std::env::var("BABL_BACKEND_DIR")
        .unwrap_or_else(|_| format!("{}/../backend", env!("CARGO_MANIFEST_DIR")))
}

/// Start de lokale Python-backend (uvicorn vanuit de venv).
/// Geeft `None` terug als de backend al draait of niet gestart kon worden —
/// in beide gevallen blijft de app werken (de health-check toont dan of
/// lokaal beschikbaar is).
fn start_backend() -> Option<Child> {
    if backend_already_running() {
        log::info!("Backend draait al op poort 8000 — niet opnieuw starten.");
        return None;
    }

    let dir = backend_dir();
    let uvicorn = format!("{dir}/.venv/bin/uvicorn");

    match Command::new(&uvicorn)
        .args(["main:app", "--port", "8000"])
        .current_dir(&dir)
        .spawn()
    {
        Ok(child) => {
            log::info!("Backend gestart vanuit {dir} (pid {}).", child.id());
            Some(child)
        }
        Err(e) => {
            log::warn!("Backend niet gestart ({uvicorn}): {e}");
            None
        }
    }
}

/// Stop het zelf-gestarte backend-proces (no-op als we het niet startten).
fn stop_backend(app: &tauri::AppHandle) {
    if let Some(state) = app.try_state::<BackendProcess>() {
        if let Ok(mut guard) = state.0.lock() {
            if let Some(mut child) = guard.take() {
                let _ = child.kill();
                log::info!("Backend gestopt.");
            }
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    #[allow(unused_mut)]
    let mut builder = tauri::Builder::default();

    // Single-instance: een tweede start focust het bestaande venster in plaats
    // van een tweede (stuurloze) kopie te openen. Moet de eerste plugin zijn.
    #[cfg(desktop)]
    {
        builder = builder.plugin(tauri_plugin_single_instance::init(|app, _argv, _cwd| {
            if let Some(w) = app.get_webview_window("main") {
                let _ = w.unminimize();
                let _ = w.set_focus();
            }
        }));
    }

    builder
        .manage(BackendProcess(Mutex::new(None)))
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            // Start de lokale backend mee (alleen desktop, niet mobiel).
            #[cfg(desktop)]
            {
                let child = start_backend();
                *app.state::<BackendProcess>().0.lock().unwrap() = child;
            }

            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while running tauri application")
        .run(|app_handle, event| {
            // Bij afsluiten van de app de meegestarte backend ook stoppen.
            if let tauri::RunEvent::Exit = event {
                stop_backend(app_handle);
            }
        });
}
