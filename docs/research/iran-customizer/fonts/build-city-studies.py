#!/usr/bin/env python3
"""Private critical-study data. Hand-specified smooth contours, never pixel contours.
Run from repository root. Sources are only copied locally; no web fetch or publish.
"""
from pathlib import Path
from fontTools.pens.boundsPen import BoundsPen
from fontTools.svgLib.path import parse_path
import json, shutil, hashlib, base64, html
from PIL import Image
DOC=Path(__file__).resolve().parent
SRC=Path('/workspace/scratch/ec45c0c1359b/iran-evidence')
ST=[]
NOTE='Manually drawn smooth source-guided contours in the original photograph pixel plane. One scale and baseline for each serial role; no per-character fitting. These are bounded provisional specimen studies, not an authenticated die or complete historical font. Small blur, wear and perspective limit precision; omissions require strict blocking or explicitly labelled licensed fallback.'
def b(p):
 pen=BoundsPen(None);parse_path(p,pen);return list(pen.bounds)
def g(ch,p,occ,source):
 bb=b(p);return dict(character=ch,path=p,sourceBox=[round(bb[0]-1,2),round(bb[1]-1,2),round(bb[2]+1,2),round(bb[3]+1,2)],occurrence=occ,sourceId=source+'/'+ch+'-'+occ)
def add(id,label,file,cap,base,serial,paths,word=None,roles=None,notes='',credit='WorldLicensePlates / original contributor unverified',url=None):
 source=file.replace('-reference','');target=DOC/'city-reference'/(file+'.jpg');shutil.copy2(SRC/(file+'.jpg'),target)
 rec=dict(id=id,label=label,sourceId=source+'/manual-smooth-specimen',sourceUrl=url or 'http://www.worldlicenseplates.com/world/AS_IRAN.html',sourceFile='city-reference/'+file+'.jpg',credit=credit,capHeight=cap,baseline=base,observedSerial=serial,note=NOTE+(' '+notes if notes else ''),glyphs=[g(ch,p,'main-row',source) for ch,p in paths.items()],rights='Source photograph rights unverified. Private critical study only; no public redistribution clearance.',sourceSha256=hashlib.sha256(target.read_bytes()).hexdigest())
 if word:
  wid,text,path,kind=word;rec['wordmarks']=[dict(id=wid,text=text,path=path,sourceBox=b(path),sourceId=source+'/'+wid+'-complete',occurrence='complete-observed-legend',kind=kind,label=text,note='Atomic complete observed wordmark; source-specific joins, dots, relative letter placement and sweep. '+notes)]
 if roles:
  rec['roles']={k:dict(capHeight=v[0],baseline=v[1],glyphs=[g(ch,p,k,source) for ch,p in v[2].items()]) for k,v in roles.items()}
 ST.append(rec)

add('historic-1964-city-study','1964 full-city · observed ۱۲۳ and Tehran','iran70acaru-reference',63,80,'۱۲۳۱',{
'۱':'M87 17 C92 22 93 36 92 53 C92 67 89 76 84 80 C85 63 84 46 81 32 C81 27 84 22 87 17 Z',
'۲':'M121 18 C126 24 135 25 141 18 C143 28 137 33 129 35 C128 48 130 66 125 79 C124 63 122 44 117 31 Z',
'۳':'M156 18 C162 24 169 25 175 19 Q181 25 188 18 C190 25 186 29 181 30 L173 30 C169 34 165 33 163 37 C162 52 165 66 159 80 C158 63 155 45 151 31 Z'
},('tehran','تهران','M17 23 C15 29 18 32 24 31 C29 31 31 30 31 26 L29 22 Q29 19 31 19 C34 22 35 30 30 33 C25 36 17 35 15 30 Q14 27 17 23 Z M23 17 L24 15 L27 17 L25 19 Z M39 14 C41 17 41 28 40 33 L38 33 L37 19 Z M42 38 C49 37 51 34 49 29 L47 27 L48 24 L51 26 L55 26 C55 23 56 21 57 21 C60 24 60 29 59 35 C56 36 54 32 53 30 L52 30 C53 36 49 40 41 40 Z M57 27 L57 32 Q55 31 55 29 Z M58 26 L63 26 Q67 26 66 22 L65 21 Q65 19 67 19 C70 24 69 28 66 29 L59 30 Z M62 15 L64 13 L66 15 L64 17 Z M66 15 L68 13 L70 15 L68 17 Z','city'),roles={'extension':(33,83,{
'۱':'M31 49 C34 59 34 72 29 82 L28 82 C29 68 26 58 28 54 Z',
'۳':'M54 51 Q58 54 62 51 Q65 54 68 52 C69 59 65 60 59 60 C56 65 58 78 53 83 L52 65 L50 59 Z'
})},notes='1964 series attribution is secondary. Archive and WLP appear to show the same plate; inspected extension resembles ۱۳, while older catalogue notes said ۱۲. Use observed ۱۳ with visible uncertainty, not a newly inferred ۲.',credit='DNA archive / Francoplaque',url='https://dna.nl/mideast/iran70acaru.jpg')

add('historic-1969-rasht-study','1969 Rasht · observed ۱۲۳۷ and sweeping city word','ir-wlp-1969-gilan',36,49,'۱۲۲۷۳',{
'۱':'M20 13 C23 20 25 30 23 39 Q22 46 20 49 C20 37 18 28 15 20 Z',
'۲':'M76 13 Q81 19 87 12 C90 18 85 22 82 24 C81 31 83 39 79 46 C78 35 76 28 73 20 Z',
'۳':'M136 12 Q142 17 146 13 Q149 11 151 14 L155 13 C156 18 153 20 148 21 Q141 22 141 27 C141 36 141 42 138 47 C137 36 134 26 130 20 Z',
'۷':'M101 13 C105 17 106 23 110 28 L119 14 Q120 12 121 13 L121 21 C118 27 113 33 111 38 L110 46 C109 37 105 28 101 22 Q99 18 101 13 Z'
},('rasht','رشت','M36 58 C38 64 37 65 43 66 C60 68 77 67 86 64 Q90 60 94 64 C97 66 101 64 103 62 Q106 62 107 64 Q110 63 112 61 Q115 61 117 63 Q121 63 119 60 Q119 56 122 58 C125 62 122 66 119 66 L114 65 Q110 68 106 66 Q102 68 99 66 C95 69 91 68 89 66 C77 71 56 71 43 70 C36 70 32 66 36 58 Z M61 53 Q62 51 64 53 Q65 51 67 53 L67 55 L64 55 Q61 56 61 53 Z M99 48 L101 46 L103 48 L101 50 Z M97 54 L99 52 L101 54 L99 56 Z M102 53 L104 51 L106 53 L104 55 Z M133 56 C139 55 139 61 136 65 C134 68 130 70 126 70 L125 69 C130 67 134 64 134 61 L132 58 Z','city'),notes='The long, low Rasht sweep and detached final reh are intentionally retained; this is not a compact modern-font wordmark.')

add('historic-1969-tehran-study','1969 Tehran · observed ۱۲۴۶۹ and numeric code','ir-wlp-1969-tehran',38,51,'۴۱۶۲۹',{
'۴':'M41 14 Q43 17 40 18 C35 20 31 22 31 24 C36 25 38 28 35 32 C31 37 27 40 28 44 C32 47 40 44 45 42 C46 48 43 51 36 52 C25 54 23 49 25 43 C27 38 31 35 32 32 C27 31 24 30 26 25 C29 19 34 16 41 14 Z',
'۱':'M60 15 C64 24 64 36 62 45 L60 51 C60 40 58 30 56 22 Z',
'۶':'M72 15 Q79 17 85 15 Q88 17 86 22 C83 27 83 36 87 43 C88 47 85 51 84 52 C80 49 79 44 80 38 L81 24 L72 24 Z',
'۲':'M103 16 C108 21 113 20 117 15 C119 24 115 28 110 30 C110 37 112 44 109 51 C108 39 104 30 99 26 Z',
'۹':'M132 18 C137 14 141 15 143 20 C145 24 143 28 142 31 C141 39 144 43 144 47 L141 51 C138 48 138 39 138 30 L130 29 Q127 27 130 22 Z M134 21 Q132 23 132 24 Q134 27 139 25 L139 21 Q137 19 134 21 Z'
},('tehran','تهران','M69 71 C73 75 78 76 84 74 C89 73 91 70 89 67 L88 66 L89 64 Q93 66 92 71 C91 77 86 79 80 79 C73 78 69 76 68 72 Z M77 65 L79 63 L81 65 L79 67 Z M97 57 Q100 57 100 63 L100 70 L98 75 C98 66 94 64 96 60 Z M99 78 C105 79 111 77 110 72 L106 68 L108 65 C111 69 116 69 132 69 C133 65 133 61 136 60 C140 59 140 64 138 68 L137 69 L150 69 Q152 68 150 65 L150 61 C154 62 155 69 151 72 L137 72 C140 76 141 77 139 79 C136 77 134 74 134 72 L112 72 C112 78 108 81 100 81 L98 80 Z M134 68 Q138 65 137 62 Q134 63 134 68 Z M143 56 L145 54 L147 56 L145 58 Z M147 56 L149 54 L151 56 L149 58 Z','city'),roles={'extension':(15,76,{
'۹':'M26 62 Q30 58 31 62 L31 68 Q34 73 32 76 L30 77 L29 69 Q23 70 24 66 Z M27 64 L26 67 L29 67 L29 63 Z',
'۱':'M40 61 Q43 62 43 69 Q43 73 41 76 L41 69 L39 64 Z',
'-':'M55 71 L63 71 L63 74 L55 74 Z'
})},notes='Source classification conflicts: WLP passenger placement versus a recovered DNA diplomatic classification. Tint does not resolve the conflict; profile is named for observed specimen and collector date only.')

add('historic-fullcity-letter-study','Full-city letter extension · observed ۴۶۹ and Tehran','iran70bcaru-reference',42,54,'۹۴۶۹۹',{
'۹':'M31 14 C35 11 40 12 42 17 C44 21 42 26 42 30 L42 41 L45 47 L42 53 C38 54 37 48 37 41 L37 28 C32 29 28 27 29 23 Q29 17 31 14 Z M33 18 Q31 21 32 24 L37 24 L38 20 Q37 16 33 18 Z',
'۴':'M75 12 L75 18 C70 19 66 21 66 24 C71 27 75 28 72 33 C69 37 67 41 68 45 C72 48 78 45 82 44 L79 51 C77 54 69 56 66 53 C60 50 62 44 65 37 L68 32 C62 31 59 29 61 25 C64 18 68 15 75 12 Z',
'۶':'M97 12 L114 12 L112 22 L112 37 Q112 42 115 46 L112 53 L109 54 C105 50 106 44 106 40 L108 22 L97 21 Q94 18 97 12 Z'
},('tehran','تهران','M80 71 C79 77 82 80 90 81 C100 82 105 78 104 73 L102 69 L104 66 Q109 68 109 75 C109 81 99 85 91 85 C82 85 77 83 78 75 Z M89 69 L93 67 L95 70 L92 72 Z M116 62 Q119 66 119 73 L118 81 L115 81 C117 75 113 68 114 65 Z M115 86 C124 88 131 85 130 80 L128 75 L128 71 Q132 74 136 76 L161 76 C161 72 161 70 165 68 C170 65 173 69 172 73 Q170 77 166 77 L182 77 Q186 77 184 72 L184 70 Q188 69 189 74 C189 79 187 81 182 81 L165 81 Q164 82 168 86 L166 89 Q161 87 160 81 L133 81 C133 87 129 89 123 89 Q118 89 115 88 Z M164 76 Q169 74 169 71 Q166 68 164 72 Z M173 64 L176 62 L179 64 L176 66 Z M179 64 L182 62 L185 64 L182 66 Z','city'),roles={'extension':(27,88,{
'ج':'M34 63 L53 62 L52 65 C47 65 43 68 39 71 C35 77 35 83 40 85 C46 88 52 85 59 83 L57 87 C52 90 38 90 34 85 C30 81 32 73 39 68 L33 67 Z M47 74 L49 72 L50 76 L47 77 Z',
'-':'M60 72 L73 72 L73 77 L60 77 Z'
})},notes='Archive dating is uncertain (formerly 1972?–1993?); no die date is claimed. The complete lower Tehran word and letter extension are independently editable source-derived assets.',credit='DNA archive / Francoplaque',url='https://dna.nl/mideast/iran70bcaru.jpg')

add('historic-1970-commercial-study','Circa 1970 commercial · observed ۱۶۸ and Tehran','ir-wlp-circa1970-commercial',34,45,'۱۸۶۸۶',{
'۱':'M27 12 C30 19 31 33 29 44 L28 46 C28 34 26 28 24 20 Z',
'۶':'M77 11 L90 12 L89 25 C88 31 89 36 92 39 L89 44 L87 45 C84 41 84 34 85 28 L86 18 L79 18 Q75 16 77 11 Z',
'۸':'M56 12 L58 12 C59 22 62 29 66 34 L67 38 L66 43 C61 40 59 30 57 25 L55 25 C51 31 49 40 46 42 L45 39 C47 33 51 27 53 22 Z'
},('tehran','تهران','M72 60 C72 66 76 68 82 68 C91 68 93 65 91 60 L91 58 Q93 55 95 58 C98 64 95 70 89 72 C80 74 71 71 71 65 Z M80 59 L82 57 L85 59 L84 61 L81 62 Z M101 52 C104 54 103 64 101 69 L100 69 L99 54 Z M100 73 C107 75 112 73 112 69 L110 64 L112 62 C115 65 119 65 135 65 C135 61 137 58 140 58 C145 58 145 62 142 65 L140 66 Q145 65 149 65 L155 65 Q157 65 155 62 L155 59 C159 59 160 64 157 67 L145 68 Q142 69 140 70 L141 72 L140 75 C136 73 136 69 135 68 L114 68 C114 74 110 76 101 76 L99 75 Z M138 64 C141 63 142 61 140 60 Q137 60 138 64 Z M145 54 L147 52 L149 54 L147 56 Z M149 54 L151 52 L153 54 L151 56 Z','city'),roles={'extension':(24,77,{
'۱':'M14 55 Q17 57 16 66 L15 77 L14 77 L12 58 Z',
'۲':'M27 54 Q31 57 35 54 C36 59 33 61 32 64 C32 70 32 75 30 77 Q28 76 28 70 L27 63 L25 58 Z',
'-':'M50 64 L59 64 L58 67 L50 68 Z'
})},notes='Commercial class and circa 1970 dating follow collector metadata; only the inspected orange specimen supplies these contours.')

add('historic-old-government-study','Older government · observed ۰۲۳۴۷','iran72govtu-reference',43,75,'۳۴۰۲۷',{
'۳':'M29 33 Q35 39 42 33 Q46 37 52 34 C51 41 47 43 43 43 L37 44 C34 50 37 64 32 74 C31 65 30 57 28 49 L24 41 Z',
'۴':'M76 33 L77 37 C74 40 69 40 69 44 C74 46 77 48 75 52 C72 56 70 61 70 66 C75 67 80 65 84 65 C83 69 81 73 78 74 C72 76 63 75 64 68 C64 62 69 56 70 54 C65 54 62 50 64 45 C67 39 70 36 76 33 Z',
'۰':'M107 46 Q112 49 115 54 Q112 58 108 60 Q104 59 101 54 Q102 49 107 46 Z',
'۲':'M140 33 C144 38 150 38 155 33 C157 41 151 44 146 46 C145 52 148 64 145 74 C142 71 143 59 139 50 L135 41 Z',
'۷':'M169 32 C173 37 176 48 180 55 C184 49 186 37 191 32 L193 41 C192 46 184 55 182 62 L181 71 L179 73 C178 61 173 53 169 45 Q166 39 169 32 Z'
},notes='Undated government-class attribution is from the archive. No city lettering is visible; none is fabricated.',credit='DNA archive / Gordon',url='https://dna.nl/mideast/iran72govtu.jpg')

add('historic-1993-private-study','1993 city-band private · observed ۱۴۷ل','ir-wlp-1993-private',35,70,'۱۴ل۷۷۴',{
'۱':'M20 36 C26 43 28 54 28 69 L27 70 C26 57 19 47 16 42 Z',
'۴':'M47 36 L48 39 C45 42 39 42 38 46 C43 48 46 49 43 53 C40 57 36 62 36 65 C40 68 46 65 50 64 L51 64 C50 68 45 71 40 71 C34 71 30 69 31 65 C32 60 38 55 39 53 C33 52 32 51 34 47 C37 41 41 38 47 36 Z',
'۷':'M89 37 C93 42 94 46 97 50 Q99 51 101 47 L105 38 L107 37 L110 43 C109 49 102 55 100 61 L98 70 L97 70 C96 58 90 49 86 43 Z',
'ل':'M77 37 C81 37 80 51 79 58 C79 65 74 69 66 68 C58 68 54 65 56 57 L58 52 L59 52 C58 60 58 63 65 63 C72 63 77 62 77 58 L75 44 Z'
},('tehran','تهران','M69 18 C69 23 70 26 77 26 C85 26 87 24 86 20 L84 17 L85 14 C88 16 89 20 88 24 C86 28 83 30 77 30 C69 30 66 26 68 20 Z M74 15 L76 13 L79 15 L77 17 Z M92 10 Q95 8 94 16 L93 25 L92 26 L90 14 Z M94 27 C100 28 101 25 100 22 L99 19 L100 16 C104 20 111 19 116 19 L117 17 L119 20 L129 20 Q131 19 129 16 L130 14 C134 16 134 21 131 23 L120 23 Q119 24 122 27 L121 29 C117 29 117 25 116 23 L102 23 C102 28 99 30 94 29 L92 28 Z M119 11 L121 9 L124 11 L122 13 Z M124 11 L126 9 L128 11 L126 13 Z','city'),roles={'extension':(22,30,{
'۱':'M21 8 C26 13 27 21 27 29 L26 30 C25 22 23 17 20 12 Z',
'۴':'M45 8 L45 10 C42 12 38 13 38 15 C42 17 43 18 40 21 Q35 26 38 27 L46 26 C45 30 39 31 36 30 C31 29 35 23 38 20 C32 19 33 16 35 14 Z',
'-':'M53 21 L62 21 L62 24 L53 24 Z'
})},notes='1993 is WLP series attribution, not a verified statutory introduction date.')

add('historic-1993-commercial-study','1993 city-band commercial · observed ۱۵۶ط','ir-wlp-1993-commercial',34,66,'۱۵ط۱۶۱',{
'۱':'M99 33 C104 40 107 53 106 65 L105 66 C102 54 100 49 96 41 Z',
'۵':'M39 33 C45 40 49 48 50 57 C52 64 48 67 44 66 Q42 66 41 64 C38 67 33 66 32 63 C29 57 34 44 39 33 Z M40 40 C37 46 34 54 35 59 Q36 63 40 60 Q42 57 44 61 Q48 63 48 58 C48 50 44 45 40 40 Z',
'۶':'M129 33 L130 36 C123 37 120 40 120 43 Q124 46 133 43 C131 51 126 54 124 58 L117 66 L116 66 C118 57 124 51 124 49 C117 50 114 48 116 42 C118 37 122 34 129 33 Z',
'ط':'M68 39 L70 38 L70 52 C75 48 79 47 83 47 C87 47 87 54 84 58 C80 62 69 63 65 58 L63 56 C68 57 69 57 68 54 Z M72 54 L70 57 C76 58 82 58 82 54 Q82 50 78 51 Z'
},('tehran','تهران','M59 17 C59 22 61 24 66 24 C71 24 72 22 72 20 L71 16 L72 14 C76 19 75 24 71 26 C64 29 58 26 58 22 Z M64 15 L66 12 L69 14 L67 17 Z M77 10 Q79 8 79 13 L78 23 L77 24 L76 16 Z M80 26 C85 27 88 24 86 21 L85 18 L86 16 C89 20 94 19 100 19 L101 17 L103 20 L109 20 Q112 20 111 17 L112 15 C115 18 114 23 111 23 L103 23 Q103 24 104 26 L102 28 C100 26 99 24 99 23 L88 23 C88 27 85 29 81 28 L79 27 Z M102 12 L104 10 L106 12 L104 14 Z M106 12 L108 10 L110 12 L108 14 Z','city'),notes='Lower-row paint is heavily damaged. Contours reconstruct only the legible skeleton; the observed ط bowl/stem and ۶ open head are provisional. Photograph blemishes and rivets are excluded.')

add('historic-1993-government-study','1993 city-band government · observed ۱۲۴۵۶ب','ir-wlp-1993-government',35,69,'۱۶ب۲۴۵',{
'۱':'M14 36 C18 41 21 56 20 66 L19 67 C18 54 14 46 11 42 Z',
'۶':'M36 35 C40 34 42 35 43 38 C37 36 31 38 31 42 C33 47 40 45 45 45 C44 52 40 55 36 58 L26 69 C28 61 34 55 35 53 C29 53 26 51 28 46 C28 40 31 36 36 35 Z',
'۲':'M93 36 C98 42 103 44 110 41 L113 37 C112 45 109 47 100 47 C100 53 101 63 99 69 C98 58 94 48 90 42 Z',
'۴':'M131 36 L131 39 C125 41 121 41 120 45 Q123 48 128 49 C125 54 119 60 118 65 C122 68 129 64 134 63 C134 67 128 70 123 70 C114 71 111 68 115 62 C118 57 122 53 122 52 C116 51 113 50 116 46 C119 41 124 38 131 36 Z',
'۵':'M149 37 C156 44 161 51 163 61 C165 69 159 71 153 69 Q151 67 149 69 C144 71 139 67 141 61 C143 53 147 43 149 37 Z M150 44 C147 49 144 58 144 62 C144 67 149 66 151 62 C152 66 158 67 160 63 C160 56 155 49 150 44 Z',
'ب':'M53 48 C52 54 56 55 65 55 L77 55 C82 55 82 53 80 49 L81 46 C85 49 85 54 81 57 C77 60 57 60 54 57 C51 55 51 51 53 48 Z M64 65 L67 62 L70 65 L67 68 Z'
},('tehran','تهران','M54 18 C54 23 56 26 62 25 C68 25 71 22 70 19 L69 17 L70 14 C74 17 74 23 70 26 C67 30 59 29 56 27 C52 26 52 21 54 18 Z M60 15 L62 13 L64 15 L62 17 Z M78 11 Q80 9 79 15 L79 24 L77 26 C77 20 75 15 77 12 Z M80 27 C86 28 89 25 87 22 L85 19 L86 17 C91 20 97 20 102 20 L104 18 L104 21 L114 21 Q117 21 115 17 L115 14 C120 15 119 22 116 24 L105 24 Q105 26 108 27 L107 29 C103 29 103 25 101 24 L89 24 C88 29 84 30 79 29 Z M104 12 L106 10 L108 12 L106 14 Z M108 12 L110 10 L112 12 L110 14 Z','city'),notes='Lower ۵ has paint loss at its feet. Clean contour preserves the two-lobed form while excluding wear; this remains a provisional source study.')

add('historic-cityband-truck-study','Recovered city-band truck · observed ۱۴۷۹ط','iran98trucku-reference',47,95,'۱۹ط۴۹۷',{
'۱':'M20 49 C24 53 28 64 30 77 C32 85 33 90 31 94 L30 94 C29 82 23 71 19 63 L17 57 Z',
'۹':'M43 48 C51 45 54 52 55 60 L55 74 Q58 85 61 87 L57 93 L54 94 C49 90 48 80 48 71 C40 71 35 67 36 61 C36 54 39 50 43 48 Z M42 56 C38 58 40 62 45 62 Q49 61 47 58 Q45 55 42 56 Z',
'۴':'M128 49 L128 53 C124 57 116 58 116 62 C123 65 127 66 122 71 C118 76 114 81 115 84 C120 88 127 85 132 84 C132 89 125 93 119 95 C111 97 105 93 107 86 C109 80 115 75 116 71 C110 70 107 68 110 63 C113 57 119 53 128 49 Z',
'۷':'M177 50 C182 56 182 64 186 68 Q188 70 190 65 L194 55 L197 51 L199 57 C199 63 192 72 190 79 L187 94 L185 95 C183 91 185 81 181 74 L175 61 Q172 55 177 50 Z',
'ط':'M76 57 L78 55 C81 61 80 68 80 72 C84 69 89 66 94 66 C101 64 104 68 102 76 C100 83 95 88 88 89 C80 91 68 87 66 82 L66 80 Q70 82 75 81 C76 73 72 64 73 61 Z M81 76 L79 80 C86 82 95 81 97 77 C98 74 93 72 89 73 Z'
},('tehran','تهران','M67 25 C66 31 69 35 77 35 C84 36 89 32 88 28 L86 23 L87 20 C91 19 91 24 91 28 C91 37 87 41 78 41 C69 41 64 36 65 29 Z M74 22 Q76 24 78 21 L79 19 L80 23 C79 26 75 26 73 24 Z M96 17 L98 14 C100 22 100 30 98 36 L97 36 C97 29 92 22 94 19 Z M99 40 C105 40 109 36 108 32 L105 28 L106 24 C110 27 114 28 125 28 L128 27 L129 25 L130 28 L142 28 Q146 28 144 23 L144 20 C149 21 150 27 147 31 L132 32 Q132 35 136 38 L134 40 C130 40 128 34 128 32 L110 32 C110 39 107 44 102 43 L98 42 Z M130 17 L133 14 L136 17 L133 20 Z M136 17 L139 14 L142 17 L139 20 Z','city'),notes='DNA labels this example 1998 onward while other archives use a 1993-series boundary. The source-specific profile is kept separate from the other 1993 specimens.',credit='DNA archive / Elie',url='https://dna.nl/mideast/iran98trucku.jpg')

add('historic-1960s-consular-study','1960s consular · observed ۱ and complete thin legend','ir-wlp-1960s-consular',47,60,'۱',{
'۱':'M126 13 C130 25 130 43 125 60 L124 60 C126 43 123 30 121 19 Z'
},('consular','کنسولی','M76 17 L77 17 C73 21 68 21 65 25 C62 29 63 38 60 43 Q59 47 56 45 L55 44 Q53 47 51 47 L50 46 L47 48 L47 47 L44 49 L44 48 L40 50 L39 49 L36 51 L36 48 Q38 45 39 46 L39 49 Q42 47 43 47 L44 48 Q46 46 47 46 L48 46 Q50 44 52 44 L53 41 L54 41 C54 44 56 44 58 44 C61 42 59 30 63 26 C65 22 72 19 76 17 Z M52 29 L54 31 L52 33 L50 31 Z M38 47 Q40 53 34 56 L32 57 L33 55 C36 54 37 51 37 48 Z M31 16 L32 16 C30 22 30 26 30 30 C31 33 27 34 25 38 Q23 40 26 40 C31 42 30 45 27 50 C24 55 21 57 17 56 C11 55 11 49 13 43 L16 38 L16 40 C13 45 13 51 16 52 C22 56 27 49 28 45 Q29 43 25 42 C20 41 26 35 28 33 C30 31 26 23 31 16 Z','class'),notes='Thin slanted consular hand lettering is traced as one complete word path. Very low resolution limits thin joins and interior detail; no broad alphabet or modern calligraphy substitute is claimed.')

# Placement recommendations describe ink boxes within the actual plate crop, not whitespace.
GEOMETRY=[
('full-city-1964',[5,4,244,93],[81,17,220,80],[27,49,69,83]),
('full-city-gilan',[2,1,170,86],[15,12,156,49],None),
('full-city-numeric',[1,3,169,87],[24,14,145,53],[24,60,64,77]),
('full-city-letter',[1,1,217,100],[29,12,188,54],[31,62,73,90]),
('full-city-commercial',[1,1,169,85],[24,11,148,46],[12,54,59,77]),
('old-government',[1,1,217,109],[24,32,194,76],None),
('city-band-header-code',[2,1,175,78],[16,36,159,71],[20,8,63,31]),
('city-band-commercial-wlp',[1,1,171,72],[11,33,157,67],None),
('city-band-government',[1,1,174,78],[11,35,164,71],None),
('city-band-commercial',[0,0,218,104],[17,47,200,96],None),
('consular-1960s',[1,1,198,76],[121,13,129,60],None),
]
def rect_fraction(r,p):
 x0,y0,x1,y1=r;px0,py0,px1,py1=p
 return dict(x=round((x0-px0)/(px1-px0),5),y=round((y0-py0)/(py1-py0),5),width=round((x1-x0)/(px1-px0),5),height=round((y1-y0)/(py1-py0),5))
placement=[]
for rec,(preset,plate,serial,extension) in zip(ST,GEOMETRY):
 rec['presetId']=preset;rec['sourcePlateBox']=plate
 roles=dict(serial=dict(sourceBox=serial,rectFraction=rect_fraction(serial,plate)))
 for word in rec.get('wordmarks',[]):
  word['role']='class' if word['id']=='consular' else 'city'
  roles[word['role']]=dict(wordmarkId=word['id'],sourceBox=word['sourceBox'],rectFraction=rect_fraction(word['sourceBox'],plate),fit='contain; one uniform whole-word scale; preserve complete ink aspect')
 if extension:roles['extension']=dict(sourceBox=extension,rectFraction=rect_fraction(extension,plate),fontRole='extension')
 placement.append(dict(profileId=rec['id'],presetId=preset,sourceFile=rec['sourceFile'],sourcePlateBox=plate,roles=roles))
(DOC/'city-studies-geometry.json').write_text(json.dumps(placement,ensure_ascii=False,indent=2)+'\n')
(DOC/'city-studies.json').write_text(json.dumps(ST,ensure_ascii=False,indent=2)+'\n')
# Source comparison boards: source above, an aligned red overlay, then clean paths.
for s in ST:
 im=Image.open(DOC/s['sourceFile']);w,h=im.size;scale=min(4,1000/w);W=1100;H=int(h*scale*3+155)
 raw=base64.b64encode((DOC/s['sourceFile']).read_bytes()).decode()
 out=[f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}"><rect width="100%" height="100%" fill="#f6f3e8"/><g font-family="sans-serif" fill="#172c35">',f'<text x="24" y="27" font-size="21">{html.escape(s["label"])}</text>', '<text x="24" y="49" font-size="13">Private critical study • provisional smooth contours • source-image rights unverified</text>']
 shapes=s['glyphs']+s.get('wordmarks',[])+[g for r in s.get('roles',{}).values() for g in r['glyphs']]
 for row,name in enumerate(['Source photograph','Aligned contour overlay','Clean source-plane paths']):
  y=75+row*(h*scale+24);out.append(f'<text x="24" y="{y-5}" font-size="12">{name}</text><g transform="translate(24 {y}) scale({scale})">')
  if row<2:out.append(f'<image width="{w}" height="{h}" href="data:image/jpeg;base64,{raw}"/>')
  if row>0:
   for q in shapes:out.append(f'<path d="{q["path"]}" fill="{"#dc1749" if row==1 else "#121c25"}" fill-opacity="{.62 if row==1 else 1}" fill-rule="evenodd"/>')
  out.append('</g>')
 out.append('</g></svg>');(DOC/(s['id']+'-comparison.svg')).write_text(''.join(out))
try:
 import cairosvg
 for s in ST:cairosvg.svg2png(url=str(DOC/(s['id']+'-comparison.svg')),write_to=str(DOC/(s['id']+'-comparison.png')))
except ImportError:
 import subprocess
 if shutil.which('inkscape'):
  for rec in ST:
   subprocess.run(['inkscape',str(DOC/(rec['id']+'-comparison.svg')),'--export-type=png','--export-filename='+str(DOC/(rec['id']+'-comparison.png'))],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
 else:print('cairosvg/inkscape unavailable; SVG boards saved')
if all((DOC/(rec['id']+'-comparison.png')).exists() for rec in ST):
 contact=Image.new('RGB',(1600,2450),'white')
 for i,rec in enumerate(ST):
  im=Image.open(DOC/(rec['id']+'-comparison.png'));im.thumbnail((790,405));contact.paste(im,((i%2)*800,(i//2)*405))
 contact.save(DOC/'city-studies-comparison-contact.png')
print('Profiles:',len(ST)); print('\n'.join(s['id']+' '+''.join(g['character'] for g in s['glyphs']) for s in ST))
