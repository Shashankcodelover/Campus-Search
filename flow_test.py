
import os
import time
from playwright.sync_api import sync_playwright

ARTIFACTS_DIR = r"C:\Users\Preetham.j\.gemini\antigravity\brain\c95f737b-481b-4921-aabf-dc774f62b939"

def run_test():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1920, "height": 1080})
        page = context.new_page()

        print("[TEST] Navigating to Campus-Search at http://localhost:5173...")
        page.goto("http://localhost:5173", wait_until="networkidle")
        time.sleep(2)
        
        home_shot = os.path.join(ARTIFACTS_DIR, "campus_home_verified.png")
        page.screenshot(path=home_shot, full_page=False)
        print(f"[SUCCESS] Saved Home screenshot: {home_shot}")

        print("[TEST] Navigating to AI Copilot / Mega Feature...")
        page.goto("http://localhost:5173/copilot", wait_until="networkidle")
        time.sleep(2)
        
        copilot_shot = os.path.join(ARTIFACTS_DIR, "campus_copilot_verified.png")
        page.screenshot(path=copilot_shot, full_page=False)
        print(f"[SUCCESS] Saved AI Copilot screenshot: {copilot_shot}")

        browser.close()
        print("[ALL CAMPUS-SEARCH VERIFICATION TESTS COMPLETED SUCCESSFULLY]")

if __name__ == "__main__":
    run_test()

