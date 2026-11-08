"""Focused checks for strict baselines, source scaling and Inkscape paint bounds."""
import importlib.util
from pathlib import Path
import shutil
import tempfile
import unittest
from PIL import Image

MODULE=Path(__file__).with_name('build-decal-correction-overlays.py')
SPEC=importlib.util.spec_from_file_location('decal_correction_overlays',MODULE)
builder=importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(builder)


class OverlayTests(unittest.TestCase):
    def test_missing_before_does_not_guess_a_baseline(self):
        with self.assertRaisesRegex(ValueError,'--before-json'):
            builder.select_before({'id':'1970'}, {}, None, {}, 'svg')
        for state in [True,None]:
            with self.assertRaisesRegex(ValueError,'complete clean checkout'):
                builder.clean_baseline({'commit':'abc','sourceSha256':'source','workingChanges':state})

    def test_explicit_before_field_is_honored(self):
        provenance={'commit':'abc','sourceSha256':'source','workingChanges':False}
        svg,_,origin=builder.select_before({'id':'1970'}, {}, {'1970':{'svg':'current','beforeSvg':'baseline'}},
                                          {'provenance':{'baseline':provenance}},'beforeSvg')
        self.assertEqual(svg,'baseline')
        self.assertEqual(origin['field'],'beforeSvg')

    def test_small_source_is_upscaled_uniformly_before_blending(self):
        with tempfile.TemporaryDirectory() as temporary:
            folder=Path(temporary)
            Image.new('RGB',(960,400),'blue').save(folder/'before.png')
            Image.new('RGB',(960,400),'green').save(folder/'after.png')
            result=builder.aligned_images(Image.new('RGB',(24,10),'red'),folder,400)
            with Image.open(folder/'source-aligned.png') as image:
                self.assertEqual(image.size,(960,400))
                self.assertEqual(image.getpixel((0,0)),(255,0,0))
                self.assertEqual(image.getpixel((959,399)),(255,0,0))
            self.assertEqual(result['sourceScale'],40)

    def test_mid_2017_family_boundary_uses_the_explicit_month(self):
        self.assertEqual(builder.family({'id':'2017','catalogueId':'2017','month':'JUN'}),'full')
        self.assertEqual(builder.family({'id':'2017','catalogueId':'2017','month':'JUL'}),'revised')

    @unittest.skipUnless(shutil.which('inkscape'),'Inkscape is required to check painted bounds')
    def test_inkscape_bounds_include_stroke_and_raw_svg_is_preserved(self):
        svg='<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><g data-role="decal-year" data-die="fixture" data-fit="natural" aria-label="70"><rect x="10" y="10" width="20" height="20" fill="black" stroke="black" stroke-width="4"/></g></svg>'
        with tempfile.TemporaryDirectory() as temporary:
            folder=Path(temporary)
            result=builder.render_svg(svg,{'id':'1970','month':None,'control':None},folder,'after',400,shutil.which('inkscape'))
            self.assertEqual((folder/'after.svg').read_text(),svg)
            self.assertEqual(result['runs'][0]['box'],[8,8,32,32])
            self.assertEqual(result['runs'][0]['fit'],'natural')
            self.assertEqual(result['rasterPixels'],[400,400])


if __name__=='__main__':unittest.main()
