// Background composition traced from the PDF (1920×1080 artboard).
// Each shape keeps its "home" geometry; every section moves it with
// [dx, dy, rotateDeg?, scaleX?, scaleY?]. null = hidden in that section.
//   objects    → shapes centred on the horizontal axis
//   scenes     → shapes aligned to the right edge
//   playground → shapes aligned to the bottom edge
//   information→ shapes stacked into a vertical figure
export const SHAPES = [
  { d: 'M1084.9 498H1156.7V672.1H1084.9Z', at: { objects: [0.0, -45.1], scenes: [588.5, 0.0], playground: [0.0, 287.0], information: [-174.1, 59.3, 0, 1.0, 1.0] } },
  { d: 'M399.1 463.4H470.9V637.6H399.1Z', at: { objects: [0.0, -10.5], scenes: [1274.2, 0.0], playground: [0.0, 321.6], information: [544.7, 37.1, 0, 1.0, 1.0] } },
  { d: 'M1286.3 634.7H1358.1V808.8H1286.3Z', at: { objects: [0.0, -181.8], scenes: [387.0, 0.0], playground: [0.0, 150.3], information: [-342.5, -324.7, 0, 1.0, 1.0] } },
  { d: 'M943.8 288.3H964.6V293.5H943.8Z', at: { objects: [0.0, 249.1], scenes: [780.5, 0.0], playground: [0.0, 665.6], information: [0.0, 0.0, 0, 1.0, 1.0] } },
  { d: 'M1110.4 437.2H1131.2V442.4H1110.4Z', at: { objects: [0.0, 100.2], scenes: [614.0, 0.0], playground: [0.0, 516.8], information: [0.0, 0.0, 0, 1.0, 1.0] } },
  { d: 'M846 669.5H866.8V674.7H846Z', at: { objects: [0.0, -132.1], scenes: [878.3, 0.0], playground: [0.0, 284.4], information: [60.5, 2.6, 0, 1.0, 1.0] } },
  { d: 'M732.3 465.1H792V626.7H732.3Z', at: { objects: [0.0, -5.9], scenes: [435.5, 0.0], playground: [0.0, 332.4], information: [75.2, 136.7, 0, 1.0, 1.0] } },
  { d: 'M1018.5 530H1039.2V535.1H1018.5Z', at: { objects: [0.0, 7.4], scenes: [705.9, 0.0], playground: [0.0, 424.0], information: [0.0, 0.0, 0, 1.0, 1.0] } },
  { d: 'M866.8 337.5H887.6V342.6H866.8Z', at: { objects: [0.0, 199.9], scenes: [857.5, 0.0], playground: [0.0, 616.5], information: [0.0, 0.0, 0, 1.0, 1.0] } },
  { d: 'M554.6 169.3H772V374.3H554.6Z', at: { objects: [0.0, 268.2], scenes: [973.1, 0.0], playground: [0.0, 584.8], information: [128.2, 77.4, 0, 0.337, 1.0] } },
  { d: 'M979.7 959.1C893.3 959.1 823.3 912.5 823.3 855C823.3 797.5 893.3 750.8 979.7 750.8C1066.1 750.8 1136.1 797.5 1136.1 855C1136.1 912.5 1066.1 959.1 979.7 959.1Z', at: { objects: [0.0, -315.0], scenes: [609.0, 0.0], playground: [0.0, 0.0], information: [68.2, -512.3, 90, 1.0, 1.0] } },
  { d: 'M918.5 253.8C893.1 253.8 872.4 233.2 872.4 207.7C872.4 182.2 893.1 161.6 918.5 161.6C944 161.6 964.6 182.2 964.6 207.7C964.6 233.2 944 253.8 918.5 253.8Z', at: { objects: [0.0, 332.3], scenes: [740.6, -59.6], playground: [0.0, 705.3], information: null } },
  { d: 'M1203.8 68.3L1203.8 508.3', line: true, at: { objects: [0.0, 251.7], scenes: [541.3, 0.0], playground: [0.0, 450.8], information: [-152.6, 241.7, 0, 1, 1.0] } },
  { d: 'M1054.8 378.4L815.5 378.4', line: true, at: { objects: [0.0, 161.6], scenes: [690.4, 0.0], playground: [0.0, 580.7], information: [-39.0, 286.5, 0, 1.0, 1] } },
  { d: 'M1103.1 287L1323.6 167.6L1392 167.6L1392 376L1103.1 376L1103.1 287Z', at: { objects: [0.0, 268.2], scenes: [267.2, 0.0], playground: [0.0, 583.1], information: [-257.5, 202.5, 0, 1.0, 1.0] } },
  { d: 'M1510.6 581.9L1745.1 666.8L1745.1 693.2L1335.9 693.2L1335.9 581.9L1510.6 581.9Z', at: { objects: [0.0, -97.6], scenes: [0.0, 0.0], playground: [0.0, 266.0], information: null } },
  { d: 'M679.4 484.4L226.1 745.1L679.4 810.7L679.4 484.4Z', at: { objects: [0.0, -107.5], scenes: [858.7, 0.0], playground: [0.0, 148.4], information: [482.4, -83.4, -90, 1.0, 1.0] } },
  { d: 'M828.8 102H845.9V739.8H828.8Z', at: { objects: [0.0, 119.1], scenes: [899.2, 0.0], playground: [0.0, 219.3], information: [50.2, 154.0, 0, 1.0, 1.0] } },
  { d: 'M1626.7 572.7L1247.5 572.7C1247.5 501.6 1332.4 444 1437.1 444C1541.8 444 1626.7 501.6 1626.7 572.7Z', at: { objects: [0.0, 31.7], scenes: [-29.1, -87.4], playground: [0.0, 386.4], information: [-397.8, 134.6, 0, 0.664, 1.0] } },
];

const SVG = 'http://www.w3.org/2000/svg';

export function mountShapes(svg) {
  const paths = SHAPES.map((shape) => {
    const p = document.createElementNS(SVG, 'path');
    p.setAttribute('d', shape.d);
    p.setAttribute('class', shape.line ? 'shape shape--line' : 'shape');
    svg.appendChild(p);
    return p;
  });

  return function setLayout(name) {
    SHAPES.forEach((shape, i) => {
      const el = paths[i];
      if (name === 'home' || !(name in shape.at)) {
        el.style.transform = '';
        el.style.opacity = '';
        return;
      }
      const t = shape.at[name];
      if (!t) {
        el.style.transform = 'scale(0.6)';
        el.style.opacity = '0';
        return;
      }
      const [dx, dy, r = 0, sx = 1, sy = 1] = t;
      el.style.transform = `translate(${dx}px, ${dy}px) rotate(${r}deg) scale(${sx}, ${sy})`;
      el.style.opacity = '';
    });
  };
}
