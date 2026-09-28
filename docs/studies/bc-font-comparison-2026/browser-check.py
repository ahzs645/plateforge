import json
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).parent
checks=[]
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':1440,'height':1100},device_scale_factor=1)
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.set_content((ROOT/'output/bc-font-comparison.html').read_text(),wait_until='load')
    assert page.locator('.striprow').count()==12
    assert page.locator('.glyphtable tbody tr').count()==6
    assert not page.locator('#font-canvas').is_visible()
    checks.append('Static HTML has all 12 strips and 6 diagnostic glyph rows; no font substitute rendered.')
    page.screenshot(path=str(ROOT/'output/report-preview.png'),full_page=False)
    # Network is unavailable here. Explicitly exercise the failure state, not a fake photo success.
    page.route('https://**/*',lambda route:route.abort())
    page.get_by_role('button',name='Load online references',exact=True).click()
    page.wait_for_function("document.querySelector('#load-summary').textContent.includes('5 unavailable')")
    assert page.get_by_role('button',name='Reload online references').is_enabled()
    checks.append('Blocked external images produce an explicit source-link fallback and retry button.')
    # UI-only test with a locally available font; not a candidate-font accuracy comparison.
    font=Path('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf')
    page.locator('#font-file').set_input_files(str(font))
    page.wait_for_function("document.querySelector('#font-status').textContent.startsWith('Loaded locally:')")
    assert page.locator('#font-canvas').is_visible()
    page.locator('#font-text').select_option(label='976 SKP')
    assert not errors,errors
    checks.append('Local font-loading panel works with a system test font; no errors. No font file exported.')
    # Main overflow is constrained to intentionally scrollable comparison panels on a narrow viewport.
    page.set_viewport_size({'width':390,'height':844})
    assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth + 1')
    checks.append('Narrow viewport has no document-level horizontal overflow.')
    browser.close()
result={'scope':'Offline HTML functionality only; remote photos not browser-validated in this environment','passed':len(checks),'checks':checks,'page_errors':errors}
(ROOT/'output/browser-checks.json').write_text(json.dumps(result,indent=2))
print(json.dumps(result,indent=2))
