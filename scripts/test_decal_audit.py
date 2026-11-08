"""Regression checks for evidence failure modes; no browser launch is required."""
import copy
import json
from pathlib import Path
import tempfile
import unittest
import numpy as np
from PIL import Image
from decal_audit_segmentation import mask_for,segment_source,THRESHOLD_OFFSETS
from decal_audit_photos import read_cached_crop,load_crop_manifest,sha256

ROOT=Path(__file__).resolve().parents[1]


class SegmentationTests(unittest.TestCase):
    def rectangles(self,height=18):
        mask=np.zeros((height+8,36),dtype=bool)
        mask[4:height+4,4:12]=True
        mask[4:height+4,18:28]=True
        return mask

    def test_matching_count_does_not_turn_one_pixel_noise_into_a_glyph(self):
        mask=np.zeros((50,100),dtype=bool)
        mask[1,5:8]=True
        mask[2:47,20:95]=True
        result=segment_source(mask,'70',threshold_masks=[mask,mask])
        self.assertTrue(result['method'].startswith('independent'))
        self.assertFalse(result['accepted'])
        self.assertEqual(result['eligible'],[False,False])
        self.assertEqual(result['gaps'],[None,None])

    def test_real_1970_source_fragments_are_not_scored(self):
        photo=Image.open(ROOT/'public/bc-decal-online-review/1970/photo.png').convert('RGB')
        region=json.loads((ROOT/'docs/research/decal-online-analysis/inspection-regions.json').read_text())['1970']['decal-year'][0]
        crop=photo.crop(tuple(round(value*(photo.width if index%2==0 else photo.height)) for index,value in enumerate(region)))
        mask,contrast=mask_for(crop,True)
        result=segment_source(mask,'70',contrast,[mask_for(crop,True,offset)[0] for offset in THRESHOLD_OFFSETS])
        self.assertFalse(result['accepted'])
        self.assertFalse(any(result['eligible']))
        self.assertEqual(result['gaps'],[None,None])

    def test_clear_isolated_occurrences_have_painted_gap(self):
        mask=self.rectangles()
        result=segment_source(mask,'77',threshold_masks=[mask,mask])
        self.assertTrue(result['accepted'])
        self.assertEqual(result['eligible'],[True,True])
        self.assertEqual(result['gaps'],[6,None])

    def test_nine_to_eleven_pixel_glyphs_no_longer_receive_scores_or_gaps(self):
        for height in [9,10,11]:
            mask=self.rectangles(height)
            result=segment_source(mask,'77',threshold_masks=[mask,mask])
            self.assertTrue(result['accepted'])
            self.assertEqual(result['eligible'],[False,False])
            self.assertEqual(result['gaps'],[None,None])

    def test_partition_windows_are_retained_without_measured_gaps(self):
        mask=self.rectangles()
        mask[5:20,31:34]=True
        result=segment_source(mask,'77')
        self.assertEqual(len(result['boxes']),2)
        self.assertFalse(result['accepted'])
        self.assertEqual(result['gaps'],[None,None])

    def test_crop_edge_low_contrast_and_threshold_instability_are_rejected(self):
        good=self.rectangles()
        clipped=good.copy();clipped[0:8,4:12]=True
        unstable=good.copy();unstable[:,18:28]=False
        for mask,contrast,alternatives in [(clipped,100,[clipped]),(good,10,[good]),(good,100,[unstable])]:
            result=segment_source(mask,'77',contrast,alternatives)
            self.assertFalse(result['accepted'])
            self.assertEqual(result['gaps'],[None,None])

    def test_empty_source_retains_two_unmeasured_windows(self):
        result=segment_source(np.zeros((30,40),dtype=bool),'70')
        self.assertEqual(len(result['boxes']),2)
        self.assertEqual(result['eligible'],[False,False])
        self.assertEqual(result['gaps'],[None,None])


class CachedPhotoTests(unittest.TestCase):
    def test_all_pinned_crops_match_corrected_bindings(self):
        references=json.loads((ROOT/'docs/research/decal-online-analysis/reference-manifest.json').read_text())
        manifest=load_crop_manifest(ROOT)
        self.assertEqual(len(references),68)
        self.assertEqual(set(manifest['specimens']),{reference['id'] for reference in references})
        for reference in references:
            _,provenance=read_cached_crop(reference,ROOT,manifest)
            self.assertFalse(provenance['originalBytesVerified'])
        by_id={reference['id']:reference for reference in references}
        self.assertEqual(by_id['1977']['control'],'7006989')
        self.assertEqual((by_id['1999']['month'],by_id['1999']['control']),('MAY','54174570'))
        self.assertTrue(by_id['1999']['source'].endswith('/1999-thick.jpg'))
        self.assertEqual(by_id['2017']['control'],'20993481')
        self.assertIn('20093481',by_id['2017']['source'])
        self.assertIn('inspectionRegions',by_id['1999'])

    def test_changed_or_rebound_crop_fails_instead_of_reusing_a_stale_photo(self):
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp)
            path=root/'photo.png';Image.new('RGB',(20,10),'white').save(path)
            reference={'id':'sample','source':'https://example.invalid/source.jpg','sourceSha256':'recorded-original','crop':[1,1,21,11]}
            manifest={'hashScope':'Local cropped bytes only','specimens':{'sample':{'file':'photo.png','sha256':sha256(path),'pixels':[20,10],'source':reference['source'],'recordedOriginalSha256':reference['sourceSha256'],'originalCrop':reference['crop']}}}
            _,provenance=read_cached_crop(reference,root,manifest)
            self.assertFalse(provenance['originalBytesVerified'])
            altered=copy.deepcopy(reference);altered['source']='https://example.invalid/different.jpg'
            with self.assertRaisesRegex(ValueError,'provenance'):read_cached_crop(altered,root,manifest)
            Image.new('RGB',(20,10),'black').save(path)
            with self.assertRaisesRegex(ValueError,'Changed cached crop'):read_cached_crop(reference,root,manifest)


if __name__=='__main__':unittest.main()
