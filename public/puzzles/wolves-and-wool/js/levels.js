/* Built-in levels for Wolves & Wool.
   Notation: '..' empty · '##' box · 'ss' slider · 'w>' wolf · 'e<' sheep (ewe)
   Directions: ^ in (away from viewer) · v out (toward viewer) · < left · > right
   Every level below is machine-verified solvable by tools/solve.js. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./engine.js'));
  } else {
    root.BUILTIN_LEVELS = factory(root.Engine);
  }
})(typeof self !== 'undefined' ? self : this, function (Engine) {
  'use strict';
  var L = Engine.parseLevel;

  return [
    L('First Prowl', [
      '.. .. .. .. ..',
      '.. .. .. .. ..',
      '.. w^ .. wv ..',
      '.. .. .. .. ..',
      '.. .. .. .. ..'
    ]),

    L('Tight Quarters', [
      'w> .. ..',
      '.. ## ..',
      '.. .. w^'
    ]),

    L('Roundabout', [
      '.. .. .. .. ..',
      '.. w> .. .. ..',
      '.. .. ## .. ..',
      '.. .. .. .. ..',
      '.. .. .. w< ..'
    ]),

    L('The Shepherd', [
      '.. .. .. .. ..',
      '.. w^ .. wv ..',
      '.. .. .. .. ..',
      '.. .. .. .. ..',
      '.. .. e^ .. ..'
    ]),

    L('Learning to Skid', [
      '.. .. .. .. ..',
      '.. w> .. .. ..',
      '.. .. ss .. ..',
      '.. .. .. w< ..',
      '.. .. .. .. ..'
    ]),

    L('Greased Rails', [
      '.. .. .. .. ..',
      'w> .. ss .. ..',
      '.. .. .. .. ..',
      '.. .. ss .. w<',
      '.. .. .. .. ..'
    ]),

    L('Two Packs', [
      'w> .. .. .. wv',
      '.. .. ## .. ..',
      '.. .. .. .. ..',
      '.. .. ## .. ..',
      'w^ .. .. .. w<'
    ]),

    L('Two Flocks', [
      '.. e< .. .. ..',
      '.. .. .. .. ..',
      'w> .. ## .. wv',
      '.. .. .. .. ..',
      '.. .. .. e> ..'
    ]),

    L('Skid Row', [
      '.. .. .. .. .. ..',
      'w> ss ss .. .. ..',
      '.. .. .. .. .. ..',
      '.. .. .. ss ss w<',
      '.. .. .. .. .. ..'
    ]),

    L('The Pen', [
      '.. .. .. .. ..',
      '.. ## e^ ## ..',
      'w> .. .. .. w<',
      '.. ## .. ## ..',
      '.. .. w^ .. wv'
    ]),

    L('The Gauntlet', [
      '.. e> .. .. ..',
      'w^ .. ## .. wv',
      '.. .. ss .. ..',
      'w^ .. ## .. wv',
      '.. .. .. e< ..'
    ]),

    L('Winter Crossing', [
      '.. .. w> .. .. ..',
      '.. ## .. .. e^ ..',
      'w^ .. ss .. .. ..',
      '.. .. .. ss .. wv',
      '.. e^ .. .. ## ..',
      '.. .. .. w< .. ..'
    ]),

    /* ---- second act: crooked pastures (asymmetric, generator-bred) ---- */

    L('Cramped Corner', [
      '.. ## e^ ..',
      'ss ## .. w^',
      '.. w^ e^ ..',
      '.. ## .. ..'
    ]),

    L('Slick Meadow', [
      '.. .. .. .. .. ..',
      'w> .. .. e> ss ..',
      '.. .. .. .. .. ..',
      '.. .. ss .. .. ..',
      'ss .. .. .. .. ..',
      '## .. .. w^ .. ..'
    ]),

    L('The Long Field', [
      '.. .. .. .. .. .. ..',
      '.. .. ev w> .. .. ..',
      '.. .. w^ .. ev .. ..',
      '.. .. ## w^ ## .. ..',
      '.. .. .. .. w^ .. ..'
    ]),

    L('Crooked Fence', [
      '.. ## .. w^ ..',
      '.. e< w^ .. wv',
      '.. w< .. .. ..',
      '.. .. .. .. ..',
      '.. .. ev .. ..'
    ]),

    L('Single File', [
      '.. .. w> .. .. ..',
      '.. ## wv .. .. ..',
      '.. .. w< .. .. ##',
      '.. .. w^ .. .. ..',
      '.. .. .. .. .. ##'
    ]),

    L('Cluttered Barnyard', [
      'ss ## .. .. .. wv',
      '.. ss w^ e^ ## ..',
      '.. .. .. .. .. ..',
      'w< ss .. .. w< ..',
      '.. ## .. .. .. ..',
      '.. .. .. .. .. ..'
    ]),

    L('Stray Paths', [
      'w< .. e> .. .. .. ..',
      '.. .. .. .. ss w< ..',
      '.. ## .. .. ev .. ..',
      '.. .. .. .. .. .. ss',
      '.. .. .. .. .. .. ..'
    ]),

    L('Thicket', [
      'e^ .. .. w< ..',
      'w> w> .. .. ..',
      '## .. .. .. e>',
      '.. ss .. .. ##',
      'w< .. ## ss ..'
    ]),

    L('The Last Straw', [
      '.. .. .. wv ..',
      'w> e> ## ## ..',
      '.. ## ev .. ..',
      '.. .. .. .. ..'
    ]),

    /* ---- third act: the far pastures (generator-bred, 12+ moves) ---- */

    L('The North Field', [
      '.. .. .. .. w> .. w^ ..',
      '.. .. .. .. .. .. .. e<',
      '.. .. .. .. .. .. .. ..',
      '.. .. .. .. .. e^ .. ..',
      '.. .. .. .. .. w< .. ..',
      '.. .. w> .. .. .. .. ..'
    ]),

    L('The Whole Pack', [
      'ss .. w< .. .. ..',
      '.. .. .. ss .. ..',
      '.. .. .. .. .. ..',
      'w> w> .. ev .. ..',
      '.. w> w^ .. e> w<'
    ]),

    L('Across the Valley', [
      '.. .. .. ss .. w< .. ..',
      '.. .. .. .. .. .. .. ..',
      '.. .. .. .. .. .. .. ..',
      '.. .. .. .. .. .. .. ..',
      '.. .. .. ## .. .. .. ..',
      'wv e< .. ## .. .. .. ..'
    ]),

    L('The Old Orchard', [
      '.. .. w< .. .. .. ss',
      '.. e> w< .. e^ .. ..',
      '.. w< .. .. .. .. ..',
      '.. .. .. .. .. w> ..',
      '.. .. ## ss .. ## ..',
      '.. .. .. .. .. .. ..'
    ]),

    L('Market Day', [
      'e> w< w> .. .. ##',
      'wv .. ## .. wv ..',
      'e^ .. .. e^ w< ..',
      '.. ## .. ss .. ..',
      'wv .. ss .. .. ss'
    ]),

    L('Hungry Moon', [
      '## .. .. .. .. w< ..',
      '.. .. .. .. w^ e^ ..',
      '.. .. .. e< .. .. wv',
      '## w> .. w> .. .. ..',
      '.. ss .. w^ .. ss ..'
    ]),

    L('Last Light', [
      '.. w^ ## .. .. ..',
      '.. .. .. .. .. ..',
      '.. .. w^ .. .. ..',
      '.. .. .. e^ .. ..',
      '.. .. w< .. .. ..',
      '.. .. e^ w> ss ..'
    ]),

    L('The Long Winter', [
      '.. ## .. .. .. .. .. ..',
      'wv .. .. ## e^ .. ss ..',
      '.. .. .. .. w< .. e< ss',
      '.. .. .. .. .. .. w< ..',
      'ss w< .. .. .. .. .. ..',
      'ev .. .. .. .. .. .. ..'
    ])
  ];
});
