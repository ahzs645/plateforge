"""Guard actual clipped-MAY regression and invalid threshold evidence."""
from pathlib import Path
import importlib.util
import unittest
import numpy as np
from PIL import Image

HERE=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('lettering_analysis',HERE/'analyze.py')
audit=importlib.util.module_from_spec(spec)
spec.loader.exec_module(audit)

class ThresholdEvidenceTests(unittest.TestCase):
    def test_original_may_roi_rejects_clipped_high_threshold(self):
        p=audit.ROOT/'public/bc-decal-corrections/evidence/1999/source.png'
        a=np.asarray(Image.open(p).convert('L').crop([10,9,101,63]),dtype=float)
        result,_,_,_=audit.evaluate_threshold_sample(a,142.523,False)
        self.assertFalse(result['accepted'])
        self.assertEqual(result['paintedBoxInCrop'][0],0)
        self.assertIn('Painted component touches the crop boundary',result['rejectionReasons'])
        self.assertIsNone(result['widthPerHeight'])

    def test_wider_may_roi_preserves_clearance_at_every_tested_threshold(self):
        p=audit.ROOT/'public/bc-decal-corrections/evidence/1999/source.png'
        _,_,_,_,samples,_=audit.source_mask(Image.open(p).convert('RGB').crop([8,9,101,63]),False)
        self.assertEqual(len(samples),5)
        self.assertTrue(all(s['accepted'] for s in samples))
        self.assertGreaterEqual(min(min(s['cropClearancePixels']) for s in samples),2)

    def test_low_contrast_sample_has_no_measurable_ratio(self):
        a=np.full((32,30),140.,dtype=float)
        a[4:28,8:18]=120
        result,_,_,_=audit.evaluate_threshold_sample(a,130,False)
        self.assertFalse(result['accepted'])
        self.assertIn('Insufficient intensity-class contrast: below 25 luminance levels',result['rejectionReasons'])
        self.assertIsNone(result['widthPerHeight'])

    def test_empty_threshold_is_retained_as_rejected(self):
        a=np.full((32,30),180.,dtype=float)
        result,_,_,_=audit.evaluate_threshold_sample(a,90,False)
        self.assertFalse(result['accepted'])
        self.assertIsNone(result['paintedBoxInCrop'])
        self.assertIsNone(result['widthPerHeight'])
        self.assertIn('No sufficiently tall painted component',result['rejectionReasons'])

    def test_short_glyph_sample_is_rejected(self):
        a=np.full((15,18),230.,dtype=float)
        a[2:13,5:12]=20
        result,_,_,_=audit.evaluate_threshold_sample(a,125,False)
        self.assertFalse(result['accepted'])
        self.assertIn('Painted height is below 12 pixels',result['rejectionReasons'])
        self.assertIsNone(result['widthPerHeight'])

if __name__=='__main__':unittest.main()
