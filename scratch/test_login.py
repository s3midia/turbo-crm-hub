from playwright.sync_api import sync_playwright
import unittest

class TestLoginPage(unittest.TestCase):
    def setUp(self):
        self.pw = sync_playwright().start()
        self.browser = self.pw.chromium.launch(headless=True)
        self.context = self.browser.new_context()
        self.page = self.context.new_page()

    def tearDown(self):
        self.browser.close()
        self.pw.stop()

    def test_login_page_has_google_button(self):
        self.page.goto('http://localhost:3000')
        self.page.wait_for_load_state('networkidle')
        
        # Check for Google button
        google_button = self.page.locator('text=Continuar com Google')
        self.assertTrue(google_button.is_visible(), "Google login button should be visible")

if __name__ == "__main__":
    unittest.main()
