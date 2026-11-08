"""Run only where Chromium can launch; a launch failure is a blocked check."""
import os
from pathlib import Path
import unittest
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
EXTRACTOR='('+(ROOT/'scripts/decal-audit-browser.mjs').read_text().replace('export default ','',1)+')'


class PaintedBoundsTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.playwright=sync_playwright().start()
        cls.browser=cls.playwright.chromium.launch(executable_path=os.environ.get('DECAL_ANALYSIS_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
        cls.page=cls.browser.new_page()

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.playwright.stop()

    def extract(self,body):
        self.page.set_content('<svg xmlns="http://www.w3.org/2000/svg" width="140" height="100" viewBox="0 0 140 100">'+body+'</svg>')
        return self.page.evaluate(EXTRACTOR)[0]['chars']

    def pair(self,stroke='black'):
        return '<g data-die="test" data-role="decal-month" aria-label="AB" stroke="black" stroke-width="4">'+''.join(
            f'<g data-character="{char}"><rect x="{x}" y="10" width="20" height="20" fill="black" stroke="{stroke}"/></g>'
            for char,x in [('A',10),('B',40)])+'</g>'

    def test_painted_gap_includes_stroke_and_geometry_stays_separate(self):
        first,second=self.extract(self.pair())
        self.assertEqual(first['geometryBox'],[10,10,30,30])
        self.assertEqual(first['inkBox'],[8,8,32,32])
        self.assertEqual(second['geometryBox'][0]-first['geometryBox'][2],10)
        self.assertEqual(second['inkBox'][0]-first['inkBox'][2],6)

    def test_explicit_stroke_none_is_not_repainted_as_black_stroke(self):
        first,_=self.extract(self.pair('none'))
        self.assertEqual(first['inkBox'],first['geometryBox'])

    def test_rotated_runs_keep_the_correct_painted_text_direction(self):
        first,second=self.extract('<g transform="translate(80 80) rotate(-90)">'+self.pair()+'</g>')
        self.assertEqual(first['inkBox'],[88,48,112,72])
        self.assertEqual(first['inkBox'][1]-second['inkBox'][3],6)

    def test_page_clipping_is_flagged(self):
        char=self.extract('<g data-die="test" data-role="decal-year" aria-label="1"><g data-character="1"><rect x="0" y="20" width="8" height="30" fill="black" stroke="black" stroke-width="4"/></g></g>')[0]
        self.assertTrue(char['inkClipped'])


if __name__=='__main__':unittest.main()
