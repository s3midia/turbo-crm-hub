from playwright.sync_api import sync_playwright

def test_valuation_tab():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        # Listen for console errors
        errors = []
        page.on("pageerror", lambda err: errors.append(err))
        page.on("console", lambda msg: errors.append(msg.text) if msg.type == "error" else None)
        
        print("Navigating to Financeiro Valuation tab...")
        try:
            page.goto('http://localhost:3000/financeiro?tab=valuation', wait_until='networkidle')
            page.wait_for_timeout(5000) # Wait a bit for any late errors
            
            if errors:
                print("Detected errors:")
                for err in errors:
                    print(f"- {err}")
            else:
                print("No errors detected on initial load.")
                
            # Take a screenshot to see if it's white
            page.screenshot(path='/Users/s3midiadigital/.gemini/antigravity/scratch/turbo-crm-hub/turbo-crm-hub/valuation_test.png')
            print("Screenshot saved to valuation_test.png")
            
        except Exception as e:
            print(f"Error during navigation: {e}")
            
        browser.close()

if __name__ == "__main__":
    test_valuation_tab()
