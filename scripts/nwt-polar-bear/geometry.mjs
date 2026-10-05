/**
 * Manually constructed NWT plate geometry.
 *
 * Each section is a deliberate sequence of cubic Bezier curves / straight soles.
 * These control points were placed by observing the supplied scenic plate drawing.
 * No pixel contour, image vectorizer, automatic curve fit, or downloaded SVG is
 * involved. Coordinates use that drawing's image space for legible review.
 * The build script never opens a raster image.
 */
export const reference = {
  id: 'nwt-scenic-reference-v1',
  primary: 'page-47-selection-1.png',
  secondary: 'image(3).png',
  primaryImageSize: [1306, 656],
  primaryBounds: [10, 6, 1280, 634],
  secondaryImageSize: [627, 318],
  secondaryBounds: [4, 5, 621, 308],
  canvas: [600, 300],
  method: 'Manually constructed cubic Bezier geometry; no auto-tracing.',
  status: 'Reference-based reconstruction, not an official manufacturing die.',
  corroboratingSource: 'https://www.justice.gov.nt.ca/fr/fichiers/gazette-des-tno/2013/05_2.pdf',
};

export const cutSections = [
  { id: 'back-and-shoulder', commands: [
    ['M', 330, 6],
    ['C', 440, 6, 540, 54, 614, 54],
    ['C', 682, 54, 760, 29, 822, 18],
    ['C', 886, 5, 942, 19, 985, 35],
    ['C', 996, 39, 1002, 40, 1014, 38],
    ['C', 1045, 33, 1076, 19, 1091, 16],
  ]},
  { id: 'ear-and-forehead', commands: [
    ['C', 1101, 14, 1108, 13, 1112, 16],
    ['C', 1116, 34, 1126, 46, 1145, 54],
    ['C', 1164, 64, 1198, 82, 1205, 96],
    ['C', 1212, 110, 1226, 148, 1248, 163],
  ]},
  { id: 'snout-and-mouth', commands: [
    ['C', 1265, 177, 1285, 177, 1289, 193],
    ['C', 1291, 202, 1290, 212, 1286, 218],
    ['L', 1249, 247],
    ['C', 1241, 254, 1230, 253, 1220, 248],
    ['C', 1204, 242, 1185, 236, 1178, 242],
    ['C', 1168, 249, 1172, 260, 1183, 274],
    ['C', 1189, 281, 1193, 286, 1188, 292],
    ['C', 1183, 301, 1174, 307, 1164, 306],
  ]},
  { id: 'throat-and-front-leg', commands: [
    ['C', 1132, 302, 1097, 293, 1076, 276],
    ['C', 1062, 263, 1049, 264, 1041, 283],
    ['C', 1029, 311, 1042, 377, 1055, 411],
    ['C', 1068, 446, 1097, 465, 1118, 488],
    ['C', 1147, 532, 1207, 576, 1249, 596],
    ['C', 1267, 605, 1270, 621, 1251, 634],
    ['C', 1245, 639, 1240, 640, 1232, 640],
    ['L', 1036, 640],
  ]},
  { id: 'wide-belly-opening', commands: [
    ['C', 1000, 621, 972, 597, 946, 575],
    ['C', 917, 550, 891, 538, 867, 538],
    ['C', 833, 540, 780, 547, 738, 547],
    ['C', 713, 547, 695, 557, 699, 573],
    ['C', 702, 584, 719, 590, 729, 600],
    ['C', 738, 609, 742, 622, 736, 631],
    ['C', 732, 637, 725, 640, 714, 640],
    ['L', 521, 640],
  ]},
  { id: 'middle-foot-opening', commands: [
    ['C', 505, 640, 499, 630, 499, 610],
    ['C', 499, 594, 501, 581, 507, 566],
    ['C', 514, 552, 502, 536, 484, 538],
    ['L', 429, 543],
    ['C', 414, 543, 405, 551, 405, 566],
    ['C', 405, 582, 423, 590, 432, 601],
    ['C', 442, 613, 442, 626, 432, 635],
    ['C', 428, 638, 422, 640, 416, 640],
    ['L', 270, 640],
  ]},
  { id: 'rear-foot-opening', commands: [
    ['C', 256, 640, 251, 631, 245, 617],
    ['L', 221, 565],
    ['C', 215, 551, 200, 549, 188, 558],
    ['C', 177, 568, 177, 581, 187, 591],
    ['C', 201, 604, 213, 617, 215, 629],
    ['C', 217, 636, 211, 640, 201, 640],
    ['L', 65, 640],
  ]},
  { id: 'rump-and-rear-leg', commands: [
    ['C', 35, 640, 18, 626, 14, 605],
    ['C', 10, 587, 18, 563, 31, 533],
    ['C', 38, 515, 47, 503, 54, 487],
    ['C', 70, 454, 74, 415, 68, 375],
    ['C', 58, 311, 34, 247, 12, 214],
    ['C', 7, 205, 12, 177, 22, 151],
    ['C', 35, 111, 64, 73, 107, 51],
    ['C', 175, 19, 256, 6, 330, 6],
    ['Z'],
  ]},
];

/** Separate inset trim. It is neither a stroke on the cut edge nor a scaled copy. */
export const borderSections = [
  { id: 'back-and-shoulder', commands: [
    ['M', 330, 23],
    ['C', 440, 23, 541, 72, 615, 72],
    ['C', 684, 72, 763, 46, 825, 35],
    ['C', 887, 24, 938, 35, 978, 51],
    ['C', 993, 57, 1002, 58, 1017, 54],
    ['C', 1049, 48, 1082, 32, 1101, 31],
  ]},
  { id: 'ear-and-forehead', commands: [
    ['C', 1107, 49, 1118, 59, 1137, 69],
    ['C', 1157, 80, 1184, 92, 1188, 101],
    ['C', 1191, 123, 1216, 160, 1240, 177],
  ]},
  { id: 'snout-and-mouth', commands: [
    ['C', 1256, 187, 1268, 189, 1270, 198],
    ['C', 1272, 204, 1268, 208, 1263, 212],
    ['L', 1238, 232],
    ['C', 1235, 235, 1231, 235, 1226, 232],
    ['C', 1203, 222, 1180, 214, 1163, 229],
    ['C', 1144, 246, 1152, 270, 1169, 286],
    ['C', 1137, 283, 1103, 273, 1087, 259],
  ]},
  { id: 'throat-and-front-leg', commands: [
    ['C', 1064, 239, 1041, 246, 1027, 267],
    ['C', 1007, 294, 1019, 373, 1038, 417],
    ['C', 1052, 453, 1083, 476, 1105, 500],
    ['C', 1137, 546, 1197, 589, 1238, 611],
    ['C', 1248, 616, 1246, 623, 1235, 623],
    ['L', 1041, 623],
  ]},
  { id: 'wide-belly-opening', commands: [
    ['C', 1009, 605, 981, 580, 958, 562],
    ['C', 925, 534, 895, 521, 867, 521],
    ['C', 832, 523, 780, 530, 738, 530],
    ['C', 705, 530, 678, 545, 683, 575],
    ['C', 685, 590, 705, 600, 717, 611],
    ['C', 722, 616, 724, 623, 716, 623],
    ['L', 525, 623],
  ]},
  { id: 'middle-foot-opening', commands: [
    ['C', 516, 623, 517, 593, 524, 573],
    ['C', 539, 541, 513, 518, 486, 520],
    ['L', 428, 525],
    ['C', 403, 525, 387, 541, 387, 565],
    ['C', 387, 588, 409, 601, 416, 611],
    ['C', 421, 617, 422, 623, 414, 623],
    ['L', 274, 623],
    ['C', 269, 623, 268, 617, 262, 604],
  ]},
  { id: 'rear-foot-opening', commands: [
    ['L', 237, 559],
    ['C', 226, 535, 200, 531, 179, 544],
    ['C', 159, 557, 157, 584, 174, 602],
    ['L', 194, 623],
    ['L', 66, 623],
  ]},
  { id: 'rump-and-rear-leg', commands: [
    ['C', 43, 623, 31, 613, 31, 594],
    ['C', 31, 577, 39, 556, 47, 539],
    ['C', 55, 521, 63, 510, 71, 492],
    ['C', 90, 454, 92, 413, 85, 371],
    ['C', 73, 306, 50, 245, 29, 210],
    ['C', 26, 206, 29, 183, 39, 157],
    ['C', 52, 121, 78, 89, 115, 68],
    ['C', 177, 38, 258, 23, 330, 23],
    ['Z'],
  ]},
];

export const holes = [
  { cx: 281, cy: 82, r: 15 },
  { cx: 1043, cy: 82, r: 15 },
  { cx: 281, cy: 584, r: 15 },
  { cx: 1043, cy: 584, r: 15 },
];

/** Secondary reference only: slot positions are observed, not measured die specs. */
export const slots = [
  { cx: 137, cy: 39, width: 28, height: 16, rx: 8 },
  { cx: 498, cy: 39, width: 28, height: 16, rx: 8 },
  { cx: 137, cy: 283, width: 28, height: 16, rx: 8 },
  { cx: 498, cy: 283, width: 28, height: 16, rx: 8 },
];
