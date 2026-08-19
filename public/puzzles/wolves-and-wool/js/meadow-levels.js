/* Meadow mode levels. World units are px on the meadow plane, origin at the
   fence centre. heading: 0 = away from viewer, 90 = right, 180 = toward viewer.
   Every level is machine-playtested winnable by tools/playtest-meadow.js. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.MEADOW_LEVELS = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  return [
    {
      name: 'Open Meadow',
      fence: { cx: 0, cy: 0, R0: 330, harmonics: [
        { k: 2, a: 0.06, phi: 0.7 }, { k: 3, a: 0.05, phi: 2.1 }, { k: 5, a: 0.025, phi: 4.2 }
      ] },
      rocks: [{ x: 10, y: 150, r: 46 }],
      puddles: [{ x: 90, y: -130, r: 72 }],
      chars: [
        { type: 'wolf', x: -190, y: 50, heading: 90 },
        { type: 'wolf', x: 190, y: -35, heading: 270 }
      ]
    },

    {
      name: 'Around the Rock',
      fence: { cx: 0, cy: 0, R0: 340, harmonics: [
        { k: 2, a: 0.05, phi: 1.9 }, { k: 4, a: 0.045, phi: 0.4 }, { k: 7, a: 0.018, phi: 3.3 }
      ] },
      rocks: [{ x: 0, y: -10, r: 68 }, { x: -180, y: 170, r: 40 }],
      puddles: [{ x: 170, y: 150, r: 64 }],
      chars: [
        { type: 'wolf', x: -215, y: -10, heading: 90 },
        { type: 'wolf', x: 215, y: 10, heading: 270 },
        { type: 'sheep', x: -30, y: 235, heading: 100 }
      ]
    },

    {
      name: 'Muddy Season',
      fence: { cx: 0, cy: 0, R0: 350, harmonics: [
        { k: 2, a: 0.07, phi: 5.1 }, { k: 3, a: 0.04, phi: 1.2 }, { k: 6, a: 0.02, phi: 2.6 }
      ] },
      rocks: [{ x: -140, y: -120, r: 46 }, { x: 150, y: 120, r: 52 }],
      puddles: [{ x: 120, y: -140, r: 78 }, { x: -130, y: 150, r: 70 }],
      chars: [
        { type: 'wolf', x: -230, y: 40, heading: 70 },
        { type: 'wolf', x: 230, y: -60, heading: 250 },
        { type: 'wolf', x: -40, y: -230, heading: 160 },
        { type: 'wolf', x: 60, y: 235, heading: 350 },
        { type: 'sheep', x: -240, y: -200, heading: 120 },
        { type: 'sheep', x: 250, y: 190, heading: 300 }
      ]
    },

    /* ---- act two: passes & pastures (pinched fences = narrow passages) ---- */

    {
      name: 'The Narrows',
      /* two lobes joined by a narrow waist; a puddle greases the crossing */
      fence: { cx: 0, cy: 0, R0: 235, harmonics: [
        { k: 2, a: 0.62, phi: 1.5708 }, { k: 5, a: 0.03, phi: 2.2 }
      ] },
      rocks: [],
      puddles: [{ x: 0, y: 0, r: 58 }],
      chars: [
        { type: 'wolf', x: -260, y: -40, heading: 35 },
        { type: 'wolf', x: 250, y: 50, heading: 210 }
      ]
    },

    {
      name: 'Two Pastures',
      fence: { cx: 0, cy: 0, R0: 240, harmonics: [
        { k: 2, a: 0.6, phi: 1.5708 }, { k: 3, a: 0.04, phi: 0.8 }
      ] },
      rocks: [],
      puddles: [{ x: 255, y: 90, r: 52 }],
      chars: [
        { type: 'wolf', x: -300, y: -40, heading: 90 },
        { type: 'wolf', x: -170, y: 50, heading: 270 },
        { type: 'sheep', x: 280, y: -20, heading: 45 }
      ]
    },

    {
      name: 'Hourglass',
      fence: { cx: 0, cy: 0, R0: 240, harmonics: [
        { k: 2, a: 0.6, phi: 4.712 }, { k: 4, a: 0.03, phi: 1.4 }
      ] },
      rocks: [],
      puddles: [],
      chars: [
        { type: 'wolf', x: -60, y: -270, heading: 170 },
        { type: 'wolf', x: 70, y: -250, heading: 190 },
        { type: 'wolf', x: -70, y: 260, heading: 350 },
        { type: 'wolf', x: 60, y: 270, heading: 10 },
        { type: 'sheep', x: 0, y: -140, heading: 90 }
      ]
    },

    {
      name: 'Sheep Gate',
      /* two boulders form a gate the flock hides behind */
      fence: { cx: 0, cy: 0, R0: 330, harmonics: [
        { k: 2, a: 0.06, phi: 0.7 }, { k: 3, a: 0.05, phi: 2.1 }
      ] },
      rocks: [{ x: -85, y: 0, r: 52 }, { x: 85, y: 0, r: 52 }],
      puddles: [{ x: 200, y: 120, r: 55 }],
      chars: [
        { type: 'wolf', x: -140, y: -180, heading: 135 },
        { type: 'wolf', x: 150, y: -190, heading: 225 },
        { type: 'sheep', x: 0, y: 150, heading: 180 }
      ]
    },

    {
      name: 'Bottleneck',
      fence: { cx: 0, cy: 0, R0: 235, harmonics: [
        { k: 2, a: 0.58, phi: 0 }, { k: 5, a: 0.03, phi: 1.0 }
      ] },
      rocks: [],
      puddles: [{ x: 0, y: 0, r: 56 }],
      chars: [
        { type: 'wolf', x: 200, y: 150, heading: 315 },
        { type: 'wolf', x: 150, y: 220, heading: 290 },
        { type: 'wolf', x: -200, y: -150, heading: 100 },
        { type: 'wolf', x: -140, y: -230, heading: 80 },
        { type: 'sheep', x: -240, y: -200, heading: 45 },
        { type: 'sheep', x: 240, y: 200, heading: 190 }
      ]
    },

    {
      name: 'The Ford',
      /* the only crossing is through the water */
      fence: { cx: 0, cy: 0, R0: 240, harmonics: [
        { k: 2, a: 0.58, phi: 1.5708 }, { k: 3, a: 0.03, phi: 2.6 }
      ] },
      rocks: [],
      puddles: [{ x: 0, y: 0, r: 82 }],
      chars: [
        { type: 'wolf', x: -270, y: 30, heading: 80 },
        { type: 'wolf', x: 280, y: -30, heading: 260 },
        { type: 'sheep', x: -230, y: -90, heading: 120 },
        { type: 'sheep', x: 240, y: 80, heading: 300 }
      ]
    },

    {
      name: 'Clover Field',
      /* three lobes, three necks */
      fence: { cx: 0, cy: 0, R0: 265, harmonics: [
        { k: 3, a: 0.36, phi: 1.2 }, { k: 7, a: 0.02, phi: 0.4 }
      ] },
      rocks: [],
      puddles: [{ x: 0, y: 0, r: 50 }],
      chars: [
        { type: 'wolf', x: 250, y: 10, heading: 270 },
        { type: 'wolf', x: 280, y: 80, heading: 0 },
        { type: 'wolf', x: -140, y: 190, heading: 90 },
        { type: 'wolf', x: -200, y: 250, heading: 45 },
        { type: 'wolf', x: -80, y: -230, heading: 180 },
        { type: 'wolf', x: -150, y: -260, heading: 10 },
        { type: 'sheep', x: 40, y: -60, heading: 90 }
      ]
    },

    {
      name: 'Twin Ponds',
      fence: { cx: 0, cy: 0, R0: 330, harmonics: [
        { k: 2, a: 0.05, phi: 1.9 }, { k: 4, a: 0.045, phi: 0.4 }
      ] },
      rocks: [{ x: 0, y: 10, r: 45 }],
      puddles: [{ x: -140, y: -60, r: 85 }, { x: 150, y: 80, r: 85 }],
      chars: [
        { type: 'wolf', x: -250, y: 60, heading: 70 },
        { type: 'wolf', x: 240, y: -80, heading: 250 },
        { type: 'wolf', x: -60, y: 250, heading: 350 },
        { type: 'wolf', x: 40, y: -260, heading: 170 },
        { type: 'sheep', x: 0, y: 140, heading: 270 }
      ]
    },

    {
      name: 'Cattle Chute',
      /* staggered boulders make a chute through the middle */
      fence: { cx: 0, cy: 0, R0: 250, harmonics: [
        { k: 2, a: 0.45, phi: 1.5708 }, { k: 5, a: 0.025, phi: 3.0 }
      ] },
      rocks: [{ x: -60, y: -8, r: 40 }, { x: 60, y: 12, r: 40 }],
      puddles: [],
      chars: [
        { type: 'wolf', x: -280, y: 20, heading: 90 },
        { type: 'wolf', x: 290, y: -20, heading: 270 }
      ]
    },

    {
      name: 'The Squeeze',
      /* a boulder blocks the north side of the waist — one narrow way through */
      fence: { cx: 0, cy: 0, R0: 245, harmonics: [
        { k: 2, a: 0.68, phi: 1.5708 }, { k: 5, a: 0.025, phi: 0.9 }
      ] },
      rocks: [{ x: 0, y: -30, r: 40 }],
      puddles: [],
      chars: [
        { type: 'wolf', x: -280, y: -70, heading: 170 },
        { type: 'wolf', x: -280, y: 70, heading: 10 },
        { type: 'wolf', x: 235, y: -80, heading: 170 },
        { type: 'wolf', x: 235, y: 80, heading: 350 },
        { type: 'sheep', x: 380, y: 0, heading: 90 }
      ]
    },

    {
      name: 'Old Quarry',
      fence: { cx: 0, cy: 0, R0: 320, harmonics: [
        { k: 2, a: 0.07, phi: 3.9 }, { k: 5, a: 0.03, phi: 1.1 }
      ] },
      rocks: [
        { x: -90, y: -70, r: 48 }, { x: 80, y: -90, r: 44 },
        { x: -60, y: 110, r: 50 }, { x: 100, y: 90, r: 42 }
      ],
      puddles: [],
      chars: [
        { type: 'wolf', x: -240, y: -120, heading: 90 },
        { type: 'wolf', x: 210, y: 130, heading: 270 },
        { type: 'sheep', x: -180, y: 170, heading: 20 },
        { type: 'sheep', x: 200, y: -180, heading: 200 }
      ]
    },

    {
      name: 'Wasp Waist',
      /* pack above, flock below, one tight passage between */
      fence: { cx: 0, cy: 0, R0: 235, harmonics: [
        { k: 2, a: 0.66, phi: 4.712 }, { k: 3, a: 0.03, phi: 2.0 }
      ] },
      rocks: [],
      puddles: [],
      chars: [
        { type: 'wolf', x: -70, y: -260, heading: 100 },
        { type: 'wolf', x: 80, y: -240, heading: 260 },
        { type: 'sheep', x: -60, y: 250, heading: 280 },
        { type: 'sheep', x: 70, y: 270, heading: 80 }
      ]
    },

    {
      name: 'Shepherd\'s Pass',
      fence: { cx: 0, cy: 0, R0: 235, harmonics: [
        { k: 2, a: 0.56, phi: 3.1416 }, { k: 5, a: 0.03, phi: 0.5 }
      ] },
      rocks: [{ x: 30, y: 30, r: 42 }],
      puddles: [{ x: -190, y: 190, r: 60 }, { x: 190, y: -190, r: 60 }],
      chars: [
        { type: 'wolf', x: -240, y: 170, heading: 45 },
        { type: 'wolf', x: -150, y: 260, heading: 10 },
        { type: 'wolf', x: 220, y: -150, heading: 190 },
        { type: 'wolf', x: 150, y: -260, heading: 135 },
        { type: 'sheep', x: -240, y: 240, heading: 90 },
        { type: 'sheep', x: 240, y: -240, heading: 270 }
      ]
    },

    {
      name: 'Long Acre',
      fence: { cx: 0, cy: 0, R0: 250, harmonics: [
        { k: 2, a: 0.5, phi: 1.5708 }, { k: 4, a: 0.03, phi: 2.4 }
      ] },
      rocks: [],
      puddles: [{ x: 0, y: -60, r: 48 }],
      chars: [
        { type: 'wolf', x: -320, y: -40, heading: 80 },
        { type: 'wolf', x: -250, y: 60, heading: 290 },
        { type: 'wolf', x: -60, y: -80, heading: 180 },
        { type: 'wolf', x: 60, y: 70, heading: 0 },
        { type: 'wolf', x: 260, y: -60, heading: 100 },
        { type: 'wolf', x: 310, y: 40, heading: 250 },
        { type: 'sheep', x: -150, y: 80, heading: 320 },
        { type: 'sheep', x: 170, y: -80, heading: 140 }
      ]
    },

    {
      name: 'The Muddiest Hour',
      fence: { cx: 0, cy: 0, R0: 340, harmonics: [
        { k: 2, a: 0.06, phi: 5.6 }, { k: 3, a: 0.05, phi: 0.9 }, { k: 6, a: 0.02, phi: 3.2 }
      ] },
      rocks: [{ x: -40, y: -190, r: 45 }, { x: 60, y: 60, r: 40 }],
      puddles: [
        { x: -160, y: -100, r: 80 }, { x: 150, y: -60, r: 75 }, { x: 0, y: 170, r: 85 }
      ],
      chars: [
        { type: 'wolf', x: -250, y: 0, heading: 90 },
        { type: 'wolf', x: 250, y: 0, heading: 270 },
        { type: 'wolf', x: -100, y: -260, heading: 150 },
        { type: 'wolf', x: 90, y: -270, heading: 210 },
        { type: 'sheep', x: -240, y: -180, heading: 10 },
        { type: 'sheep', x: 200, y: -165, heading: 350 },
        { type: 'sheep', x: 0, y: 270, heading: 180 }
      ]
    }
  ];
});
