from playwright.sync_api import sync_playwright
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        # Navigate to the financeiro page and then the valuation tab
        # Note: We might need to bypass login if there's any.
        # For now, let's just try to reach the root and see what's there.
        try:
            page.goto('http://localhost:3000/financeiro')
            page.wait_for_load_state('networkidle')
            
            # Take screenshot
            screenshot_path = '/Users/s3midiadigital/.gemini/antigravity/scratch/turbo-crm-hub/turbo-crm-hub/valuation_tab.png'
            page.screenshot(path=screenshot_path, full_page=True)
            print(f"Screenshot saved to {screenshot_path}")
            
            # Print page title and some content
            print(f"Page Title: {page.title()}")
            
        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    run()
