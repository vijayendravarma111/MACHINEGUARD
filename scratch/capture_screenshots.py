import os
import time
from playwright.sync_api import sync_playwright

ARTIFACT_DIR = r"C:\Users\vijayendravarma\.gemini\antigravity\brain\2e2ab25a-4811-43e0-8537-2f4755eff696"
PROJECT_SCREENSHOT_DIR = r"c:\Users\vijayendravarma\Desktop\Projects\MACHINEGUARD\Screenshots"

os.makedirs(ARTIFACT_DIR, exist_ok=True)
os.makedirs(PROJECT_SCREENSHOT_DIR, exist_ok=True)

PAGES_TO_CAPTURE = [
    ("01_dashboard.png", "http://localhost:3000/"),
    ("02_machines.png", "http://localhost:3000/machines"),
    ("03_machine_details.png", "http://localhost:3000/machines/MOTOR-004"),
    ("04_alerts.png", "http://localhost:3000/alerts"),
    ("05_maintenance.png", "http://localhost:3000/maintenance"),
    ("06_what_if_simulation.png", "http://localhost:3000/simulation"),
    ("07_system_settings.png", "http://localhost:3000/settings"),
    ("08_dashboard_highlight.png", "http://localhost:3000/"),
]

def capture_all():
    print("Launching Playwright Chromium browser...")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 1440, "height": 900},
            device_scale_factor=2 # 2x DPI high quality
        )
        page = context.new_page()

        # If on What-If simulation page, let's run a What-If calculation first so the result card is populated!
        for filename, url in PAGES_TO_CAPTURE:
            print(f"Navigating to {url}...")
            page.goto(url, wait_until="networkidle")
            time.sleep(1.5) # Allow animations & chart rendering to settle

            if "simulation" in url:
                # Click Run What-If button if present
                try:
                    btn = page.query_selector("button:has-text('RUN HYPOTHETICAL WHAT-IF SCENARIO')")
                    if btn:
                        print("Clicking What-If run scenario button...")
                        btn.click()
                        time.sleep(1.5)
                except Exception as e:
                    print(f"What-If run notice: {e}")

            # Save screenshot to artifact dir and project dir
            artifact_path = os.path.join(ARTIFACT_DIR, filename)
            project_path = os.path.join(PROJECT_SCREENSHOT_DIR, filename)

            page.screenshot(path=artifact_path, full_page=False)
            page.screenshot(path=project_path, full_page=False)
            print(f"-> Captured: {filename}")

        browser.close()
    print("All 8 screenshots successfully captured and saved!")

if __name__ == "__main__":
    capture_all()
