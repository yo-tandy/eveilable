/* Localization: English, French, Hebrew (RTL). */
(function () {
  'use strict';

  var LANG_KEY = 'wolveswool.lang.v1';

  var STRINGS = {
    en: {
      brand_html: 'Wolves <span class="amp">&amp;</span> Wool',
      tagline: 'keep the flock · lose the pack',
      nav_help: 'How to play',
      nav_levels: 'Levels',
      nav_editor: 'Level editor',
      turn_left: 'Turn left',
      turn_right: 'Turn right',
      reset: 'Reset board',
      moves_label: 'moves',
      best_hud: '· best {n}',
      untitled: 'Untitled draft',

      workshop: 'Workshop',
      ed_hint: 'Click a square to place the selected piece. Click an animal again to turn it; crates and sliders toggle off.',
      pal_clear: 'Clear', pal_crate: 'Crate', pal_slider: 'Slider', pal_wolf: 'Wolf', pal_sheep: 'Sheep',
      board_label: 'Board',
      level_name: 'Level name',
      name_ph: 'My clever level',
      save_level: 'Save level',
      try_it: 'Try it',
      clear_all: 'Clear all',
      leave: 'Leave workshop',
      ed_ok: 'Looks playable. Save it or try it!',
      ed_awaits: 'An empty board awaits.',
      ed_need_two: 'The level needs at least two wolves.',
      ed_even: 'Wolves must come in even numbers ({n} placed).',
      ed_name: 'Give the level a name before saving.',
      ed_saved: '“{name}” saved to your cabinet.',

      cabinet_title: 'The Level Cabinet',
      house_levels: 'House levels',
      your_levels: 'Your levels',
      empty_note: 'Nothing here yet — craft one in the workshop.',
      import: 'Import…',
      export_all: 'Export all yours',
      imported: 'Imported {n} level(s)',
      skipped: ' · {n} skipped (invalid)',
      nothing_export: 'Nothing to export yet.',
      meta_wolves: '{n} wolves',
      meta_sheep: '{n} sheep',
      meta_best: 'best {n}',
      tip_play: 'Play', tip_edit: 'Edit in workshop', tip_export: 'Export as JSON', tip_delete: 'Delete',

      kicker_win: 'A quiet pasture',
      kicker_lose: 'Oh no',
      title_win: 'The flock is safe!',
      title_lose: 'A sheep was caught',
      body_win: 'The wolves undid each other in {n} moves, and not a tuft of wool was lost.',
      body_win_one: 'The wolves undid each other in a single move, and not a tuft of wool was lost.',
      new_best: ' A new personal best!',
      body_lose: 'The shepherd’s duty is absolute: not one sheep may be lost. Set the board and try again.',
      btn_next: 'Next level',
      btn_play_again: 'Play again',
      btn_try_again: 'Try again',
      btn_cabinet: 'Level cabinet',

      to_meadow: 'Meadow mode',
      to_classic: 'Classic board',
      md_tagline: 'the pasture, alive',
      md_start: 'Begin the day',
      md_hint: 'Hold to steer — every animal turns together.',
      md_time: 'time',
      md_pause: 'Pause',
      md_resume: 'Resume',
      md_speed: 'Speed',
      speed_slow: 'Slow',
      speed_normal: 'Normal',
      speed_fast: 'Fast',
      md_body_win: 'The wolves undid each other in {t} seconds, and the flock grazes on.',
      md_help_html:
        '<p>The meadow plays in real time: every animal walks forward, always. Hold <em>turn left</em> or <em>turn right</em> and the whole pasture wheels together in a gentle arc (10° per nudge).</p>' +
        '<ul>' +
        '<li><strong class="c-wolf">Wolves</strong> that run into each other vanish in a puff.</li>' +
        '<li><strong class="c-sheep">Sheep</strong> must never be caught; two sheep that bump simply shy apart.</li>' +
        '<li><strong>Rocks</strong> and the fence bounce an animal away at an angle.</li>' +
        '<li><strong class="c-brass">Puddles</strong> are slippery: animals rush through and barely answer the helm.</li>' +
        '</ul>' +
        '<p class="kbd-note">Keyboard: hold <kbd>←</kbd> <kbd>→</kbd> to steer, <kbd>R</kbd> to reset.</p>',

      help_title: 'How to play',
      help_html:
        '<p>Wolves have slipped into the pasture, hungry for the flock. You are the shepherd: each turn you spin <em>every animal</em> a quarter-turn — left or right — and then they all march one square forward, at once.</p>' +
        '<ul>' +
        '<li><strong class="c-wolf">Wolves</strong> hunt blindly. When two animals land on the same square, or pass through each other, both are gone in a puff.</li>' +
        '<li><strong class="c-sheep">Sheep</strong> must never be caught. If a wolf reaches a sheep, the game is lost. Two sheep that bump into each other simply shy away and turn around — no harm done.</li>' +
        '<li><strong>Crates</strong> and the fence bounce: an animal marching into one stays put and turns right around (180°).</li>' +
        '<li><strong class="c-brass">Sliders</strong> are greased brass plates: land on one and you skid one more square the way you were already headed. A skid into a crate or the fence bounces you around (180°) — and you keep skidding the other way.</li>' +
        '</ul>' +
        '<p><strong>Make the wolves eliminate each other</strong> — the pasture is safe when not a single wolf remains and every sheep still stands.</p>' +
        '<p class="kbd-note">Keyboard: <kbd>←</kbd> <kbd>→</kbd> to turn, <kbd>R</kbd> to reset.</p>'
    },

    fr: {
      brand_html: 'Loups <span class="amp">&amp;</span> Laine',
      tagline: 'gardez le troupeau · perdez la meute',
      nav_help: 'Comment jouer',
      nav_levels: 'Niveaux',
      nav_editor: 'Éditeur de niveaux',
      turn_left: 'Tourner à gauche',
      turn_right: 'Tourner à droite',
      reset: 'Réinitialiser',
      moves_label: 'coups',
      best_hud: '· record {n}',
      untitled: 'Brouillon sans titre',

      workshop: 'L’Atelier',
      ed_hint: 'Cliquez sur une case pour placer la pièce choisie. Cliquez à nouveau sur un animal pour le tourner ; caisses et glissières se retirent d’un clic.',
      pal_clear: 'Effacer', pal_crate: 'Caisse', pal_slider: 'Glissière', pal_wolf: 'Loup', pal_sheep: 'Mouton',
      board_label: 'Plateau',
      level_name: 'Nom du niveau',
      name_ph: 'Mon niveau malin',
      save_level: 'Enregistrer',
      try_it: 'Essayer',
      clear_all: 'Tout effacer',
      leave: 'Quitter l’atelier',
      ed_ok: 'Semble jouable. Enregistrez-le ou essayez-le !',
      ed_awaits: 'Un plateau vide vous attend.',
      ed_need_two: 'Le niveau demande au moins deux loups.',
      ed_even: 'Les loups vont par nombre pair ({n} placés).',
      ed_name: 'Donnez un nom au niveau avant d’enregistrer.',
      ed_saved: '« {name} » enregistré dans votre cabinet.',

      cabinet_title: 'Le Cabinet des niveaux',
      house_levels: 'Niveaux de la maison',
      your_levels: 'Vos niveaux',
      empty_note: 'Rien ici pour l’instant — créez-en un dans l’atelier.',
      import: 'Importer…',
      export_all: 'Exporter tous les vôtres',
      imported: '{n} niveau(x) importé(s)',
      skipped: ' · {n} ignoré(s) (invalides)',
      nothing_export: 'Rien à exporter pour l’instant.',
      meta_wolves: '{n} loups',
      meta_sheep: '{n} moutons',
      meta_best: 'record {n}',
      tip_play: 'Jouer', tip_edit: 'Modifier dans l’atelier', tip_export: 'Exporter en JSON', tip_delete: 'Supprimer',

      kicker_win: 'Un pâturage paisible',
      kicker_lose: 'Oh non',
      title_win: 'Le troupeau est sauf !',
      title_lose: 'Un mouton a été pris',
      body_win: 'Les loups se sont éliminés en {n} coups, et pas un brin de laine n’a été perdu.',
      body_win_one: 'Les loups se sont éliminés en un seul coup, et pas un brin de laine n’a été perdu.',
      new_best: ' Nouveau record personnel !',
      body_lose: 'Le devoir du berger est absolu : pas un seul mouton ne doit être perdu. Replacez le plateau et réessayez.',
      btn_next: 'Niveau suivant',
      btn_play_again: 'Rejouer',
      btn_try_again: 'Réessayer',
      btn_cabinet: 'Cabinet des niveaux',

      to_meadow: 'Mode prairie',
      to_classic: 'Plateau classique',
      md_tagline: 'le pâturage, en vie',
      md_start: 'Commencer la journée',
      md_hint: 'Maintenez pour guider — tous les animaux tournent ensemble.',
      md_time: 'temps',
      md_pause: 'Pause',
      md_resume: 'Reprendre',
      md_speed: 'Vitesse',
      speed_slow: 'Lent',
      speed_normal: 'Normal',
      speed_fast: 'Rapide',
      md_body_win: 'Les loups se sont éliminés en {t} secondes, et le troupeau continue de paître.',
      md_help_html:
        '<p>La prairie se joue en temps réel : chaque animal avance, sans cesse. Maintenez <em>tourner à gauche</em> ou <em>à droite</em> et tout le pâturage vire ensemble en arc doux (10° par touche).</p>' +
        '<ul>' +
        '<li><strong class="c-wolf">Les loups</strong> qui se percutent disparaissent dans un nuage.</li>' +
        '<li><strong class="c-sheep">Les moutons</strong> ne doivent jamais être pris ; deux moutons qui se heurtent s’écartent simplement.</li>' +
        '<li><strong>Les rochers</strong> et la clôture font rebondir les animaux en biais.</li>' +
        '<li><strong class="c-brass">Les flaques</strong> sont glissantes : on y file tout droit, presque sans gouverner.</li>' +
        '</ul>' +
        '<p class="kbd-note">Clavier : maintenez <kbd>←</kbd> <kbd>→</kbd> pour guider, <kbd>R</kbd> pour recommencer.</p>',

      help_title: 'Comment jouer',
      help_html:
        '<p>Des loups se sont glissés dans le pâturage, affamés. Vous êtes le berger : à chaque tour, vous faites pivoter <em>tous les animaux</em> d’un quart de tour — à gauche ou à droite — puis tous avancent d’une case, en même temps.</p>' +
        '<ul>' +
        '<li><strong class="c-wolf">Les loups</strong> chassent à l’aveugle. Quand deux animaux arrivent sur la même case, ou se croisent, les deux disparaissent dans un nuage.</li>' +
        '<li><strong class="c-sheep">Les moutons</strong> ne doivent jamais être pris. Si un loup atteint un mouton, la partie est perdue. Deux moutons qui se heurtent font simplement demi-tour, sans mal.</li>' +
        '<li><strong>Les caisses</strong> et la clôture font rebondir : un animal qui s’y heurte reste sur place et fait demi-tour (180°).</li>' +
        '<li><strong class="c-brass">Les glissières</strong> sont des plaques de laiton graissées : atterrissez dessus et vous glissez d’une case de plus dans votre direction. Une glissade contre une caisse ou la clôture vous retourne (180°) — et la glissade repart dans l’autre sens.</li>' +
        '</ul>' +
        '<p><strong>Faites s’éliminer les loups entre eux</strong> — le pâturage est sûr quand il ne reste plus un seul loup et que chaque mouton est encore debout.</p>' +
        '<p class="kbd-note">Clavier : <kbd>←</kbd> <kbd>→</kbd> pour tourner, <kbd>R</kbd> pour recommencer.</p>'
    },

    he: {
      brand_html: 'זאבים <span class="amp">&amp;</span> צמר',
      tagline: 'שמרו על העדר · אבדו את הלהקה',
      nav_help: 'איך משחקים',
      nav_levels: 'שלבים',
      nav_editor: 'עורך השלבים',
      turn_left: 'סיבוב שמאלה',
      turn_right: 'סיבוב ימינה',
      reset: 'איפוס הלוח',
      moves_label: 'מהלכים',
      best_hud: '· שיא {n}',
      untitled: 'טיוטה ללא שם',

      workshop: 'הסדנה',
      ed_hint: 'לחצו על משבצת כדי להניח את הכלי שנבחר. לחיצה נוספת על חיה מסובבת אותה; לחיצה על ארגז או מחליק מסירה אותם.',
      pal_clear: 'ניקוי', pal_crate: 'ארגז', pal_slider: 'מחליק', pal_wolf: 'זאב', pal_sheep: 'כבשה',
      board_label: 'לוח',
      level_name: 'שם השלב',
      name_ph: 'השלב המחוכם שלי',
      save_level: 'שמירת השלב',
      try_it: 'לנסות',
      clear_all: 'ניקוי הכול',
      leave: 'יציאה מהסדנה',
      ed_ok: 'נראה שאפשר לשחק. שמרו או נסו!',
      ed_awaits: 'לוח ריק מחכה.',
      ed_need_two: 'השלב זקוק לשני זאבים לפחות.',
      ed_even: 'מספר הזאבים חייב להיות זוגי (הונחו {n}).',
      ed_name: 'תנו שם לשלב לפני השמירה.',
      ed_saved: '„{name}” נשמר בארון שלכם.',

      cabinet_title: 'ארון השלבים',
      house_levels: 'שלבי הבית',
      your_levels: 'השלבים שלכם',
      empty_note: 'אין כאן כלום עדיין — צרו שלב בסדנה.',
      import: 'ייבוא…',
      export_all: 'ייצוא כל השלבים שלכם',
      imported: 'יובאו {n} שלבים',
      skipped: ' · {n} דולגו (לא תקינים)',
      nothing_export: 'אין עדיין מה לייצא.',
      meta_wolves: '{n} זאבים',
      meta_sheep: '{n} כבשים',
      meta_best: 'שיא {n}',
      tip_play: 'משחק', tip_edit: 'עריכה בסדנה', tip_export: 'ייצוא כ‑JSON', tip_delete: 'מחיקה',

      kicker_win: 'מרעה שקט',
      kicker_lose: 'אוי לא',
      title_win: 'העדר ניצל!',
      title_lose: 'כבשה נלכדה',
      body_win: 'הזאבים חיסלו זה את זה ב‑{n} מהלכים, ואף גיזת צמר לא אבדה.',
      body_win_one: 'הזאבים חיסלו זה את זה במהלך אחד, ואף גיזת צמר לא אבדה.',
      new_best: ' שיא אישי חדש!',
      body_lose: 'חובת הרועה מוחלטת: אסור לאבד אף כבשה. סדרו את הלוח ונסו שוב.',
      btn_next: 'השלב הבא',
      btn_play_again: 'לשחק שוב',
      btn_try_again: 'לנסות שוב',
      btn_cabinet: 'ארון השלבים',

      to_meadow: 'מצב אחו',
      to_classic: 'לוח קלאסי',
      md_tagline: 'המרעה, חי',
      md_start: 'תחילת היום',
      md_hint: 'החזיקו כדי להגות — כל החיות פונות יחד.',
      md_time: 'זמן',
      md_pause: 'השהיה',
      md_resume: 'המשך',
      md_speed: 'מהירות',
      speed_slow: 'איטי',
      speed_normal: 'רגיל',
      speed_fast: 'מהיר',
      md_body_win: 'הזאבים חיסלו זה את זה תוך {t} שניות, והעדר ממשיך לרעות.',
      md_help_html:
        '<p>האחו משוחק בזמן אמת: כל חיה צועדת קדימה, כל הזמן. החזיקו <em>סיבוב שמאלה</em> או <em>ימינה</em> וכל המרעה פונה יחד בקשת עדינה (10° לכל נגיעה).</p>' +
        '<ul>' +
        '<li><strong class="c-wolf">זאבים</strong> שמתנגשים זה בזה נעלמים בענן אבק.</li>' +
        '<li><strong class="c-sheep">כבשים</strong> אסור שייתפסו; שתי כבשים שנתקלות פשוט נרתעות זו מזו.</li>' +
        '<li><strong>סלעים</strong> והגדר מקפיצים את החיות בזווית.</li>' +
        '<li><strong class="c-brass">שלוליות</strong> חלקלקות: רצים בהן מהר וכמעט בלי הגה.</li>' +
        '</ul>' +
        '<p class="kbd-note">מקלדת: החזיקו <kbd>←</kbd> <kbd>→</kbd> להגה, <kbd>R</kbd> לאיפוס.</p>',

      help_title: 'איך משחקים',
      help_html:
        '<p>זאבים התגנבו אל המרעה, רעבים לעדר. אתם הרועים: בכל תור אתם מסובבים <em>את כל החיות</em> רבע סיבוב — שמאלה או ימינה — ואז כולן צועדות משבצת אחת קדימה, בבת אחת.</p>' +
        '<ul>' +
        '<li><strong class="c-wolf">זאבים</strong> צדים בעיוורון. כששתי חיות נוחתות על אותה משבצת, או חולפות זו דרך זו, שתיהן נעלמות בענן אבק.</li>' +
        '<li><strong class="c-sheep">כבשים</strong> אסור שייתפסו. אם זאב מגיע לכבשה — המשחק אבוד. שתי כבשים שמתנגשות פשוט נרתעות ומסתובבות לאחור — בלי נזק.</li>' +
        '<li><strong>ארגזים</strong> והגדר מקפיצים: חיה שצועדת אליהם נשארת במקומה ומסתובבת לאחור (180°).</li>' +
        '<li><strong class="c-brass">מחליקים</strong> הם לוחות פליז משומנים: נחתו על אחד ותחליקו משבצת נוספת בכיוון שאליו פניתם. החלקה אל ארגז או אל הגדר מסובבת אתכם לאחור (180°) — וההחלקה נמשכת לכיוון השני.</li>' +
        '</ul>' +
        '<p><strong>גרמו לזאבים לחסל זה את זה</strong> — המרעה בטוח כשלא נותר אף זאב וכל הכבשים עדיין עומדות.</p>' +
        '<p class="kbd-note">מקלדת: <kbd>←</kbd> <kbd>→</kbd> לסיבוב, <kbd>R</kbd> לאיפוס.</p>'
    }
  };

  /* display names for the built-in levels (custom level names stay as typed) */
  var LEVEL_NAMES = {
    'First Prowl':        { fr: 'Première Rôde',          he: 'סיור ראשון' },
    'Tight Quarters':     { fr: 'À l’Étroit',             he: 'צפוף' },
    'Roundabout':         { fr: 'Le Détour',              he: 'סחור־סחור' },
    'The Shepherd':       { fr: 'Le Berger',              he: 'הרועה' },
    'Learning to Skid':   { fr: 'Leçon de Glisse',        he: 'לומדים להחליק' },
    'Greased Rails':      { fr: 'Rails Graissés',         he: 'מסילות משומנות' },
    'Two Packs':          { fr: 'Deux Meutes',            he: 'שתי להקות' },
    'Two Flocks':         { fr: 'Deux Troupeaux',         he: 'שני עדרים' },
    'Skid Row':           { fr: 'Rue Glissante',          he: 'שדרת ההחלקה' },
    'The Pen':            { fr: 'L’Enclos',               he: 'המכלאה' },
    'The Gauntlet':       { fr: 'Le Défi',                he: 'מסלול המכשולים' },
    'Winter Crossing':    { fr: 'Traversée d’Hiver',      he: 'מעבר חורפי' },
    'Cramped Corner':     { fr: 'Recoin Exigu',           he: 'פינה צפופה' },
    'Slick Meadow':       { fr: 'Pré Glissant',           he: 'אחו חלקלק' },
    'The Long Field':     { fr: 'Le Grand Champ',         he: 'השדה הארוך' },
    'Crooked Fence':      { fr: 'Clôture de Travers',     he: 'גדר עקומה' },
    'Single File':        { fr: 'À la Queue Leu Leu',     he: 'טור עורפי' },
    'Cluttered Barnyard': { fr: 'Basse-cour Encombrée',   he: 'חצר עמוסה' },
    'Stray Paths':        { fr: 'Sentiers Perdus',        he: 'שבילים תועים' },
    'Thicket':            { fr: 'Le Fourré',              he: 'הסבך' },
    'The Last Straw':     { fr: 'La Goutte de Trop',      he: 'הקש האחרון' },
    'The North Field':    { fr: 'Le Champ du Nord',       he: 'השדה הצפוני' },
    'The Whole Pack':     { fr: 'Toute la Meute',         he: 'הלהקה כולה' },
    'Across the Valley':  { fr: 'À Travers la Vallée',    he: 'לרוחב העמק' },
    'The Old Orchard':    { fr: 'Le Vieux Verger',        he: 'הבוסתן הישן' },
    'Market Day':         { fr: 'Jour de Marché',         he: 'יום השוק' },
    'Hungry Moon':        { fr: 'Lune Affamée',           he: 'ירח רעב' },
    'Last Light':         { fr: 'Dernière Lueur',         he: 'אור אחרון' },
    'The Long Winter':    { fr: 'Le Long Hiver',          he: 'החורף הארוך' },
    'Open Meadow':        { fr: 'Pré Ouvert',             he: 'אחו פתוח' },
    'The Narrows':        { fr: 'Le Goulet',              he: 'המיצרים' },
    'Two Pastures':       { fr: 'Deux Pâtures',           he: 'שני מרעים' },
    'Hourglass':          { fr: 'Le Sablier',             he: 'שעון החול' },
    'Sheep Gate':         { fr: 'La Barrière aux Moutons', he: 'שער הכבשים' },
    'Bottleneck':         { fr: 'L’Entonnoir',            he: 'צוואר הבקבוק' },
    'The Ford':           { fr: 'Le Gué',                 he: 'המעבר הרדוד' },
    'Clover Field':       { fr: 'Champ de Trèfle',        he: 'שדה התלתן' },
    'Twin Ponds':         { fr: 'Étangs Jumeaux',         he: 'בריכות תאומות' },
    'Cattle Chute':       { fr: 'Couloir du Bétail',      he: 'מסדרון הבקר' },
    'The Squeeze':        { fr: 'Le Passage Étroit',      he: 'המעבר הצר' },
    'Old Quarry':         { fr: 'La Vieille Carrière',    he: 'המחצבה הישנה' },
    'Wasp Waist':         { fr: 'Taille de Guêpe',        he: 'מותן הצרעה' },
    'Shepherd\'s Pass':   { fr: 'Col du Berger',          he: 'מעבר הרועה' },
    'Long Acre':          { fr: 'Le Grand Pré',           he: 'הדונם הארוך' },
    'The Muddiest Hour':  { fr: 'L’Heure la Plus Boueuse', he: 'השעה הבוצית' },
    'Around the Rock':    { fr: 'Autour du Rocher',       he: 'סביב הסלע' },
    'Muddy Season':       { fr: 'Saison Boueuse',         he: 'עונת הבוץ' }
  };

  // A ?lang= param (used when the game is embedded in a host site) wins over the
  // stored choice, so the game opens in the language the host is already using.
  var urlLang = null;
  try {
    urlLang = new URLSearchParams(window.location.search).get('lang');
  } catch (e) { /* no URLSearchParams: fall back to stored choice */ }
  var lang = STRINGS[urlLang] ? urlLang : localStorage.getItem(LANG_KEY);
  if (!STRINGS[lang]) lang = 'en';
  if (STRINGS[urlLang]) { try { localStorage.setItem(LANG_KEY, lang); } catch (e) {} }

  function t(key, params) {
    var s = (STRINGS[lang] && STRINGS[lang][key]) || STRINGS.en[key] || key;
    if (params) {
      Object.keys(params).forEach(function (k) {
        s = s.split('{' + k + '}').join(params[k]);
      });
    }
    return s;
  }

  function levelName(name) {
    if (!name) return t('untitled');
    var tr = LEVEL_NAMES[name];
    return (tr && tr[lang]) || name;
  }

  function apply() {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr';
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      el.textContent = t(el.getAttribute('data-i18n'));
    });
    document.querySelectorAll('[data-i18n-html]').forEach(function (el) {
      el.innerHTML = t(el.getAttribute('data-i18n-html'));
    });
    document.querySelectorAll('[data-i18n-ph]').forEach(function (el) {
      el.placeholder = t(el.getAttribute('data-i18n-ph'));
    });
  }

  window.I18n = {
    t: t,
    levelName: levelName,
    apply: apply,
    getLang: function () { return lang; },
    setLang: function (l) {
      if (!STRINGS[l]) l = 'en';
      lang = l;
      localStorage.setItem(LANG_KEY, l);
      apply();
    }
  };
})();
