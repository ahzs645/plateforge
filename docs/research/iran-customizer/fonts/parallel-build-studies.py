"""Source-guided manual vector studies; no threshold/vector-tracing or font substitution.
Run from any directory. All contours are handwritten in source-crop coordinates.
The SVG review boards preserve those coordinates at one uniform display scale.
"""
from pathlib import Path
import json, shutil, base64, html
from PIL import Image
from fontTools.svgLib.path import parse_path
from fontTools.pens.boundsPen import BoundsPen
ROOT=Path(__file__).resolve().parent
EVIDENCE=ROOT.parents[4]/'iran-evidence'
if not EVIDENCE.exists(): EVIDENCE=Path('/workspace/scratch/ec45c0c1359b/iran-evidence')
BASE='http://www.worldlicenseplates.com/'
NOTE='Hand-drawn source-guided reconstruction of the visible specimen only, using sparse smooth Bezier contours in the original crop coordinate plane. Wear, blur and glare are regularized; no source photograph or threshold-derived pixel contour is used as plate artwork. Provisional critical study, not an authenticated production die; unobserved characters remain unsupported.'
profiles=[]
def profile(key,label,sheet,cap,baseline,serial,script='latin'):
 p=dict(id='wlp-'+key+'-study',label=label,sourceId='ir-wlp-'+key+'/manual-smooth-subset',sourceUrl=BASE+'jpglps/'+sheet,sourceFile='parallel-reference/ir-wlp-'+key+'.jpg',credit='WorldLicensePlates.com / original contributor not named on specimen sheet',capHeight=cap,baseline=baseline,observedSerial=serial,note=NOTE,script=script,glyphs=[])
 profiles.append(p);return p
def glyph(p,ch,box,path,occurrence,role=None):
 g=dict(character=ch,path=path,sourceBox=box,occurrence=occurrence,sourceId=p['sourceId']+'/'+(role+'/' if role else '')+ch+'-'+occurrence)
 if role:p['roles'][role]['glyphs'].append(g)
 else:p['glyphs'].append(g)
 return g
def word(p,id,text,box,path,note,kind=None):
 w=dict(id=id,text=text,path=path,sourceBox=box,sourceId=p['sourceId']+'/'+id,note=note)
 if kind:w['kind']=kind
 p.setdefault('wordmarks',[]).append(w);return w
# The two TEH photographs use visibly different glyph constructions.
p=profile('teh-black','Foreign travel TEH black · observed TEH-047 subset','AS_IRAN_OT1.jpg',41,53,'TEH-4470')
glyph(p,'T',[13,11,38,54],'M14 12 L36 12 Q37 12 37 14 L37 17 L29 17 L29 52 L24 52 L24 17 L14 17 Z','prefix-first')
glyph(p,'E',[45,11,65,54],'M46 12 L63 12 L63 17 L51 17 L51 29 L60 29 L60 34 L51 34 L51 47 L63 47 L63 52 L46 52 Z','prefix-second')
glyph(p,'H',[73,11,92,54],'M74 12 L79 12 L79 29 L85 29 L85 12 L91 12 L91 53 L86 53 L86 35 L79 35 L79 53 L74 53 Z','prefix-third')
glyph(p,'-',[99,30,114,37],'M100 31 L112 31 L113 32 L113 35 L112 36 L100 36 Z','separator')
glyph(p,'4',[120,11,148,54],'M131 12 L136 12 L127 40 L135 40 L137 39 L137 33 L142 33 L142 40 L146 41 L146 46 L142 46 L142 53 L136 53 L136 46 L121 46 L121 40 Z','serial-first')
glyph(p,'7',[185,11,212,55],'M188 12 L209 12 L210 13 L210 19 L191 53 L186 53 L204 19 L193 18 L192 23 L188 23 Z','serial-third')
glyph(p,'0',[217,12,242,56],'M230 14 C237 14 241 19 241 27 L241 41 C241 49 237 54 230 54 C222 54 218 49 218 41 L218 28 C218 20 222 14 230 14 Z M230 19 C225 19 223 23 223 29 L223 40 C223 46 225 49 230 49 C234 49 236 46 236 40 L236 28 C236 22 234 19 230 19 Z','serial-fourth')
p=profile('teh-green','Foreign travel TEH green · observed TEH-123 subset','AS_IRAN_OT1.jpg',43,54,'TEH-32312')
glyph(p,'T',[8,11,34,55],'M9 13 L32 13 L32 18 L23 18 L23 54 L18 54 L18 18 L9 18 Z','prefix-first')
glyph(p,'E',[37,11,57,55],'M38 12 L55 12 L55 17 L43 17 L43 29 L52 29 L52 34 L43 34 L43 48 L55 49 L55 54 L38 53 Z','prefix-second')
glyph(p,'H',[63,11,82,55],'M64 12 L69 12 L69 29 L76 29 L76 12 L81 12 L81 54 L76 54 L76 35 L69 35 L69 54 L64 54 Z','prefix-third')
glyph(p,'-',[86,29,103,37],'M87 30 L101 30 L101 35 L87 35 Z','separator')
glyph(p,'3',[97,10,123,56],'M99 20 C102 12 109 10 114 12 C122 14 124 21 121 28 Q120 31 118 33 C123 37 123 46 118 51 C114 57 103 56 99 49 L98 44 L103 44 C105 50 112 51 115 46 C119 39 114 35 109 35 L109 30 C114 30 118 25 115 20 C112 14 106 15 104 20 Z','serial-first')
glyph(p,'2',[128,10,155,55],'M130 20 C131 14 136 11 141 11 C149 10 155 16 154 23 C153 29 149 32 145 37 L136 47 L154 47 L153 53 L130 53 L130 47 L146 28 C153 20 146 14 141 16 Q137 16 136 20 Z','serial-second')
glyph(p,'1',[187,10,201,55],'M190 15 L196 11 L200 11 L199 54 L194 54 L194 20 L188 24 L188 18 Z','serial-fourth')
p=profile('thr-travel','Foreign travel THR yellow · observed THR-067 subset','AS_IRAN_OT2.jpg',42,54,'THR-77706')
glyph(p,'T',[15,11,36,55],'M16 12 L35 12 L35 16 L29 16 L29 54 L25 54 L25 16 L16 16 Z','prefix-first')
glyph(p,'H',[40,11,60,55],'M41 12 L46 12 L46 30 L55 30 L55 12 L60 12 L60 54 L55 54 L55 35 L46 35 L46 54 L41 54 Z','prefix-second')
glyph(p,'R',[65,11,91,56],'M66 12 L77 12 C85 12 89 16 89 23 C89 30 84 34 78 35 L90 54 L84 54 L72 35 L72 54 L67 54 Z M72 17 L72 30 L77 30 C82 30 85 28 85 23 C85 19 82 17 77 17 Z','prefix-third')
glyph(p,'-',[95,32,110,38],'M96 33 L108 33 L109 34 L109 37 L96 37 Z','separator')
glyph(p,'7',[115,10,137,56],'M116 12 L136 12 L136 18 L121 54 L116 54 L132 17 L121 17 L120 21 L115 21 Z','serial-first')
glyph(p,'0',[194,10,220,55],'M207 12 C216 12 220 19 220 33 C220 47 216 54 207 54 C198 54 194 47 194 33 C194 19 198 12 207 12 Z M207 17 C201 17 199 21 199 33 C199 45 201 49 207 49 C213 49 215 45 215 33 C215 21 213 17 207 17 Z','serial-fourth')
glyph(p,'6',[223,10,249,56],'M247 20 L242 20 C241 16 237 15 234 18 C230 21 230 25 229 30 C235 25 242 27 246 32 C250 39 248 49 242 53 C236 57 229 53 226 48 C222 40 224 20 230 15 C236 9 245 12 247 20 Z M230 35 C228 39 229 46 233 49 C237 52 243 48 243 41 C243 35 240 32 236 32 C233 32 231 33 230 35 Z','serial-fifth')
p=profile('touring-2010','Touring Club circa 2010 · observed 347 + E and code 10','AS_IRAN_OT2.jpg',25,35,'34 E 743 | 10')
# Reference filename differs from short profile ID.
p['sourceFile']='parallel-reference/ir-wlp-travel-circa2010.jpg';p['sourceId']='ir-wlp-travel-circa2010/manual-smooth-subset'
glyph(p,'3',[31,9,51,36],'M32 15 C34 10 39 9 44 10 C49 10 51 13 50 17 C50 19 48 21 46 21 C50 23 51 25 51 29 C50 34 46 35 41 35 C35 35 32 32 31 29 L35 28 C36 31 39 32 42 32 C46 32 47 30 46 27 C45 24 42 23 40 23 L40 20 C44 20 46 18 46 15 C45 12 39 12 37 15 Z','main-first')
glyph(p,'4',[56,9,80,36],'M71 10 L76 10 L76 26 L79 27 L79 31 L76 31 L76 35 L71 35 L71 31 L57 31 L57 26 Z M70 17 L63 25 Q62 26 64 26 L70 26 Z','main-second')
glyph(p,'7',[123,9,146,36],'M124 10 L144 10 L145 11 L145 14 C138 20 136 27 134 35 L129 35 C130 26 134 19 138 14 L124 14 Z','main-third')
p['roles']={'letter':dict(label='Observed white E on red insert',capHeight=25,baseline=35,glyphs=[]),'code':dict(label='Observed white code 10',capHeight=27,baseline=35,glyphs=[]),'country':dict(label='Observed small white IRAN legend',capHeight=6,baseline=14,glyphs=[])}
e=glyph(p,'E',[90,9,114,36],'M92 10 L113 10 L113 14 L97 14 L97 20 L110 20 L110 24 L97 24 L97 31 L113 31 L113 35 L92 35 Z','insert',role='letter')
glyph(p,'1',[208,8,224,36],'M218 9 L222 9 L222 35 L218 35 L218 17 L211 20 L210 16 C214 14 217 12 218 9 Z','code-first',role='code')
glyph(p,'0',[230,8,251,36],'M240 9 C247 9 250 13 250 22 C250 32 247 35 240 35 C233 35 231 31 231 22 C231 13 234 9 240 9 Z M240 13 C237 13 235.5 15 235.5 22 C235.5 29 237 31 240 31 C243 31 245 29 245 22 C245 15 243 13 240 13 Z','code-second',role='code')
country=[]
country.append(glyph(p,'I',[4,8,6,15],'M4.3 8.8 L5.6 8.8 L5.6 14 L4.3 14 Z','country-first',role='country'))
country.append(glyph(p,'R',[6,8,13,15],'M7 8.8 L10 8.8 C12.7 8.8 13 11.4 11 12 L13 14 L11.3 14 L9.6 12.2 L8.4 12.2 L8.4 14 L7 14 Z M8.4 10 L8.4 11 L10.2 11 Q11.3 11 11 10.4 Q10.8 10 10.1 10 Z','country-second',role='country'))
country.append(glyph(p,'A',[12,8,20,15],'M15 8.8 L16.7 8.8 L19.1 14 L17.5 14 L17 12.7 L14.5 12.7 L14 14 L12.6 14 Z M15.7 10.2 L14.9 11.7 L16.5 11.7 Z','country-third',role='country'))
country.append(glyph(p,'N',[19,8,26,15],'M19.8 8.8 L21.2 8.8 L24.1 12.1 L24.1 8.8 L25.5 8.8 L25.5 14 L24.1 14 L21.2 10.8 L21.2 14 L19.8 14 Z','country-fourth',role='country'))
word(p,'iran-latin','IRAN',[4,8,26,15],' '.join(g['path'] for g in country),'Small source-white IRAN legend; only these four observed letters. Its tiny source resolution limits contour precision.','country')
p['wordmarks'][-1]['label']='Iran · Latin source legend'
p['note'] += ' Main serial, red-insert E, right-box white 10 and tiny IRAN have separate metrics. The footer legend requires an explicitly labelled licensed sans candidate; the tiny medallion is not decipherable enough for an exact reconstruction.'
p=profile('uniimog','UNIIMOG mission · observed serif wordmark + sans 5','AS_IRAN_UN.jpg',38,87,'55')
glyph(p,'5',[59,48,84,88],'M61 49 L80 49 L80 55 L67 55 L67 64 C75 60 83 67 83 76 C83 84 77 88 71 87 C64 87 61 83 60 78 L66 78 C68 82 73 83 76 79 C79 74 75 69 71 69 L67 72 L61 72 Z','serial-first')
# One atomic wordmark, not a generic serif face or an invented mission alphabet.
u='M16 19 L22 19 L22 20.5 L20.6 21 L20.6 31 C20.6 35 22.1 37 25.4 37 C28.4 37 29.2 34 29.2 31 L29.2 21 L27.4 20.5 L27.4 19 L33.2 19 L33.2 20.5 L31.6 21 L31.6 31 C31.6 36 29.4 39 25 39 C19.5 39 17.5 36 17.5 31 L17.5 21 L16 20.5 Z'
n='M37 19 L42.5 19 L52 32.6 L52 21 L50.5 20.5 L50.5 19 L56 19 L56 20.5 L54.5 21 L54.5 38.6 L51.7 38.6 L40.8 22.8 L40.8 36 L42.4 37 L42.4 38.6 L36.8 38.6 L36.8 37 L38.4 36 L38.4 21 L37 20.5 Z'
i1='M61 19 L67 19 L67 20.5 L65.5 21 L65.5 36.5 L67 37 L67 38.6 L60.5 38.6 L60.5 37 L62 36.5 L62 21 L61 20.5 Z'
i2='M73 19 L79 19 L79 20.5 L77.6 21 L77.6 36.5 L79.4 37 L79.4 38.6 L72.7 38.6 L72.7 37 L74.1 36.5 L74.1 21 L73 20.5 Z'
m='M84.5 19 L91.7 19 L97.5 29.5 L103.7 19 L110 19 L110 20.5 L108.5 21 L108.5 36.5 L110 37 L110 38.6 L103.3 38.6 L103.3 37 L105.1 36.5 L105.1 22 L97.9 34 L97 34 L89.3 21.5 L89.3 36.5 L91 37 L91 38.6 L84.7 38.6 L84.7 37 L86.5 36.5 L86.5 21 L84.5 20.5 Z'
o='M122.5 19 C129 19 132.7 23.1 132.7 29 C132.7 35 128.6 39 122.1 39 C115.8 39 112.9 34.6 113.3 29 C113.3 23 116.8 19 122.5 19 Z M122.4 21 C118.1 21 116.5 24.5 116.5 29 C116.5 34 118.4 37 122.5 37 C126.8 37 129.3 34 129.3 29 C129.3 24.2 126.8 21 122.4 21 Z'
g='M153 19 L153 24 L151 24 C149.5 21.4 148 21 145.4 21 C140 21 138.1 25.1 138.1 29 C138.1 34 140.7 37 145.5 37 Q149.7 37 151 33 L151 32.3 L145.3 32.3 L145.3 30 L156.1 30 L156.1 32 L154.5 32.2 L154.5 39 L152.8 39 L152 36.9 C149.9 38.5 147.5 39 145 39 C138.8 39 134.5 35 134.5 29 C134.5 22.9 139 19 145.5 19 Q149 19 151.2 20 Z'
word(p,'uniimog','UNIIMOG',[15,17,158,41],' '.join([u,n,i1,i2,m,o,g]),'Complete observed serif mission legend kept as one atomic source wordmark. The serif legend is structurally distinct from the heavy sans 55.','class')
p=profile('us-military','US forces · observed Persian ۰۶۸ subset','FO_IRAN_USAX.jpg',47,63,'۸۰۶','persian')
glyph(p,'۸',[30,15,56,63],'M43 16 C43 25 46 33 54.5 40 L51.4 60.7 C47.7 53.2 45 44.7 43.5 36.5 C41.8 45.4 38.2 55.4 31.8 61.2 L31 42.7 C37.9 35.4 41.7 27 42.7 16 Z','serial-first')
glyph(p,'۰',[68,34,84,52],'M76.5 34.5 L83.5 43 Q78.5 48 75 51 L68.8 43.3 Z','serial-second')
glyph(p,'۶',[102,14,126,65],'M117.8 15.4 L117 24.3 C111.5 25.6 107.1 29.2 105 34.7 C111.8 35.4 119.1 32.6 124.6 28.1 L124 41.7 C111 48.5 107.1 54.3 105 63.6 C104.5 58.3 106.9 47.7 109 42.5 C103.1 42.4 101.9 39.6 103 34.8 C104.2 26.8 110.4 19.6 117.8 15.4 Z','serial-third')
p=profile('us-topographical','US Topographical Team · observed Persian ۰۳۴۷۸ + joined legend','FO_IRAN_USAX.jpg',36,53,'۳۰۷۸۴','persian')
glyph(p,'۳',[53,16,75,55],'M56 17.7 C56.4 22.3 58.5 24.9 62.1 23.3 Q64.8 22.4 65.5 19.8 C66 24 70.8 24.2 72.3 20.8 L73 17.7 C74.8 22.1 73.1 26.1 69.9 27.4 Q66.6 29 64.1 27.3 C61.9 29.3 58.9 29.1 58.2 28.2 C59.1 36.8 60.2 46.5 55.6 53 L55.4 38 C55.4 32.3 53 30.2 53.7 26.7 Z','serial-first')
glyph(p,'۰',[70,30,81,40],'M75.9 31 L79.5 34.2 C78.8 36.5 77.8 38.3 75 39 L71 35.5 Z','serial-second')
glyph(p,'۷',[83,18,106,53],'M86.5 18.7 C88.6 22.4 91.2 33.1 94.6 40.1 C97.6 32.9 99.5 26.7 101.9 19.6 L104.8 26.4 C104.7 32.2 99.5 40.4 96.2 50.9 L94.5 49.1 C92.5 41.1 86.1 32.5 84.1 26.4 Z','serial-third')
glyph(p,'۸',[108,18,132,54],'M120.2 19.5 C120.9 31.8 126.1 39.2 130.7 44.3 L128 51.8 C124.7 46.5 122.3 39.7 120.1 33.8 C117.9 41 115.8 47.1 111.6 52.1 L109.2 45 C113.7 39.1 118.6 30.7 120.2 19.5 Z','serial-fourth')
glyph(p,'۴',[134,17,155,52],'M138 19.6 C139 24.2 140.4 25.4 144.2 24.8 C145.3 20.8 147.5 18.2 151.2 18.2 Q153.6 18.2 154.4 21.3 L151.8 20.7 C148.6 20.3 146.7 22.5 146 24.9 C149 26.4 151.6 25.1 154.2 24.2 C153.1 28.8 149.1 31.2 144.1 30.5 L140.4 30.3 C140.5 37.8 140.4 46 137.1 50.6 L137.2 36.6 C137 31.6 134.7 30.7 135.4 26.3 Z','serial-fifth')
# The small label is reproduced atomically: sparse silhouettes follow visible calligraphic runs and dots.
topo='M45.2 28.1 Q48.2 30.1 50 29.1 L48.7 31.5 C46.6 34.1 42.3 35.1 39.6 38.4 L35.1 41.7 C37 38.3 40.6 35 43.7 33.2 L42.2 32.1 L41.2 30.5 Q43 29.6 45.2 30.3 L46.9 31.1 L47.3 30.7 Z '
topo+='M46.8 38.1 Q49.3 39.2 48.4 40.8 Q46.3 41.7 45.6 39.7 Z '
topo+='M42.4 20.8 L43.9 22 Q43.6 23.9 41.6 23.9 L40.8 22.5 Z '
topo+='M38.1 22 L39.5 22 L39 30.6 Q38.9 33 37.8 34.3 L37.8 30.8 Z '
topo+='M30.4 21.4 Q32 21.2 32.7 19.9 L33.3 20.4 Q32.8 23.1 30.6 23.8 L28 24.8 Q29.1 23.3 30.4 21.4 Z '
topo+='M26.1 26.3 L27.5 25 L27 34.5 Q27 38.2 29 37.1 L31.3 35.5 L31.8 34.2 L34.7 34.1 L35.4 32.6 Q32.2 33.2 31.5 32.1 C31.3 30.7 32.9 28.4 34.1 28.8 C36.4 29.5 36.4 33 35 35.7 L32 36.4 C30.4 39.4 28.5 39.9 27.2 38.4 C25.2 36.5 25.8 30.5 26.1 26.3 Z M33.3 31.2 L34.6 31.3 L34.5 30.4 Z '
topo+='M27 41.7 L28.7 42.1 L29.8 41.2 L30.8 42.9 L29.6 44.2 L28.4 43.6 L26.9 44.5 L25.3 43.6 Z '
topo+='M20.5 23.2 L21.6 22.6 L21.9 26.9 L21.1 28.1 L21.8 30.2 L20.2 30.5 L19.5 28.7 L20.4 27 L19.8 25.8 Z '
topo+='M20.2 30.9 L21.6 31.1 L21.8 34.4 L20 33.8 L19.6 32.7 Z '
topo+='M14.3 31.7 L14 36.6 C13.6 40.9 18.4 40.3 20.4 37.6 L21.2 35.8 L21.7 36.6 C20.8 40.8 17 43.4 14.2 41.5 C11.8 39.9 12.7 35.2 14.3 31.7 Z '
topo+='M17.2 19.3 L18.3 18.6 L18.8 19.1 L17.9 20.2 L18.2 21.2 L17.1 22.6 L16.1 22.8 L16.4 21.7 L17.3 21.1 L16.8 20.5 Z'
word(p,'us-topographical','جغرافیایی',[12,17,52,46],topo,'Complete joined source legend. The small photograph limits the smallest joins and dots; its visible word silhouette is manually regularized. The specimen transcription is جغرافیایی; inventory also records the historical orthographic reading جغرافیائی.','class')
# Preserve inputs privately for reproducible review; never import these bitmaps in runtime plate art.
(ROOT/'parallel-reference').mkdir(exist_ok=True)
for p in profiles:
 src=EVIDENCE/Path(p['sourceFile']).name
 shutil.copyfile(src,ROOT/p['sourceFile'])
(ROOT/'parallel-studies.json').write_text(json.dumps(profiles,ensure_ascii=False,indent=2)+'\n')
# Build source / clean / overlay panels, without nonuniform glyph fitting.
def b64file(path):return 'data:image/jpeg;base64,'+base64.b64encode(path.read_bytes()).decode()
def bounds(path):
 pen=BoundsPen(None);parse_path(path,pen);return pen.bounds
for p in profiles:
 src=ROOT/p['sourceFile']; w,h=Image.open(src).size; scale=4; pad=24; top=84
 entries=[('main '+g['character'],g) for g in p['glyphs']]
 for role,r in p.get('roles',{}).items():entries += [(role+' '+g['character'],g) for g in r['glyphs']]
 entries += [('word '+g['text'],g) for g in p.get('wordmarks',[]) if not (g['id']=='iran-latin')]
 colwidth=w*scale+pad; height=top+h*scale+90; width=colwidth*3+pad
 svg=[f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}"><rect width="100%" height="100%" fill="#f0eee8"/>',f'<text x="24" y="28" font-size="19" font-family="sans-serif">{html.escape(p["label"])}</text>',f'<text x="24" y="49" font-size="12" font-family="sans-serif">Original crop coordinates; uniform {scale}× display. Source photo private reference only. Manual sparse contours; no production-die claim.</text>']
 for col,title in enumerate(['SOURCE CROP','CLEAN CONTOURS AT SOURCE POSITIONS','SOURCE + MAGENTA OVERLAY']):
  x=pad+col*colwidth;svg.append(f'<text x="{x}" y="72" font-size="12" font-family="sans-serif">{title}</text>')
  if col in [0,2]:svg.append(f'<image x="{x}" y="{top}" width="{w*scale}" height="{h*scale}" href="{b64file(src)}"/>')
  else:svg.append(f'<rect x="{x}" y="{top}" width="{w*scale}" height="{h*scale}" fill="white"/>')
  if col in [1,2]:
   color='#17262e' if col==1 else '#ed087b';opacity=1 if col==1 else .65
   svg.append(f'<g transform="translate({x} {top}) scale({scale})" fill="{color}" opacity="{opacity}" fill-rule="evenodd">')
   for label,g in entries:svg.append(f'<path d="{g["path"]}"/>')
   svg.append('</g>')
 svg += [f'<text x="24" y="{top+h*scale+27}" font-size="12" font-family="sans-serif">Coverage: {html.escape(" · ".join(label for label,g in entries))}</text>',f'<text x="24" y="{top+h*scale+46}" font-size="12" font-family="sans-serif">Repeated source digits use one representative master; uncovered repeated positions are intentionally empty in clean panel.</text>','</svg>']
 (ROOT/(p['id']+'-comparison.svg')).write_text(''.join(svg))
 # Validation records source bounds; hand authored path count is deliberately small.
 for label,g in entries:
  b=bounds(g['path']); assert b and b[2]>b[0] and b[3]>b[1],(p['id'],label)
print('Wrote',len(profiles),'profiles,',sum(len(p['glyphs'])+sum(len(v['glyphs']) for v in p.get('roles',{}).values()) for p in profiles),'glyph masters and',sum(len(p.get('wordmarks',[])) for p in profiles),'wordmarks')
