#!/usr/bin/env python3
"""Author missing Persian numeric masters from inspected, source-specific design notes.

This is explicitly reconstruction, not tracing or a licensed-font substitution.
Observed contours are never rewritten. Coordinates below describe smooth original
outlines in each alphabet's shared cap plane. Widths are design dimensions, not
horizontal transforms of existing glyphs. Only a uniform cap scale converts those
newly constructed outlines to that source alphabet's coordinate plane.
"""
from pathlib import Path
import json
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.svgLib.path import parse_path
DOC=Path(__file__).resolve().parent
DIGITS='۰۱۲۳۴۵۶۷۸۹'
# Widths are nominal cap-relative design dimensions for 0..9. All sources inspected
# individually. The optional secondary-role records were reviewed independently.
# stroke is the crown/loop band, while stems taper independently toward the foot.
DESIGNS={
'historic-1947-study':dict(widths=[22,17,43,60,48,61,47,61,55,42],stroke=13, six='hook', lean=-3, note='Tall 1947 white brushlike figures: generous angular crowns, long pinched descending stems, open hooked six, compact diamond zero. Broad V branches follow the observed seven; the unseen looped figures remain low-confidence.'),
'historic-1949-study':dict(widths=[25,20,43,55,43,69,46,57,54,45],stroke=12,six='hook',lean=-2,note='1949 narrow tapering stems, stepped crowns, angular open four and deep hollow heart five. Inferred figures keep the light internal stems and pointed terminals visible in the photographed three/four/five.'),
'historic-1954-study':dict(widths=[31,19,47,63,48,61,48,59,55,43],stroke=13,six='hook',lean=-3,note='1954 broad shouldered two with a vertical pinched foot; zero remains a small central lozenge. Missing figures carry the same open crown and taper, without asserting their historical die form.'),
'historic-1956-study':dict(widths=[26,19,42,60,45,70,48,58,55,44],stroke=12,six='hook',lean=-1,note='1956 strong horizontal crowns and very narrow straight lower stems. Broad hollow two-lobed five sets the loop contrast; curled four supports a hooked rather than squared-six inference.'),
'historic-1960-study':dict(widths=[24,12,39,54,41,57,40,46,49,35],stroke=10,six='hook',lean=-2,note='1960 unusually narrow numeral system: thin blade one, high pinched crowns, slim V and upright split eight. Curved strokes and counters retain light weight; no wide modern-font forms are imported.'),
'historic-1961-study':dict(widths=[24,17,44,61,43,65,43,52,50,38],stroke=11,six='hook',lean=-2,note='1961 tapered two, tall rounded heart five and long narrow V/caret stems. The heavier crown transitions to a fine lower stem, retaining this specimen’s narrow-foot contrast.'),
'historic-1963-study':dict(widths=[25,19,44,58,46,62,42,54,51,36],stroke=13,six='bar',lean=-2,note='1963 bold crown, blade one and squared open six with a down-curved right foot. Small zero stays a lozenge near mid-cap; looped nine supplies the counter thickness.'),
'historic-1964-city-study':dict(widths=[24,19,42,60,44,60,42,53,50,38],stroke=13,six='bar',lean=-3,note='Full-city 1964 broad, level joined crowns of two/three and thick blade one narrowing strongly at the foot. New curves use those local crown and stem proportions; unseen six is a documented squared-six hypothesis.'),
'historic-1969-rasht-study':dict(widths=[25,25,45,67,48,64,45,60,56,41],stroke=14,six='bar',lean=0,note='Rasht 1969 compact broad upper masses, slanted blade one, compact round crowns and widely splayed seven. Forms are deliberately stouter than the narrow 1960 specimen.'),
'historic-1969-tehran-study':dict(widths=[26,22,52,65,57,65,45,55,54,43],stroke=13,six='bar',lean=1,note='Tehran 1969 rounded open four and broad crown two, short blade one, squared six and compact looped nine. Inferred three inherits the crown rhythm rather than a generic display font.'),
'historic-fullcity-letter-study':dict(widths=[26,22,48,61,55,65,48,57,54,42],stroke=14,six='bar',lean=2,note='Full-city letter plate has thick short squared six and small round-loop nine with a rightward bent foot. Missing figures keep that robust, compact, slightly right-leading treatment.'),
'historic-1970-commercial-study':dict(widths=[26,21,46,59,46,63,49,56,64,40],stroke=13,six='bar',lean=1,note='Orange commercial specimen has a thick short barred six, slim one and widely spreading eight. Missing figures use compact blunt crowns and that heavier terminal treatment.'),
'historic-old-government-study':dict(widths=[32,23,49,65,53,65,47,61,58,44],stroke=14,six='bar',lean=1,note='Old government plate’s broad short crowns, broad curled four and heavy V guide a compact heavy alphabet; its central lozenge remains small rather than cap height.'),
'historic-1993-private-study':dict(widths=[25,35,50,65,59,66,48,65,61,48],stroke=14,six='hook',lean=9,note='1993 private specimen has a notably forward-leaning blade one and broad rounded open four. The inferred stems lean with the observed one and seven, retaining narrow feet and broad upper diagonals.'),
'historic-1993-commercial-study':dict(widths=[24,31,50,63,54,57,55,61,58,46],stroke=13,six='hook',lean=7,note='1993 commercial plate uses a forward-sloping one, tall narrow hollow five and an open hooked six. Added figures keep that rightward stem tendency and thin lower terminals.'),
'historic-1993-government-study':dict(widths=[25,30,66,76,63,68,55,62,59,46],stroke=13,six='hook',lean=6,note='1993 government crown two is unusually wide and shallow; blade one leans forward, four is open and low, five is tall with two rounded feet. Added three keeps the wide crown rhythm.'),
'historic-cityband-truck-study':dict(widths=[25,35,54,68,58,64,52,57,56,52],stroke=15,six='hook',lean=10,note='Truck city-band plate is heavy and forward leaning: broad blade one, right-bent looped nine, thick curled four and steep V. Inferred figures retain the heavy upper mass and tapered lower stem.'),
'historic-1960s-consular-study':dict(widths=[22,17,38,52,40,55,41,49,46,34],stroke=9,six='hook',lean=-3,note='Consular source shows only a thin tall blade one. All other numerals are low-confidence original stylistic extrapolations from its stroke contrast and slant; no claim is made that their historical forms are observed.'),
'wlp-us-military-study':dict(widths=[32,23,53,66,53,64,48,58,51,45],stroke=18,six='hook',lean=-1,note='U.S. military source has exceptionally broad wedge terminals in eight and a deep hooked six. The added figures use heavy crown bands, sharp necks and fine lower tips, with the observed central lozenge retained.'),
'wlp-us-topographical-study':dict(widths=[24,18,44,57,55,58,44,58,60,38],stroke=11,six='hook',lean=-2,note='Topographical team source has light narrow stems, separately articulated upper bowls in three/four, splayed V/caret and a small diamond zero. Missing forms keep that finer calligraphic contrast.'),
}
ROLE_DESIGNS={
('historic-1947-study','year'):dict(widths=[27,20,42,58,48,64,50,56,54,43],stroke=14,six='hook',lean=-2,note='Independent small 1947 year: flat shallow two crown, short squared stem and compact open six; thicker joins reflect the small role rather than downscaled main figures.'),
('historic-1949-study','year'):dict(widths=[28,23,63,73,52,67,49,73,85,47],stroke=17,six='hook',lean=0,note='Independent small 1949 year: broad block two with nearly vertical stem and sharply triangular eight. Added figures keep the large apertures and blunt compact terminal construction.'),
('historic-1954-study','year'):dict(widths=[29,23,64,90,60,70,58,73,69,52],stroke=17,six='hook',lean=-5,note='Independent small 1954 year: only broad three is observed. Shallow large crown, left-tapering base and strong weight are preserved; every other year figure is expressly low confidence.'),
('historic-1956-study','year'):dict(widths=[27,20,45,60,46,70,46,60,57,43],stroke=14,six='hook',lean=0,note='Independent small 1956 year: compact upright crown-three and unusual small closed five establish thicker, shorter joins than the main row.'),
('historic-1960-study','year'):dict(widths=[24,19,49,73,48,59,44,57,54,44],stroke=15,six='hook',lean=-2,note='Independent small 1960 year: broad three and small closed-loop nine have near-block shoulders and short tapered terminals. Added digits retain that high weight at small size.'),
('historic-1961-study','year'):dict(widths=[25,21,48,61,49,64,46,57,55,43],stroke=13,six='hook',lean=0,zero='oval',note='Independent small 1961 year: open curled four and a tiny oval zero, with rounder compact strokes. The main-row diamond is not substituted for this role’s oval.'),
('historic-1963-study','year'):dict(widths=[26,22,53,68,50,65,49,61,58,44],stroke=14,six='hook',lean=-2,note='Independent small 1963 year: short right-curled four and angled crown-two. The role keeps stronger blunt joins, tighter counters and shorter foot treatment than the main row.'),
('historic-1964-city-study','extension'):dict(widths=[25,19,45,59,45,61,44,55,53,39],stroke=12,six='bar',lean=-3,note='Independent 1964 extension: slim hooked one and low broad crown-three; added figures retain those lighter stems rather than copying the heavier main row.'),
('historic-1969-tehran-study','extension'):dict(widths=[29,25,51,65,56,68,52,63,59,60],stroke=17,six='bar',lean=2,note='Independent Tehran small extension: thick miniature one and compact, nearly square nine. New figures preserve the short, blunt, broad treatment rather than shrinking the main set.'),
('historic-1970-commercial-study','extension'):dict(widths=[26,21,46,60,48,63,47,57,55,41],stroke=14,six='bar',lean=-1,note='Independent commercial extension: upright very thin one, compact crown-two with stronger shoulder; new figures keep those narrow stems and strong joins.'),
('historic-1993-private-study','extension'):dict(widths=[26,33,52,65,66,66,53,65,61,48],stroke=14,six='hook',lean=8,note='Independent header extension: forward leaning one and short broad curled four. Added figures keep the miniature role’s round joins and explicitly measured right lean.'),
}

# Contextual numeric roles are independently designed, not reduced main numerals.
# These structural choices come from each role's visible cap/crown/terminal forms.
DESIGNS['historic-1949-study'].update(structure='angular', one='chisel')
DESIGNS['historic-1954-study'].update(one='chisel')
DESIGNS['historic-1956-study'].update(one='straight-blade')
DESIGNS['historic-1960-study'].update(one='fine-curved')
DESIGNS['historic-1964-city-study'].update(one='heavy-blade')
DESIGNS['historic-1969-rasht-study'].update(one='short-chisel')
DESIGNS['wlp-us-military-study'].update(structure='wedge',stroke=20)
for key, style in {
 ('historic-1947-study','year'):dict(structure='tab-flat',stroke=15,one='tab'),
 ('historic-1949-study','year'):dict(structure='tab-block',stroke=25,one='tab'),
 ('historic-1954-study','year'):dict(structure='tab-block',stroke=23,one='tab'),
 ('historic-1956-study','year'):dict(structure='tab-flat',stroke=16,one='tab'),
 ('historic-1960-study','year'):dict(structure='tab-block',stroke=20,one='tab'),
 ('historic-1961-study','year'):dict(structure='tab-flat',stroke=14,one='tab'),
 ('historic-1963-study','year'):dict(structure='tab-flat',stroke=17,one='tab'),
 ('historic-1969-tehran-study','extension'):dict(structure='tab-block',stroke=20,one='tab'),
}.items():ROLE_DESIGNS[key].update(style)

def f(n):return f'{n:.4f}'.rstrip('0').rstrip('.') if n else '0'
class Outline:
 def __init__(self):self.parts=[]
 def c(self,cmd,*n):self.parts.append(cmd+' '.join(f(v) for v in n));return self
 def path(self):return ' '.join(self.parts)
def tab_outline(ch,d):
 w=d['widths'][DIGITS.index(ch)];t=d['stroke'];lean=d['lean'];p=Outline();c=p.c
 heavy=d['structure']=='tab-block';band=t*1.3 if heavy else t
 # Widths, counters and stems are drawn directly. The only transform later is
 # the alphabet-wide conversion from 100 cap units to source pixels.
 if ch=='۱':
  c('M',w*.35,0);c('L',w*.82,9);c('Q',w*.98,29,w*.85,55);c('L',w*.71,91);c('L',w*.35,100);c('L',w*.32,52);c('L',0,14);c('Z')
 elif ch in '۲۳':
  wc=w*.6 if ch=='۳' else w
  c('M',0,5);c('Q',wc*.25,14,wc*.47,12);c('Q',wc*.75,13,wc*.97,4)
  if ch=='۳':c('Q',w*.76,14,w*.98,5)
  c('L',w,band);c('Q',w*.87,band+8,w*.64,band+8)
  if ch=='۳':c('Q',w*.55,band+12,w*.44,band+9)
  stemx=wc*.38
  c('L',stemx+band*.22,band+10);c('L',stemx+band*.18,79);c('L',stemx-band*.1,100);c('L',stemx-band*.65,100 if heavy else 90);c('L',stemx-band*.65,43);c('L',0,band+6);c('Z')
 elif ch=='۴':
  if heavy:
   c('M',w*.7,0);c('L',w*.8,16);c('L',w*.43,33);c('L',w*.75,44);c('L',w*.62,63);c('L',w*.33,81);c('Q',w*.65,83,w*.99,71);c('L',w*.92,94);c('Q',w*.34,112,w*.04,96);c('Q',-w*.06,84,w*.14,66);c('L',w*.33,52);c('L',w*.04,39);c('L',w*.15,22);c('Z');return p.path()
  c('M',w*.7,0);c('L',w*.77,11);c('L',w*.34,29);c('L',w*.32,34);c('L',w*.74,43);c('L',w*.65,56);c('L',w*.32,77);c('Q',w*.21,88,w*.44,85);c('L',w,76);c('L',w*.86,97);c('Q',w*.32,110,w*.06,94);c('Q',-w*.02,81,w*.17,62);c('L',w*.35,51);c('L',w*.06,42);c('L',w*.1,28);c('Z')
 elif ch=='۵':
  c('M',w*.49,0);c('L',w*.96,65);c('Q',w*1.1,100,w*.76,100);c('Q',w*.57,102,w*.48,93);c('Q',w*.22,105,w*.04,93);c('Q',-w*.06,79,w*.1,55);c('Z')
  inset=min(w*.3,t*.75);c('M',w*.5,25 if heavy else 19);c('L',inset,72);c('Q',inset*.7,87,w*.3,85);c('L',w*.48,78);c('L',w*.62,86);c('Q',w-inset*.35,89,w-inset,69);c('Z')
 elif ch=='۶':
  if d['six']=='bar':
   c('M',0,3);c('L',w,3);c('L',w*.79,38);c('L',w*.79,65);c('L',w*.98,83);c('L',w*.77,101);c('Q',w*.42,87,w*.47,60);c('L',w*.56,band);c('L',0,band);c('Z')
  else:
   if heavy:
    c('M',w*.8,0);c('L',w,13);c('Q',w*.45,16,w*.34,31);c('Q',w*.56,35,w,22);c('L',w*.98,50);c('Q',w*.61,65,w*.26,100);c('L',0,100);c('Q',w*.12,76,w*.4,60);c('Q',-w*.04,62,w*.03,30);c('Q',w*.18,9,w*.8,0);c('Z');return p.path()
   c('M',w*.8,0);c('L',w*.92,12);c('Q',w*.42,11,w*.3,34);c('Q',w*.5,41,w,29);c('L',w*.96,49);c('Q',w*.44,68,w*.14,100);c('L',w*.04,97);c('Q',w*.15,75,w*.46,56);c('Q',w*.02,60,w*.07,34);c('Q',w*.17,12,w*.8,0);c('Z')
 elif ch=='۷':
  c('M',w*.08,0);c('L',w*.5,39 if heavy else 51);c('L',w*.9,0);c('L',w,17);c('L',w*(.69 if heavy else .62),72);c('L',w*.57,100);c('L',w*.39,100);c('L',w*(.3 if heavy else .35),73);c('L',0,17);c('Z')
 elif ch=='۸':
  c('M',w*.49,0);c('L',w,82);c('L',w*.88,100);c('L',w*.54,48 if heavy else 51);c('L',w*.43,48 if heavy else 51);c('L',w*.12,100);c('L',0,84);c('Z')
 elif ch=='۹':
  c('M',w*.56,0);c('Q',w*.99,-2,w*.97,28);c('L',w*.77,62);c('L',w*.94,82);c('L',w*.7,100);c('L',w*.51,100);c('Q',w*.31,81,w*.4,62);c('L',w*.5,47);c('Q',w*.08,54,0,33);c('Q',0,9,w*.56,0);c('Z')
  c('M',w*.5,17);c('Q',w*.25,17,w*.24,29);c('Q',w*.24,38,w*.63,33);c('Q',w*.83,15,w*.5,17);c('Z')
 return p.path()

def outline(ch,d):
 w=d['widths'][DIGITS.index(ch)];t=d['stroke'];lean=d['lean']; p=Outline();c=p.c
 structure=d.get('structure','brush');block=structure.startswith('tab');angular=structure=='angular'; band=t; thickness=t/13
 # Small-role contours have flat shoulders, heavier stems and clipped terminals.
 if block and ch!='۰':
  return tab_outline(ch,d)
 # Each construction is authored directly at its natural source-style width.
 # No font paths, borrowed glyph outlines or anisotropic matrices are used.
 if ch=='۰':
  y=50;h=w*.82
  if d.get('zero')=='oval':
   c('M',w*.5,y-h*.5);c('C',w,y-h*.5,w,y+h*.5,w*.5,y+h*.5);c('C',0,y+h*.5,0,y-h*.5,w*.5,y-h*.5);c('Z')
  else:
   c('M',w*.49,y-h*.5);c('Q',w*.82,y-h*.12,w,y);c('Q',w*.7,y+h*.33,w*.48,y+h*.5);c('Q',w*.15,y+h*.15,0,y);c('Q',w*.16,y-h*.29,w*.49,y-h*.5);c('Z')
 elif ch=='۱':
  if d.get('one') in ['chisel','straight-blade','short-chisel']:
   c('M',w*.63,0);c('L',w,16);c('L',w*.88,63);c('Q',w*.83,88,w*.35,100);c('L',w*.25,99);c('L',w*.48,46);c('L',0,18);c('Z');return p.path()
  c('M',w*.48,0);c('C',w*.91,13,w+lean*.1,41,w*.79+lean*.14,65);c('C',w*.76+lean*.19,84,w*.6+lean*.3,95,w*.4+lean*.38,100);c('L',w*.33+lean*.38,98);c('C',w*.53+lean*.22,71,w*.38+lean*.1,46,0,19);c('Q',w*.1,9,w*.48,0);c('Z')
 elif ch in '۲۳':
  branch=.61 if ch=='۳' else 1;wc=w*branch
  c('M',wc*.2,0);c('C',wc*.42,13,wc*.74,17,wc*.91,6)
  if ch=='۳':
   c('Q',wc*.99,3,wc,1);c('Q',w*.84,13,w*.97,1);c('L',w,0);c('C',w,15,w*.91,23,w*.81,23);c('Q',w*.7,23,wc*.97,21)
  else:c('L',w,0)
  c('C',wc*1.02,19,wc*.8,18+t,wc*.57,20+t);c('C',wc*.49+(t-13)*.25+lean*.03,46,wc*.66+(t-13)*.18+lean*.1,77,wc*.42+lean*.13,96);c('L',wc*.37+lean*.13,100);c('L',wc*.33+lean*.13,97);c('C',wc*.38-(t-13)*.12+lean*.1,74,wc*.22-(t-13)*.2,42,wc*.03,26);c('L',0,17);c('Z')
 elif ch=='۴':
  c('M',w*.75,0);c('L',w*.76,9);c('C',w*.57,16,w*.31,23,w*.32,32);c('C',w*.54,37,w*.77,42,w*.61,53);c('C',w*.43,68,w*.2,79,w*.31,87);c('C',w*.47,94,w*.77,84,w,82);c('L',w*.91,94);c('C',w*.71,103,w*.22,106,w*.08,94);c('C',-w*.03,85,w*.2,65,w*.43,52);c('C',w*.14,49,w*.01,44,w*.12,33);c('C',w*.28,16,w*.51,7,w*.75,0);c('Z')
 elif ch=='۵':
  c('M',w*.5,0);c('C',w*.67,16,w*.88,38,w*.97,66);c('C',w*1.08,91,w*.92,103,w*.71,102);c('Q',w*.59,102,w*.5,94);c('Q',w*.27,109,w*.09,98);c('C',-w*.11,85,w*.09,55,w*.25,34);c('Q',w*.39,15,w*.5,0);c('Z')
  inset=min(t*.75,w*.23);c('M',w*.5,17);c('C',w*.35,38,inset,64,inset,81);c('Q',inset,94,w*.37,88);c('Q',w*.47,81,w*.51,81);c('Q',w*.57,90,w*.75,90);c('C',w-inset,92,w-inset*.45,79,w-inset,66);c('C',w*.77,47,w*.62,28,w*.5,17);c('Z')
 elif ch=='۶':
  if d['six']=='bar':
   c('M',w*.08,0);c('Q',w*.45,5,w*.87,2);c('L',w*.99,0);c('C',w*.87,19,w*.72,35,w*.73,54);c('C',w*.73,67,w*.84,77,w,85);c('L',w*.87,96);c('L',w*.77,101);c('C',w*.51,88,w*.45,70,w*.49,55);c('Q',w*.53,36,w*.63,25);c('Q',w*.24,25,0,22);c('Z')
  else:
   if angular:
    c('M',w*.86,0);c('L',w*.86,10);c('L',w*.35,29);c('L',w*.3,37);c('L',w*.94,34);c('L',w,44);c('L',w*.57,64);c('L',w*.22,100);c('L',w*.08,100);c('L',w*.23,77);c('L',w*.59,53);c('L',w*.18,51);c('L',w*.08,43);c('L',w*.2,26);c('Z');return p.path()
   c('M',w*.81,0);c('L',w*.88,10);c('C',w*.59,10,w*.24,23,w*.28,35);c('C',w*.47,46,w*.81,35,w,28);c('L',w*.96,45);c('C',w*.54,63,w*.28,82,w*.15,100);c('L',w*.09,100);c('C',w*.09,85,w*.34,64,w*.54,52);c('C',w*.17,54,w*.02,44,w*.15,30);c('C',w*.32,13,w*.6,3,w*.81,0);c('Z')
 elif ch=='۷':
  c('M',w*.1,0);c('C',w*.26,14,w*.29,31,w*.44,46);c('Q',w*.5,54,w*.55,44);c('C',w*.7,26,w*.75,8,w*.9,0);c('L',w,14);c('C',w*.9,30,w*.66,45,w*.6,66);c('L',w*.54+lean*.06,96);c('L',w*.49+lean*.06,100);c('L',w*.45+lean*.06,100);c('C',w*.44,77,w*.36,59,w*.22,40);c('L',w*.02,12+t);c('Q',-w*.02,13,w*.1,0);c('Z')
 elif ch=='۸':
  c('M',w*.51,0);c('L',w*.56,1);c('C',w*.53,24,w*.73,48,w*.94,70);c('L',w,85);c('L',w*.92,99);c('C',w*.72-(t-13)*.5,84,w*.64-(t-13)*.4,62,w*.52,47-(t-13)*.8);c('L',w*.48,47-(t-13)*.8);c('C',w*.33+(t-13)*.4,65,w*.25+(t-13)*.5,86,w*.09,100);c('L',0,85);c('C',w*.02,74,w*.28,46,w*.37,27);c('Z')
 elif ch=='۹':
  c('M',w*.62,0);c('C',w*.94,-2,w*.96,15,w*.81,36);c('C',w*.63,57,w*.61,70,w*.81+lean*.22,85);c('L',w*.66+lean*.2,96);c('L',w*.52+lean*.2,101);c('C',w*.33,92,w*.3,79,w*.37,66);c('Q',w*.48,49,w*.56,37);c('C',w*.24,42,0,33,w*.03,24);c('C',w*.04,12,w*.3,0,w*.62,0);c('Z')
  c('M',w*.51,12);c('C',w*.31,13,w*.22,23,w*.3,26);c('Q',w*.48,31,w*.67,25);c('Q',w*.8,12,w*.51,12);c('Z')
 return p.path()

def transform(path,cap,baseline):
 pen=SVGPathPen(None,ntos=f);s=cap/100
 parse_path(path,TransformPen(pen,(s,0,0,s,0,baseline-cap)))
 return pen.getCommands()
def complete(s,record,d,role):
 items=record['glyphs'];observed=[g for g in items if g.get('provenance','observed')!='inferred']
 items[:]=observed; chars=[g['character'] for g in observed if g['character'] in DIGITS]
 if not chars:return
 for ch in DIGITS:
  if ch in chars:continue
  items.append(dict(character=ch,path=transform(outline(ch,d),record['capHeight'],record['baseline']),fillRule='evenodd',provenance='inferred',
   sourceId=s['sourceId']+'/'+role+'/inferred-'+str(DIGITS.index(ch)),
   inference=dict(method='source-style-reconstruction',basisCharacters=chars,designNotes=d['note']),
   note='Inferred numeral, absent from this photographed alphabet. '+d['note']))
 record['numericCompletion']=dict(coverage=DIGITS,observed=''.join(c for c in DIGITS if c in chars),inferred=''.join(c for c in DIGITS if c not in chars),method='Original smooth outline construction using source-specific crown, stem, terminal and counter observations; no licensed candidate glyph substitution.',design=d,confidence='low' if len(chars)<3 else 'provisional',sourceFile=s['sourceFile'])
if __name__=='__main__':
 for filename in ['historical-studies.json','city-studies.json','parallel-studies.json']:
  path=DOC/filename;data=json.loads(path.read_text())
  for s in data:
   if s['id'] not in DESIGNS:continue
   complete(s,s,DESIGNS[s['id']],'main')
   for role,record in s.get('roles',{}).items():
    if (s['id'],role) in ROLE_DESIGNS:complete(s,record,ROLE_DESIGNS[(s['id'],role)],role)
  path.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
 print('Completed 20 source-specific Persian main alphabets and 11 independent numeric roles; observed paths unchanged.')
