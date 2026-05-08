from playwright.sync_api import sync_playwright
import time
import os

def run_audit():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        # Define the base URL
        base_url = "http://localhost:3001"
        
        print(f"Navigating to {base_url}/clientes...")
        try:
            page.goto(f"{base_url}/clientes")
            page.wait_for_load_state("networkidle")
        except Exception as e:
            print(f"Error navigating: {e}")
            browser.close()
            return

        # 1. Check if page loaded
        title = page.title()
        print(f"Page Title: {title}")
        
        # 2. List all buttons on the page
        buttons = page.locator("button").all()
        print(f"Found {len(buttons)} buttons on the page.")
        for i, btn in enumerate(buttons):
            try:
                text = btn.inner_text().strip()
                if text:
                    print(f"Button {i}: '{text}'")
            except:
                pass

        # 3. Open "Novo Cliente" modal
        print("Attempting to click 'Novo Cliente' button...")
        novo_cliente_btn = page.get_by_text("Novo Cliente", exact=False)
        if novo_cliente_btn.is_visible():
            novo_cliente_btn.click()
            page.wait_for_timeout(1000) # Wait for modal animation
            print("Clicked 'Novo Cliente'. Checking modal...")
        else:
            print("'Novo Cliente' button not found.")
            # Take screenshot for debugging
            page.screenshot(path="clientes_page_error.png")
            browser.close()
            return

        # 4. Audit the Modal fields
        print("Auditing Modal fields...")
        # Search for CPF/CNPJ field
        cpf_field = page.get_by_placeholder("Documento")
        if cpf_field.is_visible():
            print("Found CPF/CNPJ field.")
            cpf_field.fill("123.456.789-00")
            print("Simulated filling CPF.")
        else:
            print("CPF/CNPJ field NOT found.")

        # Search for Empresa/Lead field
        lead_field = page.get_by_placeholder("Nome da empresa")
        if lead_field.is_visible():
            print("Found Empresa/Lead field.")
            lead_field.fill("Audit Company")
            print("Simulated filling Empresa.")
        else:
            print("Empresa/Lead field NOT found.")

        # Take a screenshot of the modal
        page.screenshot(path="modal_audit.png")
        print("Screenshot saved to modal_audit.png")

        # 5. Check "Salvar" button
        salvar_btn = page.get_by_text("Criar", exact=True)
        if salvar_btn.is_visible():
            print("Found 'Criar' button.")
        else:
            print("'Criar' button NOT found.")

        browser.close()

if __name__ == "__main__":
    run_audit()
