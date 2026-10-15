/* =====================================================================
   ENGLISH ISLAND — script.js
   Educational 2D adventure game (HTML + CSS + pure JavaScript)

   Sections:
     1. Assets (image paths — EDIT HERE to use the final art)
     2. Constants
     3. Provisional art (SVG characters, objects and pictures)
     4. Level data (maps, NPCs, objects and the 5 questions of each level)
     5. Game state
     6. DOM references and helpers
     7. Sound (optional)
     8. Screens (title, intro, game, game over, victory)
     9. Level loading and drawing
    10. Input (keyboard + touch pad)
    11. Game loop, movement and collisions
    12. Camera, interaction prompt and guide arrow
    13. Interaction (NPCs, objects, passages, boss)
    14. Question system (2 attempts per question)
    15. Progress, unlocking and level transitions
    16. Final boss, victory and game over
    17. Restart
    18. Start-up
   ===================================================================== */
'use strict';

/* =====================================================================
   1. ASSETS
   ---------------------------------------------------------------------
   Backgrounds: the four scenery images that were provided.
   Characters: set a path (e.g. 'assets/player.png') when the final
   images are ready. While the value is null, the game draws a
   provisional SVG character (see section 3). Nothing else needs to change.
   ===================================================================== */
const ASSETS = {
  backgrounds: {
    island: 'assets/island.jpg',
    ocean:  'assets/ocean.jpg',
    forest: 'assets/forest.jpg',
    desert: 'assets/desert.jpg',
    boss:   null            // expected (optional): 'assets/boss-arena.jpg' — a CSS arena is drawn while null
  },
  characters: {
    player:     null,       // expected: 'assets/player.png'      (boy — Max, facing right)
    playerGirl: null,       // expected: 'assets/player-girl.png' (girl — Luna, facing right)
    npcIsland:  null,       // expected: 'assets/npc-island.png'
    npcOcean:   null,       // expected: 'assets/npc-ocean.png'
    npcForest:  null,       // expected: 'assets/npc-forest.png'
    npcDesert:  null,       // expected: 'assets/npc-desert.png'
    boss:       null        // expected: 'assets/boss.png'
  }
};

/* =====================================================================
   2. CONSTANTS
   ===================================================================== */
const WORLD_W = 1920;            // world size in "world pixels" (all maps use the same size)
const WORLD_H = 1280;
const PLAYER_SPEED = 330;        // world pixels per second
const PLAYER_RADIUS = 16;        // size of the feet hit-box
const INTERACT_DIST = 115;       // distance to show "Press E"
const POINTS = { correct: 10, level: 25, boss: 50 };
const DEBUG = new URLSearchParams(location.search).has('debug'); // open index.html?debug to see collisions

/* =====================================================================
   3. PROVISIONAL ART (inline SVG)
   Characters are only drawn here when no image is set in ASSETS.
   ===================================================================== */
const OUTLINE = '#2a1b12';

/** Draws a cartoon person. Options: skin, hair, shirt, pants, shoes, hat, hairStyle, tail, extras[] */
function personSVG(o) {
  const shadow = `<ellipse cx="50" cy="134" rx="25" ry="6" fill="rgba(0,0,0,.28)" stroke="none"/>`;
  const legs = o.tail
    ? `<path d="M33 98 Q28 118 45 127 L37 139 L50 133 L63 139 L55 127 Q72 118 67 98Z" fill="${o.tail}"/>
       <path d="M40 108 Q50 112 60 108 M42 117 Q50 121 58 117" fill="none" stroke="rgba(0,0,0,.25)" stroke-width="2"/>`
    : `<g class="leg leg-l"><rect x="37" y="96" width="11" height="30" rx="5" fill="${o.pants}"/><ellipse cx="41" cy="128" rx="9" ry="5" fill="${o.shoes}"/></g>
       <g class="leg leg-r"><rect x="52" y="96" width="11" height="30" rx="5" fill="${o.pants}"/><ellipse cx="59" cy="128" rx="9" ry="5" fill="${o.shoes}"/></g>`;
  const longHair = o.hairStyle === 'long'
    ? `<path d="M27 36 Q22 70 30 82 L40 74 L38 40Z M73 36 Q78 70 70 82 L60 74 L62 40Z" fill="${o.hair}"/>` : '';
  const bun = o.hairStyle === 'bun' ? `<circle cx="50" cy="12" r="9" fill="${o.hair}"/>` : '';
  const ponytail = o.hairStyle === 'ponytail'
    ? `<path d="M64 24 Q94 26 88 66 Q82 56 70 46Z" fill="${o.hair}"/><circle cx="70" cy="27" r="4.5" fill="#ff4f81"/>` : '';
  const backpack = o.extras.includes('backpack')
    ? `<rect x="62" y="62" width="14" height="30" rx="5" fill="#c0392b"/>` : '';
  const body = `
    <path d="M30 72 Q30 60 41 58 L59 58 Q70 60 70 72 L72 103 Q50 109 28 103 Z" fill="${o.shirt}"/>
    ${o.tail ? `<path d="M38 62 Q44 70 50 64 Q56 70 62 62" fill="none" stroke="#f7d6e0" stroke-width="5"/>`
             : o.extras.includes('skirt') ? `<path d="M29 93 L71 93 L78 112 Q50 118 22 112Z" fill="${o.pants}"/>`
             : `<path d="M28 96 L72 96 L73 106 Q50 111 27 106Z" fill="${o.pants}"/>`}
    ${o.extras.includes('backpack') ? `<path d="M38 59 L36 96 M62 59 L64 96" stroke="#8e2b20" stroke-width="4"/>` : ''}
    ${o.extras.includes('scarf') ? `<path d="M36 58 Q50 68 64 58 L66 64 Q50 74 34 64Z" fill="#e74c3c"/>` : ''}
    ${o.extras.includes('badge') ? `<circle cx="60" cy="72" r="4.5" fill="#f1c40f"/>` : ''}`;
  const arms = `
    <g class="arm arm-l"><rect x="20" y="62" width="11" height="32" rx="5.5" fill="${o.shirt}"/><circle cx="25.5" cy="95" r="6" fill="${o.skin}"/></g>
    <g class="arm arm-r"><rect x="69" y="62" width="11" height="32" rx="5.5" fill="${o.shirt}"/><circle cx="74.5" cy="95" r="6" fill="${o.skin}"/></g>`;
  const book = o.extras.includes('book') ? `<rect x="66" y="80" width="18" height="14" rx="2" fill="#2e86de" transform="rotate(-12 75 87)"/>` : '';
  const head = `
    <rect x="44" y="52" width="12" height="9" fill="${o.skin}"/>
    <circle cx="28" cy="40" r="5" fill="${o.skin}"/><circle cx="72" cy="40" r="5" fill="${o.skin}"/>
    <circle cx="50" cy="38" r="22" fill="${o.skin}"/>
    ${bun}
    <path d="M28 36 Q28 14 50 14 Q72 14 72 36 Q66 25 50 25 Q34 25 28 36Z" fill="${o.hair}"/>
    <g stroke="none">
      <ellipse cx="42" cy="40" rx="3.3" ry="4.2" fill="#1e1e1e"/><ellipse cx="58" cy="40" rx="3.3" ry="4.2" fill="#1e1e1e"/>
      <circle cx="43.2" cy="38.6" r="1.3" fill="#fff"/><circle cx="59.2" cy="38.6" r="1.3" fill="#fff"/>
      <circle cx="35" cy="47" r="3.6" fill="#ff7a8a" opacity=".5"/><circle cx="65" cy="47" r="3.6" fill="#ff7a8a" opacity=".5"/>
    </g>
    <path d="M43 49 Q50 55.5 57 49" stroke="#7a2e1f" stroke-width="2.6" fill="none" stroke-linecap="round"/>
    ${o.extras.includes('lashes') ? `<path d="M39 38 L35.5 36.5 M39.5 36.6 L37 34.2 M61 38 L64.5 36.5 M60.5 36.6 L63 34.2" stroke="#1e1e1e" stroke-width="1.5" stroke-linecap="round"/>` : ''}
    ${o.extras.includes('glasses') ? `<g fill="none" stroke="#2c3e50" stroke-width="2"><circle cx="42" cy="40" r="6.5"/><circle cx="58" cy="40" r="6.5"/><path d="M48.5 40 L51.5 40"/></g>` : ''}
    ${o.extras.includes('flower') ? `<g stroke="none"><circle cx="69" cy="22" r="4" fill="#ff6fa8"/><circle cx="75" cy="26" r="4" fill="#ff6fa8"/><circle cx="69" cy="30" r="4" fill="#ff6fa8"/><circle cx="63" cy="26" r="4" fill="#ff6fa8"/><circle cx="69" cy="26" r="3" fill="#ffd23f"/></g>` : ''}
    ${o.extras.includes('starfish') ? `<path d="M68 16 L70.5 22 L77 22.5 L72 26.5 L73.5 33 L68 29.5 L62.5 33 L64 26.5 L59 22.5 L65.5 22Z" fill="#ff9f43"/>` : ''}`;
  const hats = {
    safari: `<ellipse cx="50" cy="22" rx="31" ry="7" fill="#d9a441"/><path d="M33 22 Q33 3 50 3 Q67 3 67 22Z" fill="#e8b85a"/><rect x="33" y="16" width="34" height="5" fill="#7a4a1d"/>`,
    ranger: `<ellipse cx="50" cy="21" rx="31" ry="6.5" fill="#4b6b2a"/><path d="M35 21 L40 4 Q50 0 60 4 L65 21Z" fill="#5f8a33"/><rect x="36" y="15" width="28" height="4" fill="#3b2a18"/>`,
    sun: `<ellipse cx="50" cy="22" rx="36" ry="8" fill="#f3d27a"/><path d="M34 22 Q35 6 50 6 Q65 6 66 22Z" fill="#f7e09a"/><rect x="34" y="16" width="32" height="5" fill="#e67e22"/>`
  };
  return `<svg class="char-svg" viewBox="0 0 100 140" aria-hidden="true">${shadow}
    <g stroke="${OUTLINE}" stroke-width="2.2" stroke-linejoin="round">
      ${longHair}${ponytail}${backpack}${legs}${arms}${body}${book}${head}${o.hat ? hats[o.hat] : ''}
    </g></svg>`;
}

/** The Guardian of the Treasure (final boss) */
function guardianSVG() {
  return `<svg class="char-svg" viewBox="0 0 200 220" aria-hidden="true">
    <ellipse cx="100" cy="210" rx="70" ry="10" fill="rgba(0,0,0,.35)"/>
    <g stroke="${OUTLINE}" stroke-width="3" stroke-linejoin="round">
      <rect x="58" y="160" width="32" height="46" rx="8" fill="#6c7385"/><rect x="110" y="160" width="32" height="46" rx="8" fill="#6c7385"/>
      <g class="boss-arm-l"><rect x="12" y="78" width="38" height="70" rx="14" fill="#7f8799"/><rect x="8" y="138" width="46" height="34" rx="12" fill="#8d95a8"/></g>
      <g class="boss-arm-r"><rect x="150" y="78" width="38" height="70" rx="14" fill="#7f8799"/><rect x="146" y="138" width="46" height="34" rx="12" fill="#8d95a8"/></g>
      <rect x="42" y="70" width="116" height="104" rx="26" fill="#8d95a8"/>
      <path d="M60 92 L74 104 L66 120 M136 96 L126 112 L138 126" fill="none" stroke="#5a6070" stroke-width="3"/>
      <path d="M50 150 Q60 140 72 152 Q84 142 92 154" fill="#6ab04c" stroke="none"/>
      <circle class="boss-rune" cx="100" cy="118" r="20" fill="#13d8e8"/>
      <path d="M100 104 L100 132 M88 118 L112 118 M92 108 L108 128 M108 108 L92 128" stroke="#e8fdff" stroke-width="3"/>
      <rect x="60" y="14" width="80" height="64" rx="18" fill="#9aa2b5"/>
      <rect class="boss-eye" x="74" y="38" width="18" height="10" rx="5" fill="#ffe66d"/>
      <rect class="boss-eye" x="108" y="38" width="18" height="10" rx="5" fill="#ffe66d"/>
      <path d="M84 62 Q100 56 116 62" fill="none" stroke-width="3.5"/>
      <path d="M62 18 L70 -2 L84 14 L100 -6 L116 14 L130 -2 L138 18Z" fill="#f6c343"/>
      <circle cx="100" cy="6" r="5" fill="#e74c3c"/>
    </g></svg>`;
}

/** Treasure chest (closed or open) */
function chestSVG(open) {
  return `<svg class="chest-svg" viewBox="0 0 120 100" aria-hidden="true">
    <ellipse cx="60" cy="94" rx="48" ry="6" fill="rgba(0,0,0,.3)"/>
    ${open ? `<g class="chest-glow"><circle cx="60" cy="44" r="34" fill="#fff6a8" opacity=".75"/></g>
      <g stroke="${OUTLINE}" stroke-width="2"><circle cx="44" cy="46" r="8" fill="#ffd23f"/><circle cx="60" cy="40" r="9" fill="#ffd23f"/><circle cx="76" cy="46" r="8" fill="#ffd23f"/>
      <path d="M52 36 L60 24 L68 36Z" fill="#4fd1ff"/></g>` : ''}
    <g stroke="${OUTLINE}" stroke-width="3" stroke-linejoin="round">
      <rect x="14" y="48" width="92" height="44" rx="6" fill="#a0522d"/>
      <rect x="14" y="48" width="92" height="10" fill="#c97a3a"/>
      ${open ? `<path d="M14 48 L24 14 L96 14 L106 48Z" fill="#8b4513" opacity=".9"/>`
             : `<path d="M14 48 Q14 20 60 20 Q106 20 106 48Z" fill="#b5652d"/>`}
      <rect x="10" y="44" width="100" height="8" rx="3" fill="#f6c343"/>
      <rect x="52" y="52" width="16" height="18" rx="3" fill="#f6c343"/>
      <rect x="26" y="48" width="8" height="44" fill="#f6c343"/><rect x="86" y="48" width="8" height="44" fill="#f6c343"/>
    </g></svg>`;
}

/** Small pictures used by objects and questions (viewBox 100x100) */
const PICS = {
  sun: `<circle cx="50" cy="50" r="22" fill="#ffd23f"/><g stroke="#ffb400" stroke-width="6" stroke-linecap="round"><path d="M50 8V20M50 80V92M8 50H20M80 50H92M20 20L28 28M72 72L80 80M80 20L72 28M28 72L20 80"/></g><circle cx="43" cy="46" r="3" fill="#7a4a1d" stroke="none"/><circle cx="57" cy="46" r="3" fill="#7a4a1d" stroke="none"/><path d="M42 56 Q50 63 58 56" fill="none" stroke="#7a4a1d" stroke-width="3"/>`,
  shell: `<path d="M50 88 L18 46 Q20 16 50 12 Q80 16 82 46Z" fill="#ffb8c6"/><path d="M50 88 L30 22 M50 88 L50 12 M50 88 L70 22 M50 88 L20 44 M50 88 L80 44" stroke="#e17b93" stroke-width="3" fill="none"/><rect x="40" y="82" width="20" height="10" rx="4" fill="#ff9fb3"/>`,
  palm: `<path d="M50 92 Q46 60 52 34" stroke="#8b5a2b" stroke-width="9" fill="none"/><path d="M52 34 Q30 20 10 34 Q30 28 52 36 Q40 12 22 8 Q46 14 54 34 Q66 10 88 12 Q66 20 56 36 Q80 26 92 40 Q70 32 54 38Z" fill="#2ecc71"/><circle cx="48" cy="40" r="5" fill="#7a4a1d"/><circle cx="57" cy="41" r="5" fill="#7a4a1d"/>`,
  bottle: `<rect x="40" y="10" width="20" height="14" rx="3" fill="#a0522d"/><path d="M38 24 H62 V36 Q76 44 76 58 V84 Q76 92 68 92 H32 Q24 92 24 84 V58 Q24 44 38 36Z" fill="#7fd6c2" opacity=".9"/><rect x="34" y="52" width="32" height="24" rx="3" fill="#fff3d6" transform="rotate(-8 50 64)"/><path d="M38 60 H60 M38 66 H56" stroke="#a0522d" stroke-width="2"/>`,
  fish: `<path d="M18 50 Q40 22 70 50 Q40 78 18 50Z" fill="#ff9f43"/><path d="M68 50 L90 32 L86 50 L90 68Z" fill="#ff7f11"/><path d="M38 36 Q46 50 38 64" fill="none" stroke="#e67e22" stroke-width="3"/><circle cx="30" cy="47" r="4" fill="#1e1e1e" stroke="none"/>`,
  starfish: `<path d="M50 8 L61 36 L92 38 L68 58 L76 90 L50 72 L24 90 L32 58 L8 38 L39 36Z" fill="#ff8c69"/><g fill="#ffd1c2" stroke="none"><circle cx="50" cy="30" r="3"/><circle cx="70" cy="44" r="3"/><circle cx="62" cy="70" r="3"/><circle cx="38" cy="70" r="3"/><circle cx="30" cy="44" r="3"/></g>`,
  coral: `<path d="M50 92 V54 M50 66 Q34 60 30 38 M50 60 Q66 54 70 30 M30 38 Q22 30 24 18 M30 38 Q38 28 36 18 M70 30 Q62 20 66 10 M70 30 Q80 24 80 14 M50 54 Q50 40 46 30" stroke="#ff5e8a" stroke-width="9" stroke-linecap="round" fill="none"/><rect x="34" y="86" width="32" height="8" rx="4" fill="#c9a77c"/>`,
  octopus: `<path d="M28 52 Q24 14 50 12 Q76 14 72 52Z" fill="#a55eea"/><g fill="none" stroke="#a55eea" stroke-width="7" stroke-linecap="round"><path d="M30 52 Q20 70 12 74"/><path d="M36 54 Q30 76 26 88"/><path d="M42 55 Q40 78 38 92"/><path d="M48 56 Q48 80 46 94"/><path d="M53 56 Q54 80 56 94"/><path d="M58 55 Q62 78 64 92"/><path d="M64 54 Q70 76 76 88"/><path d="M70 52 Q80 70 88 74"/></g><circle cx="42" cy="36" r="5" fill="#fff"/><circle cx="58" cy="36" r="5" fill="#fff"/><circle cx="43" cy="37" r="2.5" fill="#1e1e1e" stroke="none"/><circle cx="59" cy="37" r="2.5" fill="#1e1e1e" stroke="none"/>`,
  tree: `<rect x="42" y="56" width="16" height="36" rx="3" fill="#8b5a2b"/><circle cx="50" cy="38" r="26" fill="#27ae60"/><circle cx="32" cy="50" r="15" fill="#2ecc71"/><circle cx="68" cy="50" r="15" fill="#2ecc71"/><circle cx="50" cy="22" r="14" fill="#2ecc71"/>`,
  mushroom: `<rect x="40" y="52" width="20" height="38" rx="8" fill="#fff3d6"/><path d="M12 56 Q14 14 50 12 Q86 14 88 56Z" fill="#e74c3c"/><g fill="#fff" stroke="none"><circle cx="34" cy="34" r="6"/><circle cx="58" cy="26" r="5"/><circle cx="70" cy="44" r="6"/><circle cx="46" cy="46" r="4"/></g>`,
  bird: `<ellipse cx="50" cy="56" rx="28" ry="22" fill="#3498db"/><circle cx="70" cy="38" r="15" fill="#3498db"/><path d="M84 38 L96 42 L84 46Z" fill="#f39c12"/><circle cx="73" cy="35" r="3" fill="#1e1e1e" stroke="none"/><path d="M36 50 Q50 24 62 50Z" fill="#5dade2"/><path d="M22 56 L6 48 L10 62Z" fill="#2e86c1"/><path d="M44 78 V90 M56 78 V90" stroke="#f39c12" stroke-width="4"/>`,
  flower: `<path d="M50 56 V94" stroke="#27ae60" stroke-width="6"/><path d="M50 80 Q30 70 28 60 Q44 62 50 80Z" fill="#2ecc71"/><g fill="#e74c3c"><circle cx="50" cy="20" r="13"/><circle cx="70" cy="36" r="13"/><circle cx="62" cy="58" r="13"/><circle cx="38" cy="58" r="13"/><circle cx="30" cy="36" r="13"/></g><circle cx="50" cy="40" r="11" fill="#ffd23f"/>`,
  cactus: `<path d="M42 92 V22 Q42 12 50 12 Q58 12 58 22 V92Z" fill="#27ae60"/><path d="M42 58 H30 Q22 58 22 50 V34 Q22 28 28 28 Q34 28 34 34 V46 H42" fill="#2ecc71"/><path d="M58 50 H70 Q78 50 78 42 V30 Q78 24 72 24 Q66 24 66 30 V38 H58" fill="#2ecc71"/><rect x="30" y="88" width="40" height="8" rx="3" fill="#d35400"/><circle cx="50" cy="12" r="5" fill="#ff6fa8"/>`,
  camel: `<path d="M18 64 Q18 48 30 46 Q36 26 48 40 Q58 22 68 42 L74 42 L78 28 Q80 18 90 22 L92 30 L84 32 L80 52 Q80 64 70 66Z" fill="#d4a056"/><path d="M26 64 V92 M38 66 V92 M62 66 V92 M72 64 V92" stroke="#b9853f" stroke-width="7" stroke-linecap="round"/><circle cx="87" cy="26" r="2" fill="#1e1e1e" stroke="none"/>`,
  oasis: `<ellipse cx="50" cy="74" rx="42" ry="16" fill="#3fb6e8"/><ellipse cx="44" cy="70" rx="18" ry="5" fill="#9be7ff" stroke="none"/><path d="M70 74 Q66 46 72 30" stroke="#8b5a2b" stroke-width="6" fill="none"/><path d="M72 30 Q56 22 44 32 Q58 28 72 32 Q64 14 52 12 Q68 16 74 30 Q84 14 96 18 Q82 22 76 32 Q90 30 96 40 Q84 32 74 34Z" fill="#2ecc71"/>`,
  number: `<rect x="6" y="20" width="38" height="60" rx="10" fill="#ffd23f"/><text x="25" y="66" font-size="44" font-weight="700" text-anchor="middle" fill="#1d2b53" stroke="none" font-family="Arial">5</text><path d="M48 50 H62 M56 42 L64 50 L56 58" stroke="#1d2b53" stroke-width="5" fill="none" stroke-linecap="round"/><rect x="66" y="20" width="30" height="60" rx="10" fill="#fff" stroke-dasharray="6 5"/><text x="81" y="64" font-size="36" font-weight="700" text-anchor="middle" fill="#1d2b53" stroke="none" font-family="Arial">?</text>`,
  water: `<path d="M50 8 Q78 46 78 64 Q78 92 50 92 Q22 92 22 64 Q22 46 50 8Z" fill="#3fa9f5"/><path d="M36 64 Q36 78 48 82" stroke="#bfe6ff" stroke-width="6" fill="none" stroke-linecap="round"/>`,
  sandcastle: `<rect x="16" y="50" width="68" height="40" fill="#e8c27a"/><rect x="10" y="34" width="22" height="56" fill="#f0cf8a"/><rect x="68" y="34" width="22" height="56" fill="#f0cf8a"/><rect x="38" y="26" width="24" height="30" fill="#f0cf8a"/><path d="M42 90 V74 Q50 66 58 74 V90Z" fill="#a9773a"/><path d="M50 26 V8 L64 14 L50 18" fill="#e74c3c"/>`,
  sentence: `<rect x="8" y="22" width="84" height="56" rx="10" fill="#fff"/><path d="M20 40 H80 M20 52 H70 M20 64 H58" stroke="#1d2b53" stroke-width="5" stroke-linecap="round"/><circle cx="80" cy="66" r="12" fill="#2ecc71"/><path d="M74 66 L79 71 L87 61" stroke="#fff" stroke-width="4" fill="none"/>`
};

function picSVG(name, cls = 'pic-svg') {
  return `<svg class="${cls}" viewBox="0 0 100 100" aria-hidden="true"><g stroke="${OUTLINE}" stroke-width="2.5" stroke-linejoin="round">${PICS[name] || ''}</g></svg>`;
}

/** Character looks (provisional). The "image" key links to ASSETS.characters. */
const LOOKS = {
  player:     { image: 'player', skin: '#f5c9a0', hair: '#5b3a1e', shirt: '#ff8a00', pants: '#2e86de', shoes: '#6b3e1f', hat: 'safari', extras: ['backpack', 'scarf'] },
  playerGirl: { image: 'playerGirl', skin: '#d9a066', hair: '#3b2214', shirt: '#a55eea', pants: '#ff4f81', shoes: '#6b3e1f', hat: 'safari', hairStyle: 'ponytail', extras: ['backpack', 'lashes', 'skirt'] },
  island: { image: 'npcIsland', skin: '#c68b59', hair: '#2b1a10', shirt: '#13b5b1', pants: '#f6e3b4', shoes: '#8e5b33', hairStyle: 'bun', extras: ['glasses', 'flower', 'book'] },
  ocean:  { image: 'npcOcean', skin: '#f2c6a8', hair: '#e8505b', shirt: '#ff9fb3', pants: '#000', shoes: '#000', hairStyle: 'long', tail: '#16c79a', extras: ['starfish'] },
  forest: { image: 'npcForest', skin: '#8d5a3b', hair: '#1c1009', shirt: '#7a9a3a', pants: '#5b4127', shoes: '#3b2a18', hat: 'ranger', extras: ['badge'] },
  desert: { image: 'npcDesert', skin: '#e0ac7e', hair: '#d8d8d8', shirt: '#f4f1de', pants: '#c97a3a', shoes: '#7a4a1d', hat: 'sun', extras: ['glasses', 'scarf'] }
};

/** Playable characters (chosen at the start of the game). */
const HEROES = [
  { id: 'boy',  name: 'Max',  look: 'player',     girl: false },
  { id: 'girl', name: 'Luna', look: 'playerGirl', girl: true }
];
let selectedHero = HEROES[0];        // kept when the adventure restarts
const heroLook = () => LOOKS[selectedHero.look];

/** Returns the HTML of a character: final image if available, otherwise the provisional SVG. */
function characterHTML(look) {
  const path = ASSETS.characters[look.image];
  if (path) return `<img class="char-img" src="${path}" alt="" draggable="false">`;
  return personSVG(look);
}
function bossHTML() {
  const path = ASSETS.characters.boss;
  return path ? `<img class="char-img" src="${path}" alt="" draggable="false">` : guardianSVG();
}

/* =====================================================================
   4. LEVEL DATA
   Coordinates are percentages (0–100) of the map, so they match the
   background images. walk = polygon where the player can stand.
   solids: {e:[x,y,rx,ry]} ellipse or {r:[x,y,w,h]} rectangle (blocked areas).
   Each question: [question (English), [CORRECT answer, wrong, wrong, wrong], picture?, hint in Portuguese]
   (the order of the answers is shuffled when the adventure starts).
   ===================================================================== */
const LEVELS = [
  {
    id: 'island', name: 'Island', namePt: 'Ilha', nextPt: 'o Oceano', number: 1, theme: 'island',
    intro: 'Encontre a Professora Coco na praia!',
    spawn: [46, 84],
    walk: [[24,17],[33,13],[45,9],[60,9],[70,11],[76,20],[80,25],[88,28],[91,37],[85,46],[80,54],[80,62],[86,70],[89,78],[83,87],[68,90],[50,92],[36,92],[22,88],[15,78],[15,68],[21,58],[24,48],[27,38],[29,28],[27,20]],
    solids: [{ r: [47, 6, 12, 24] }, { e: [52, 53, 9, 6.5] }, { e: [34, 77, 4.5, 9] }, { e: [58, 88, 2.5, 2.5] }],
    npc: { look: 'island', name: 'Professora Coco', pos: [64, 79],
      hello: 'Olá! Eu sou a Professora Coco. Responda minhas 5 perguntas sobre a ilha!',
      done: 'Muito bem! Você completou a Ilha! A passagem para o Oceano está aberta!' },
    gate: { pos: [82, 74], to: 'o OCEANO' },
    objects: [
      { pos: [22, 74], pic: 'shell',  word: 'Shell',     pt: 'concha',   text: 'I can find shells on the beach.', textPt: 'Eu posso achar conchas na praia.' },
      { pos: [30, 48], pic: 'palm',   word: 'Palm tree', pt: 'palmeira', text: 'Coconuts grow on palm trees.',   textPt: 'Cocos crescem nas palmeiras.' },
      { pos: [84, 33], pic: 'bottle', word: 'Bottle',    pt: 'garrafa',  text: 'There is a message in this bottle!', textPt: 'Tem uma mensagem nesta garrafa!' }
    ],
    questions: [
      ['What color is the sun?', ['Yellow', 'Blue', 'Green', 'Purple'], 'sun', 'De que cor é o sol?'],
      ['What number comes after five?', ['Six', 'Two', 'Ten', 'One'], 'number', 'Que número vem depois do cinco?'],
      ['What is this?', ['A shell', 'A car', 'A book', 'A pencil'], 'shell', 'O que é isto?'],
      ['What color is the sea?', ['Blue', 'Red', 'Orange', 'Pink'], 'water', 'De que cor é o mar?'],
      ['What can you see on the beach?', ['Sand', 'Snow', 'Ice', 'A sofa'], 'sandcastle', 'O que você pode ver na praia?']
    ]
  },
  {
    id: 'ocean', name: 'Ocean', namePt: 'Oceano', nextPt: 'a Floresta', number: 2, theme: 'ocean',
    intro: 'Nade até a Sereia Mira!',
    spawn: [25, 72],
    walk: [[6,36],[12,18],[25,10],[38,7],[62,6],[76,10],[80,24],[90,36],[95,55],[94,76],[88,92],[70,97],[30,97],[10,92],[5,70]],
    solids: [{ e: [74, 45, 11, 6] }, { e: [33, 40, 6, 5] }, { e: [54, 73, 5, 5] }, { e: [16, 84, 5, 5] }],
    npc: { look: 'ocean', name: 'Sereia Mira', pos: [47, 54],
      hello: 'Oi! Eu sou a Sereia Mira. Vamos falar sobre o oceano? São 5 perguntas!',
      done: 'Muito bem! Você completou o Oceano! A passagem para a Floresta está aberta!' },
    gate: { pos: [55, 93], to: 'a FLORESTA' },
    objects: [
      { pos: [58, 22], pic: 'fish',     word: 'Fish',     pt: 'peixe',          text: 'Fish can swim very fast.', textPt: 'Peixes nadam muito rápido.' },
      { pos: [86, 64], pic: 'starfish', word: 'Starfish', pt: 'estrela-do-mar', text: 'A starfish has five arms.', textPt: 'A estrela-do-mar tem cinco braços.' },
      { pos: [30, 86], pic: 'coral',    word: 'Coral',    pt: 'coral',          text: 'Coral is very colorful.', textPt: 'O coral é muito colorido.' }
    ],
    questions: [
      ['Which animal lives in the ocean?', ['Fish', 'Cow', 'Dog', 'Cat'], null, 'Qual animal vive no oceano?'],
      ['What color is the water?', ['Blue', 'Black', 'Pink', 'Yellow'], 'water', 'De que cor é a água?'],
      ['Which animal has eight arms?', ['Octopus', 'Dog', 'Cat', 'Horse'], 'octopus', 'Qual animal tem oito braços?'],
      ['What is this?', ['A starfish', 'A cat', 'A tree', 'A car'], 'starfish', 'O que é isto?'],
      ['Which animal is very big?', ['A whale', 'An ant', 'A bee', 'A mouse'], null, 'Qual animal é muito grande?']
    ]
  },
  {
    id: 'forest', name: 'Forest', namePt: 'Floresta', nextPt: 'o Deserto', number: 3, theme: 'forest',
    intro: 'Siga o caminho até o Guarda Leo!',
    spawn: [40, 86],
    walk: [[5,15],[14,5],[30,5],[45,4],[60,4],[75,8],[85,12],[92,22],[98,32],[99,50],[97,70],[95,85],[85,92],[70,95],[57,97],[40,92],[25,92],[10,92],[5,80],[4,50]],
    solids: [{ e: [58, 37, 6, 10] }, { e: [46, 31, 6, 3.5] }, { e: [10, 9, 5, 6] }, { e: [56, 76, 3, 3] }],
    npc: { look: 'forest', name: 'Guarda Leo', pos: [44, 63],
      hello: 'Bem-vindo(a) à floresta! Eu sou o Guarda Leo. Você consegue responder minhas 5 perguntas?',
      done: 'Muito bem! Você completou a Floresta! A passagem para o Deserto está aberta!' },
    gate: { pos: [78, 24], to: 'o DESERTO' },
    objects: [
      { pos: [22, 68], pic: 'mushroom', word: 'Mushroom', pt: 'cogumelo', text: "Don't eat wild mushrooms!", textPt: 'Não coma cogumelos da floresta!' },
      { pos: [70, 60], pic: 'bird',     word: 'Bird',     pt: 'pássaro',  text: 'Birds can fly.', textPt: 'Pássaros podem voar.' },
      { pos: [88, 45], pic: 'flower',   word: 'Flower',   pt: 'flor',     text: 'This flower is red.', textPt: 'Esta flor é vermelha.' }
    ],
    questions: [
      ['Which animal says "meow"?', ['Cat', 'Dog', 'Cow', 'Duck'], null, 'Qual animal faz "miau"?'],
      ['What is this?', ['A tree', 'A car', 'A fish', 'A book'], 'tree', 'O que é isto?'],
      ['Which animal can fly?', ['Bird', 'Fish', 'Dog', 'Cow'], null, 'Qual animal pode voar?'],
      ['What color are the leaves?', ['Green', 'Purple', 'Blue', 'Black'], null, 'De que cor são as folhas?'],
      ['What is this?', ['A mushroom', 'A car', 'A shoe', 'A cake'], 'mushroom', 'O que é isto?']
    ]
  },
  {
    id: 'desert', name: 'Desert', namePt: 'Deserto', nextPt: 'a Área Final', number: 4, theme: 'desert',
    intro: 'Encontre a Professora Sandy nas dunas!',
    spawn: [48, 86],
    walk: [[5,42],[10,32],[10,22],[20,10],[30,5],[40,6],[50,8],[60,10],[68,8],[80,2],[92,4],[97,12],[97,35],[96,55],[95,70],[96,85],[88,92],[70,92],[55,93],[40,92],[30,88],[15,90],[5,88],[8,75],[5,60]],
    solids: [{ e: [18, 42, 7, 6] }, { e: [29, 17, 6, 6] }, { e: [80, 15, 8, 10] }, { e: [77, 45, 6, 5] }, { e: [27, 68, 7, 8] }, { e: [83, 70, 8, 7] },
             { e: [61, 18, 1.2, 2] }, { e: [49, 57, 1.2, 2] }, { e: [61, 79, 1.2, 2] }, { e: [89, 53, 1.2, 2] }],
    npc: { look: 'desert', name: 'Professora Sandy', pos: [52, 38],
      hello: 'Ufa, que calor! Eu sou a Professora Sandy. Responda 5 perguntas sobre o deserto!',
      done: 'Muito bem! Você completou o Deserto! A Área Final está aberta!' },
    gate: { pos: [86, 86], to: 'a ÁREA FINAL' },
    objects: [
      { pos: [44, 22], pic: 'cactus', word: 'Cactus', pt: 'cacto',  text: 'A cactus can live with very little water.', textPt: 'O cacto vive com pouquinha água.' },
      { pos: [64, 60], pic: 'camel',  word: 'Camel',  pt: 'camelo', text: 'Camels can walk in the hot desert.', textPt: 'Camelos andam no deserto quente.' },
      { pos: [40, 78], pic: 'oasis',  word: 'Oasis',  pt: 'oásis',  text: 'There is water in the oasis!', textPt: 'Tem água no oásis!' }
    ],
    questions: [
      ['Is the desert hot or cold?', ['Hot', 'Cold', 'Snowy', 'Wet'], 'sun', 'O deserto é quente ou frio?'],
      ['Which animal lives in the desert?', ['Camel', 'Penguin', 'Fish', 'Whale'], null, 'Qual animal vive no deserto?'],
      ['What color is the sand?', ['Yellow', 'Blue', 'Purple', 'Green'], null, 'De que cor é a areia?'],
      ['What is this?', ['A cactus', 'A fish', 'A car', 'A ball'], 'cactus', 'O que é isto?'],
      ['Where is the water in the desert?', ['In the oasis', 'In the sun', 'In the sand', 'In the rocks'], 'oasis', 'Onde tem água no deserto?']
    ]
  },
  {
    id: 'boss', name: 'Final Boss', namePt: 'Chefão Final', number: 5, theme: 'boss', isBoss: true,
    intro: 'Enfrente o Guardião do Tesouro!',
    spawn: [50, 88],
    walk: [[9,24],[91,24],[91,95],[9,95]],
    solids: [{ e: [18, 42, 2.6, 3] }, { e: [82, 42, 2.6, 3] }, { e: [18, 74, 2.6, 3] }, { e: [82, 74, 2.6, 3] }],
    boss: { name: 'Guardião do Tesouro', pos: [50, 44] },
    chest: { pos: [50, 27] },
    objects: [],
    questions: [
      ['Which sentence is correct?', ['The fish is in the ocean.', 'The fish is in the desert.', 'The camel is in the ocean.', 'The tree is in the sea.'], 'sentence', 'Qual frase está correta? (Dica: onde o peixe vive?)']
    ]
  }
];

const TOTAL_WORDS = LEVELS.reduce((n, l) => n + l.objects.length, 0);

function introLines() {
  const h = selectedHero;
  return [
    'Olá! Bem-vindo(a) à <b>English Island</b>!',
    `Eu sou ${h.girl ? 'a' : 'o'} <b>${h.name}</b>, ${h.girl ? 'sua guia' : 'seu guia'}! Eu adoro aventuras!`,
    'Vamos explorar <b>quatro mundos</b>: a Ilha, o Oceano, a Floresta e o Deserto.',
    'Em cada mundo, converse com o professor e responda <b>5 perguntas em inglês</b>.',
    'Atenção! Você tem <b>duas chances</b> em cada pergunta.',
    'Se errar duas vezes a <b>mesma</b> pergunta, a aventura recomeça do início.',
    'Ficou com dúvida? Use o botão <b>Dica</b> para ver a pergunta em português.',
    'No final, vença o Guardião e encontre o tesouro! Preparado(a)? <b>Vamos lá!</b>'
  ];
}

/* Convert percentage geometry into world pixels (done once). */
const px = (x) => x * WORLD_W / 100;
const py = (y) => y * WORLD_H / 100;
LEVELS.forEach((L) => {
  L.walkPx = L.walk.map(([x, y]) => [px(x), py(y)]);
  L.solidsPx = L.solids.map((s) => s.e
    ? { type: 'e', x: px(s.e[0]), y: py(s.e[1]), rx: px(s.e[2]), ry: py(s.e[3]) }
    : { type: 'r', x: px(s.r[0]), y: py(s.r[1]), w: px(s.r[2]), h: py(s.r[3]) });
});

/* =====================================================================
   5. GAME STATE
   Everything that changes during a match lives here.
   resetState() recreates it from zero (used by Start / Restart / Play Again).
   ===================================================================== */
let state = null;

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function createState() {
  return {
    mode: 'title',             // title | intro | explore | dialog | message | transition | cutscene | gameover | victory
    levelIndex: 0,
    score: 0,
    player: { x: 0, y: 0, facing: 1, moving: false },
    // One progress object per level — each level keeps its own progress.
    progress: LEVELS.map((L) => ({
      questions: L.questions.map((q) => ({ solved: false, wrong: 0, order: shuffle(q[1]) })),
      completed: false,
      bonusGiven: false,
      mistakes: 0,
      completeShown: false
    })),
    objectsFound: new Set(),
    bossDefeated: false,
    dialog: null,              // { li, qi } of the open question
    answerLocked: false,
    near: null,                // nearest interactable
    lastLockedToast: 0,
    timers: []
  };
}

/* =====================================================================
   6. DOM REFERENCES AND HELPERS
   ===================================================================== */
const $ = (id) => document.getElementById(id);
const dom = {
  screens: {
    title: $('screen-title'), select: $('screen-select'), intro: $('screen-intro'), game: $('screen-game'),
    gameover: $('screen-gameover'), victory: $('screen-victory')
  },
  viewport: $('viewport'), world: $('world'), worldBg: $('world-bg'), worldDeco: $('world-deco'),
  entities: $('entities'), player: $('player'), debug: $('debug-layer'), fx: $('fx-layer'),
  prompt: $('interact-prompt'), arrow: $('guide-arrow'),
  mission: $('mission'), missionBody: $('mission-body'), missionToggle: $('mission-toggle'),
  banner: $('level-banner'), toast: $('toast'),
  hudLevel: $('hud-level'), hudWorlds: $('hud-worlds'), hudQuestions: $('hud-questions'),
  hudScore: $('hud-score'), hudWords: $('hud-words'), btnSound: $('btn-sound'), btnHelp: $('btn-help'),
  dpad: $('dpad'), btnAction: $('btn-action'),
  dialog: $('dialog'), dlgPortrait: $('dlg-portrait'), dlgName: $('dlg-name'), dlgTag: $('dlg-tag'),
  dlgChances: $('dlg-chances'), dlgClose: $('dlg-close'), dlgGreet: $('dlg-greet'), dlgPic: $('dlg-pic'),
  dlgQuestion: $('dlg-question'), dlgHintBtn: $('dlg-hint-btn'), dlgHint: $('dlg-hint'), dlgAnswers: $('dlg-answers'), dlgFeedback: $('dlg-feedback'), dlgActions: $('dlg-actions'),
  message: $('message'), msgArt: $('msg-art'), msgTitle: $('msg-title'), msgBody: $('msg-body'), msgActions: $('msg-actions'),
  curtain: $('curtain'), confetti: $('confetti')
};

/** Timers that must be cancelled on restart (avoids old timers acting on a new match). */
function later(fn, ms) {
  const id = setTimeout(fn, ms);
  if (state) state.timers.push(id);
  return id;
}
function clearTimers() {
  if (!state) return;
  state.timers.forEach(clearTimeout);
  state.timers = [];
}

const isTouch = () => window.matchMedia('(hover: none), (pointer: coarse)').matches;
const L = () => LEVELS[state.levelIndex];
const P = () => state.progress[state.levelIndex];
const solvedCount = (li) => state.progress[li].questions.filter((q) => q.solved).length;
const isLevelComplete = (li) => state.progress[li].questions.every((q) => q.solved);
const nextLevelName = (li) => LEVELS[li].nextPt || '';

/* =====================================================================
   7. SOUND (optional — Web Audio; the game works fine without it)
   ===================================================================== */
const Sound = {
  enabled: true,
  ctx: null,
  unlock() {
    try {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (AC) this.ctx = new AC();
      }
      if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    } catch (e) { this.ctx = null; }
  },
  tone(freq, dur, type = 'sine', delay = 0, vol = 0.12) {
    if (!this.enabled || !this.ctx) return;
    try {
      const t = this.ctx.currentTime + delay;
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = type;
      o.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g);
      g.connect(this.ctx.destination);
      o.start(t);
      o.stop(t + dur + 0.05);
    } catch (e) { /* audio blocked: ignore */ }
  },
  play(name) {
    const seq = {
      click:   [[660, 0.07, 'triangle']],
      correct: [[523, 0.12, 'triangle', 0], [659, 0.12, 'triangle', 0.1], [784, 0.2, 'triangle', 0.2]],
      wrong:   [[220, 0.22, 'sawtooth', 0, 0.07], [180, 0.25, 'sawtooth', 0.15, 0.07]],
      unlock:  [[784, 0.12, 'sine', 0], [988, 0.12, 'sine', 0.1], [1175, 0.12, 'sine', 0.2], [1568, 0.3, 'sine', 0.3]],
      word:    [[880, 0.1, 'sine', 0], [1320, 0.15, 'sine', 0.08]],
      locked:  [[300, 0.12, 'square', 0, 0.05], [260, 0.12, 'square', 0.12, 0.05]],
      boss:    [[196, 0.3, 'sawtooth', 0, 0.08], [147, 0.4, 'sawtooth', 0.25, 0.08]],
      over:    [[392, 0.2, 'triangle', 0], [330, 0.2, 'triangle', 0.2], [262, 0.4, 'triangle', 0.4]],
      win:     [[523, 0.15, 'triangle', 0], [659, 0.15, 'triangle', 0.15], [784, 0.15, 'triangle', 0.3], [1047, 0.5, 'triangle', 0.45]]
    }[name] || [];
    seq.forEach(([f, d, t, delay = 0, v]) => this.tone(f, d, t, delay, v));
  }
};

/* =====================================================================
   8. SCREENS
   ===================================================================== */
function showScreen(name) {
  Object.entries(dom.screens).forEach(([key, el]) => el.classList.toggle('active', key === name));
  if (name === 'game') resizeViewport();
}

let introPage = 0;
function renderIntro() {
  const lines = introLines();
  $('intro-text').innerHTML = lines[introPage];
  $('intro-page').textContent = `${introPage + 1}/${lines.length}`;
  $('intro-prev').disabled = introPage === 0;
  $('intro-next').disabled = introPage === lines.length - 1;
  $('btn-start').classList.toggle('pulse', introPage === lines.length - 1);
}

/* ---------- Character selection ---------- */
function renderHeroCards() {
  $('hero-cards').innerHTML = HEROES.map((h) => `
    <button type="button" class="hero-card ${h === selectedHero ? 'selected' : ''}" role="radio"
      aria-checked="${h === selectedHero}" data-hero="${h.id}">
      <span class="hero-card-art">${characterHTML(LOOKS[h.look])}</span>
      <span class="hero-card-name">${h.name}</span>
      <span class="hero-card-check" aria-hidden="true">✔</span>
    </button>`).join('');
  $('hero-cards').querySelectorAll('.hero-card').forEach((card) => {
    card.addEventListener('click', () => {
      Sound.play('click');
      selectedHero = HEROES.find((h) => h.id === card.dataset.hero);
      renderHeroCards();
      $('btn-select-ok').focus();
    });
  });
}

/** Draws the chosen character on the intro and victory screens. */
function refreshHeroArt() {
  $('intro-char').innerHTML = characterHTML(heroLook());
  $('victory-hero').innerHTML = characterHTML(heroLook());
}

function buildStaticArt() {
  $('title-hero').innerHTML = HEROES.map((h) => `<div class="title-hero-char">${characterHTML(LOOKS[h.look])}</div>`).join('');
  refreshHeroArt();
  $('victory-treasure').innerHTML = chestSVG(true);
  $('gameover-art').innerHTML = guardianSVG();
  if (ASSETS.backgrounds.island) $('title-bg').style.backgroundImage = `url("${ASSETS.backgrounds.island}")`;

  // World thumbnails on the intro screen
  $('worlds-row').innerHTML = LEVELS.map((lv) => {
    const bg = ASSETS.backgrounds[lv.id];
    return `<li class="world-thumb theme-${lv.theme}" ${bg ? `style="background-image:url('${bg}')"` : ''}>
      <span>${lv.isBoss ? 'Tesouro' : lv.namePt}</span></li>`;
  }).join('');
}

/* =====================================================================
   9. LEVEL LOADING AND DRAWING
   ===================================================================== */
let interactables = [];   // { kind, x, y, solidR, el, data }

function loadLevel(index) {
  state.levelIndex = index;
  const lv = L();

  // Background (with CSS fallback if the image file is missing)
  dom.world.className = `world theme-${lv.theme}`;
  const bg = ASSETS.backgrounds[lv.id];
  if (bg) {
    dom.worldBg.hidden = false;
    dom.worldBg.onerror = () => { dom.worldBg.hidden = true; dom.world.classList.add('no-image'); };
    dom.worldBg.src = bg;
  } else {
    dom.worldBg.hidden = true;
    dom.worldBg.removeAttribute('src');
    dom.world.classList.add('no-image');
  }

  buildDecorations(lv);
  buildEntities(lv);
  buildFx(lv);

  // Player at the start position of the level
  state.player.x = px(lv.spawn[0]);
  state.player.y = py(lv.spawn[1]);
  state.player.facing = 1;
  state.player.moving = false;
  dom.player.innerHTML = characterHTML(heroLook());
  dom.player.className = 'sprite player' + (lv.theme === 'ocean' ? ' underwater' : '');

  renderPlayer();
  updateHUD();
  updateMission();
  updateCamera(true);
  drawDebug(lv);
}

/** Extra scenery drawn with CSS (the boss arena has no image). */
function buildDecorations(lv) {
  let html = '';
  if (lv.isBoss) {
    html += '<div class="arena-floor"></div><div class="arena-carpet"></div><div class="arena-rune"></div><div class="arena-wall"></div>';
    lv.solids.forEach((s) => {
      html += `<div class="pillar" style="left:${s.e[0]}%;top:${s.e[1]}%"><div class="flame"></div></div>`;
    });
    html += '<div class="gold-pile" style="left:38%;top:24%"></div><div class="gold-pile" style="left:62%;top:24%"></div>';
  }
  dom.worldDeco.innerHTML = html;
}

/** Ambient particles in front of the scenery (different in each world). */
function buildFx(lv) {
  const kinds = { island: 'sparkle', ocean: 'bubble', forest: 'leaf', desert: 'heat', boss: 'ember' };
  const k = kinds[lv.theme];
  let html = '';
  const n = lv.theme === 'desert' ? 6 : 16;
  for (let i = 0; i < n; i++) {
    const left = Math.round(Math.random() * 100);
    const delay = (Math.random() * 8).toFixed(2);
    const dur = (6 + Math.random() * 6).toFixed(2);
    const size = (0.6 + Math.random() * 0.9).toFixed(2);
    const top = (k === 'bubble' || k === 'leaf') ? '' : `top:${Math.round(5 + Math.random() * 85)}%;`;
    html += `<span class="fx fx-${k}" style="left:${left}%;${top}animation-delay:-${delay}s;animation-duration:${dur}s;--s:${size}"></span>`;
  }
  dom.fx.className = `fx-layer fx-theme-${lv.theme}`;
  dom.fx.innerHTML = html;
}

function placeEntity(el, x, y) {
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  el.style.zIndex = Math.round(y);
}

function buildEntities(lv) {
  dom.entities.innerHTML = '';
  interactables = [];
  const li = state.levelIndex;

  // NPC (teacher of the level)
  if (lv.npc) {
    const el = document.createElement('div');
    el.className = 'entity npc';
    el.innerHTML = `<div class="npc-bubble" aria-hidden="true"></div>
      <div class="sprite-body">${characterHTML(LOOKS[lv.npc.look])}</div>
      <div class="name-tag">${lv.npc.name}</div>`;
    const x = px(lv.npc.pos[0]); const y = py(lv.npc.pos[1]);
    placeEntity(el, x, y);
    dom.entities.appendChild(el);
    interactables.push({ kind: 'npc', x, y, solidR: 30, el, data: lv.npc });
  }

  // Passage to the next level
  if (lv.gate) {
    const el = document.createElement('div');
    el.className = 'entity gate';
    el.innerHTML = `
      <div class="gate-portal"></div>
      <div class="gate-arch"><div class="gate-door gate-door-l"></div><div class="gate-door gate-door-r"></div>
        <div class="gate-lock" aria-hidden="true"><span></span></div></div>
      <div class="gate-label"><span class="gate-state"></span> Para ${lv.gate.to}</div>`;
    const x = px(lv.gate.pos[0]); const y = py(lv.gate.pos[1]);
    placeEntity(el, x, y);
    dom.entities.appendChild(el);
    interactables.push({ kind: 'gate', x, y, solidR: 52, el, data: lv.gate });
  }

  // Objects with English words
  lv.objects.forEach((o, i) => {
    const key = `${lv.id}-${i}`;
    const el = document.createElement('div');
    el.className = 'entity obj' + (state.objectsFound.has(key) ? ' found' : '') + (o.pic === 'oasis' ? ' obj-big' : '');
    el.innerHTML = `<div class="obj-glow"></div>${picSVG(o.pic, 'obj-svg')}`;
    const x = px(o.pos[0]); const y = py(o.pos[1]);
    placeEntity(el, x, y);
    dom.entities.appendChild(el);
    interactables.push({ kind: 'object', x, y, solidR: 0, el, data: { ...o, key } });
  });

  // Final boss + treasure chest
  if (lv.boss) {
    const chest = document.createElement('div');
    chest.className = 'entity chest';
    chest.innerHTML = chestSVG(false);
    placeEntity(chest, px(lv.chest.pos[0]), py(lv.chest.pos[1]));
    dom.entities.appendChild(chest);
    interactables.push({ kind: 'chest', x: px(lv.chest.pos[0]), y: py(lv.chest.pos[1]), solidR: 48, el: chest, data: {} });

    const el = document.createElement('div');
    el.className = 'entity boss';
    el.innerHTML = `<div class="sprite-body">${bossHTML()}</div><div class="name-tag name-tag-boss">${lv.boss.name}</div>`;
    const x = px(lv.boss.pos[0]); const y = py(lv.boss.pos[1]);
    placeEntity(el, x, y);
    dom.entities.appendChild(el);
    interactables.push({ kind: 'boss', x, y, solidR: 70, el, data: lv.boss });
  }

  refreshEntities();
}

/** Updates NPC bubbles and the passage look according to the LOGIC state. */
function refreshEntities() {
  const li = state.levelIndex;
  const complete = isLevelComplete(li);
  interactables.forEach((it) => {
    if (it.kind === 'npc') {
      it.el.classList.toggle('done', complete);
      it.el.querySelector('.npc-bubble').textContent = complete ? '✔' : '!';
    }
    if (it.kind === 'gate') {
      it.el.classList.toggle('unlocked', complete);
      it.el.classList.toggle('locked', !complete);
      it.el.querySelector('.gate-state').textContent = complete ? 'ABERTO:' : 'FECHADO:';
    }
  });
}

function drawDebug(lv) {
  if (!DEBUG) { dom.debug.style.display = 'none'; return; }
  dom.debug.setAttribute('viewBox', `0 0 ${WORLD_W} ${WORLD_H}`);
  let s = `<polygon points="${lv.walkPx.map((p) => p.join(',')).join(' ')}" fill="rgba(0,255,0,.15)" stroke="lime" stroke-width="4"/>`;
  lv.solidsPx.forEach((o) => {
    s += o.type === 'e'
      ? `<ellipse cx="${o.x}" cy="${o.y}" rx="${o.rx}" ry="${o.ry}" fill="rgba(255,0,0,.3)" stroke="red" stroke-width="3"/>`
      : `<rect x="${o.x}" y="${o.y}" width="${o.w}" height="${o.h}" fill="rgba(255,0,0,.3)" stroke="red" stroke-width="3"/>`;
  });
  interactables.forEach((it) => { if (it.solidR) s += `<circle cx="${it.x}" cy="${it.y}" r="${it.solidR}" fill="rgba(255,0,255,.3)"/>`; });
  dom.debug.innerHTML = s;
}

/* ---------- HUD and mission panel ---------- */
function updateHUD() {
  const li = state.levelIndex;
  const lv = L();
  dom.hudLevel.textContent = lv.isBoss ? 'CHEFÃO FINAL' : `NÍVEL ${lv.number} · ${lv.namePt.toUpperCase()}`;
  dom.hudScore.textContent = state.score;
  dom.hudWords.textContent = `${state.objectsFound.size}/${TOTAL_WORDS}`;
  dom.hudQuestions.textContent = `${solvedCount(li)}/${lv.questions.length}`;
  dom.hudWorlds.innerHTML = LEVELS.map((w, i) => {
    const done = i === LEVELS.length - 1 ? state.bossDefeated : state.progress[i].completed;
    const cls = done ? 'done' : i === li ? 'current' : i > li ? 'locked' : '';
    const mark = done ? '✔' : i > li ? '<span class="mini-lock"></span>' : '●';
    return `<li class="hud-world ${cls}" title="${w.namePt}"><span class="hud-world-mark">${mark}</span><span class="hud-world-name">${w.isBoss ? 'Chefão' : w.namePt}</span></li>`;
  }).join('');
}

function bumpScore() {
  dom.hudScore.classList.remove('bump');
  void dom.hudScore.offsetWidth;
  dom.hudScore.classList.add('bump');
}

function updateMission() {
  const li = state.levelIndex;
  const lv = L();
  const done = solvedCount(li);
  const total = lv.questions.length;
  const dots = lv.questions.map((_, i) => `<span class="dot ${state.progress[li].questions[i].solved ? 'on' : ''}">${state.progress[li].questions[i].solved ? '★' : i + 1}</span>`).join('');
  let html;
  if (lv.isBoss) {
    html = `<h3>DESAFIO FINAL</h3>
      <p>Converse com o <b>Guardião do Tesouro</b>.</p>
      <p>Acerte a pergunta final para ganhar o tesouro!</p>
      <p class="mission-next">Lembre-se: só 2 chances!</p>`;
  } else if (isLevelComplete(li)) {
    html = `<h3 class="mission-done">NÍVEL CONCLUÍDO!</h3>
      <p>Caminho liberado para <b>${nextLevelName(li)}</b>!</p>
      <div class="mission-dots">${dots}</div>
      <p class="mission-next">Vá até a passagem para continuar. Siga a seta!</p>`;
  } else {
    html = `<h3>${lv.namePt.toUpperCase()}</h3>
      <p>Vá até <b>${lv.npc.name}</b>.<br>Responda as ${total} perguntas deste mundo.</p>
      <div class="mission-dots" aria-label="Desafios concluídos">${dots}</div>
      <p class="mission-count">Desafios concluídos: <b>${done}/${total}</b></p>
      <p class="mission-next">${done === 0 ? lv.intro : 'Fale de novo com ' + lv.npc.name + ' para a próxima pergunta.'}</p>
      <p class="mission-tip">Dica: objetos brilhantes ensinam palavras novas!</p>`;
  }
  dom.missionBody.innerHTML = html;
}

/* ---------- Toast, banner and confetti ---------- */
let toastTimer = null;
function toast(html, ms = 2400) {
  dom.toast.innerHTML = html;
  dom.toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => dom.toast.classList.remove('show'), ms);
}

function showBanner(title, sub) {
  dom.banner.innerHTML = `<div class="banner-title">${title}</div><div class="banner-sub">${sub}</div>`;
  dom.banner.classList.remove('show');
  void dom.banner.offsetWidth;
  dom.banner.classList.add('show');
}

function confetti(amount = 90) {
  const colors = ['#ff8a00', '#ffd23f', '#13b5b1', '#ff4f81', '#7bd389', '#4f8cff'];
  let html = '';
  for (let i = 0; i < amount; i++) {
    html += `<i style="left:${Math.random() * 100}%;background:${colors[i % colors.length]};animation-delay:${(Math.random() * 0.8).toFixed(2)}s;animation-duration:${(2 + Math.random() * 1.6).toFixed(2)}s;transform:rotate(${Math.random() * 360}deg)"></i>`;
  }
  dom.confetti.innerHTML = html;
  dom.confetti.classList.add('show');
  setTimeout(() => { dom.confetti.classList.remove('show'); dom.confetti.innerHTML = ''; }, 4200);
}

/* =====================================================================
   10. INPUT (keyboard + touch pad)
   ===================================================================== */
const input = { keys: new Set(), pad: { up: false, down: false, left: false, right: false } };

const KEY_DIRS = {
  KeyW: 'up', ArrowUp: 'up', KeyS: 'down', ArrowDown: 'down',
  KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right'
};

function clearInput() {
  input.keys.clear();
  Object.keys(input.pad).forEach((k) => { input.pad[k] = false; });
  dom.dpad.querySelectorAll('.pressed').forEach((b) => b.classList.remove('pressed'));
}

function dirPressed(dir) {
  if (input.pad[dir]) return true;
  for (const code of input.keys) if (KEY_DIRS[code] === dir) return true;
  return false;
}

window.addEventListener('keydown', (e) => {
  Sound.unlock();
  const code = e.code;
  // Keyboard shortcuts while a question is open: 1-4 choose an answer
  if (state && state.mode === 'dialog' && state.dialog) {
    const n = { Digit1: 0, Digit2: 1, Digit3: 2, Digit4: 3, Numpad1: 0, Numpad2: 1, Numpad3: 2, Numpad4: 3 }[code];
    if (n !== undefined) { e.preventDefault(); chooseAnswer(n); }
    return;
  }
  if (state && state.mode === 'message' && code === 'Escape') {
    const first = dom.msgActions.querySelector('button');
    if (first) first.click();
    return;
  }
  if (!state || state.mode !== 'explore') return;
  if (KEY_DIRS[code]) {
    e.preventDefault();
    input.keys.add(code);
  } else if (code === 'KeyE' || code === 'Space' || code === 'Enter') {
    e.preventDefault();
    if (!e.repeat) interact();
  }
});
window.addEventListener('keyup', (e) => input.keys.delete(e.code));
window.addEventListener('blur', clearInput);
document.addEventListener('visibilitychange', () => { if (document.hidden) clearInput(); });

/* Touch pad: the whole pad is one control. The direction is calculated from
   the finger position, so sliding the finger changes direction (and diagonals work). */
function setupDpad() {
  let activePointer = null;
  const buttons = {};
  dom.dpad.querySelectorAll('[data-dir]').forEach((b) => { buttons[b.dataset.dir] = b; });

  function update(e) {
    const r = dom.dpad.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    const dead = r.width * 0.12;
    const dist = Math.hypot(dx, dy);
    const set = { up: false, down: false, left: false, right: false };
    if (dist > dead) {
      const ang = Math.atan2(dy, dx) * 180 / Math.PI; // -180..180, 0 = right
      if (ang > -67.5 && ang < 67.5) set.right = true;
      if (ang > 112.5 || ang < -112.5) set.left = true;
      if (ang > 22.5 && ang < 157.5) set.down = true;
      if (ang < -22.5 && ang > -157.5) set.up = true;
    }
    Object.keys(set).forEach((k) => {
      input.pad[k] = set[k];
      buttons[k].classList.toggle('pressed', set[k]);
    });
  }
  function release(e) {
    if (activePointer !== null && e.pointerId !== activePointer) return;
    activePointer = null;
    Object.keys(input.pad).forEach((k) => { input.pad[k] = false; buttons[k].classList.remove('pressed'); });
  }
  dom.dpad.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    Sound.unlock();
    activePointer = e.pointerId;
    try { dom.dpad.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    update(e);
  });
  dom.dpad.addEventListener('pointermove', (e) => { if (e.pointerId === activePointer) { e.preventDefault(); update(e); } });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((ev) => dom.dpad.addEventListener(ev, release));
  dom.dpad.addEventListener('contextmenu', (e) => e.preventDefault());

  dom.btnAction.addEventListener('pointerdown', (e) => { e.preventDefault(); Sound.unlock(); interact(); });
  dom.btnAction.addEventListener('click', (e) => { if (e.detail === 0) interact(); }); // keyboard activation
  dom.btnAction.addEventListener('contextmenu', (e) => e.preventDefault());
  dom.prompt.addEventListener('click', () => interact());
}

/* =====================================================================
   11. GAME LOOP, MOVEMENT AND COLLISIONS
   ===================================================================== */
function pointInPoly(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i]; const [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function inSolid(x, y, s) {
  if (s.type === 'e') {
    const dx = (x - s.x) / s.rx; const dy = (y - s.y) / s.ry;
    return dx * dx + dy * dy < 1;
  }
  return x > s.x && x < s.x + s.w && y > s.y && y < s.y + s.h;
}

/** Can the player's feet stand at (x, y)? Checks map limits, obstacles, NPCs and LOCKED passages. */
function canStand(x, y) {
  const lv = L();
  const r = PLAYER_RADIUS;
  const samples = [[x, y], [x - r, y], [x + r, y], [x, y - r * 0.6], [x, y + r * 0.6]];
  for (const [sx, sy] of samples) {
    if (sx < 20 || sy < 40 || sx > WORLD_W - 20 || sy > WORLD_H - 10) return false;
    if (!pointInPoly(sx, sy, lv.walkPx)) return false;
    for (const s of lv.solidsPx) if (inSolid(sx, sy, s)) return false;
  }
  const complete = isLevelComplete(state.levelIndex);
  for (const it of interactables) {
    if (!it.solidR) continue;
    if (it.kind === 'gate' && complete) continue; // open passage: the player may walk in
    if (it.kind === 'boss' && state.bossDefeated) continue;
    const dx = x - it.x; const dy = (y - it.y) * 1.4;
    if (Math.hypot(dx, dy) < it.solidR + r) return false;
  }
  return true;
}

let lastTime = 0;
function loop(t) {
  const dt = Math.min(0.05, (t - lastTime) / 1000 || 0);
  lastTime = t;
  if (state && state.mode === 'explore') {
    updatePlayer(dt);
    updateCamera(false);
    updateNear();
  }
  requestAnimationFrame(loop);
}

function updatePlayer(dt) {
  const p = state.player;
  let dx = (dirPressed('right') ? 1 : 0) - (dirPressed('left') ? 1 : 0);
  let dy = (dirPressed('down') ? 1 : 0) - (dirPressed('up') ? 1 : 0);
  if (dx || dy) {
    const len = Math.hypot(dx, dy);
    dx /= len; dy /= len;
    const step = PLAYER_SPEED * dt;
    const stuck = !canStand(p.x, p.y);         // safety: never trap the player
    const nx = p.x + dx * step;
    if (stuck || canStand(nx, p.y)) p.x = nx;
    const ny = p.y + dy * step;
    if (stuck || canStand(p.x, ny)) p.y = ny;
    p.x = Math.max(20, Math.min(WORLD_W - 20, p.x));
    p.y = Math.max(40, Math.min(WORLD_H - 10, p.y));
    if (dx) p.facing = dx > 0 ? 1 : -1;
    p.moving = true;
  } else {
    p.moving = false;
  }
  renderPlayer();
  checkGateEnter();
}

function renderPlayer() {
  const p = state.player;
  dom.player.style.transform = `translate3d(${p.x}px, ${p.y}px, 0)`;
  dom.player.style.zIndex = Math.round(p.y);
  dom.player.classList.toggle('walking', p.moving);
  dom.player.classList.toggle('face-left', p.facing < 0);
}

/* =====================================================================
   12. CAMERA, INTERACTION PROMPT AND GUIDE ARROW
   ===================================================================== */
const cam = { x: 0, y: 0, zoom: 1, vw: 1, vh: 1 };

function resizeViewport() {
  cam.vw = dom.viewport.clientWidth || window.innerWidth;
  cam.vh = dom.viewport.clientHeight || window.innerHeight;
  // The map always fills the screen and is a bit bigger, so the camera can follow the player.
  const cover = Math.max(cam.vw / WORLD_W, cam.vh / WORLD_H);
  cam.zoom = Math.max(cover * 1.12, cam.vw < 700 ? 0.5 : 0.62);
  if (state) updateCamera(true);
}

function updateCamera(snap) {
  const p = state.player;
  const maxX = WORLD_W * cam.zoom - cam.vw;
  const maxY = WORLD_H * cam.zoom - cam.vh;
  const tx = Math.max(0, Math.min(maxX, p.x * cam.zoom - cam.vw / 2));
  const ty = Math.max(0, Math.min(maxY, (p.y - 40) * cam.zoom - cam.vh / 2));
  if (snap) { cam.x = tx; cam.y = ty; } else { cam.x += (tx - cam.x) * 0.15; cam.y += (ty - cam.y) * 0.15; }
  dom.world.style.transform = `translate3d(${-cam.x}px, ${-cam.y}px, 0) scale(${cam.zoom})`;
}

const toScreen = (x, y) => [x * cam.zoom - cam.x, y * cam.zoom - cam.y];

function updateNear() {
  const p = state.player;
  let best = null; let bestD = Infinity;
  interactables.forEach((it) => {
    if (it.kind === 'chest') return;
    if (it.kind === 'boss' && state.bossDefeated) return;
    const d = Math.hypot(p.x - it.x, (p.y - it.y) * 1.2);
    const range = INTERACT_DIST + (it.solidR || 0);
    if (d < range && d < bestD) { best = it; bestD = d; }
  });
  state.near = best;

  // "Press E" prompt (drawn in screen space so it stays readable on small screens)
  if (best) {
    const labels = { npc: 'conversar', boss: 'enfrentar o Guardião', object: 'ver', gate: isLevelComplete(state.levelIndex) ? 'entrar' : 'ver a passagem' };
    const btnLabel = best.kind === 'object' ? 'VER' : best.kind === 'gate' ? 'IR' : 'FALAR';
    dom.prompt.textContent = isTouch() ? `Toque em ${btnLabel}` : `Aperte E para ${labels[best.kind]}`;
    const headY = best.kind === 'boss' ? 310 : best.kind === 'gate' ? 240 : best.kind === 'object' ? 110 : 228;
    const [sx, sy] = toScreen(best.x, best.y - headY);
    dom.prompt.style.transform = `translate(${sx}px, ${sy}px) translate(-50%, -100%)`;
    dom.prompt.classList.add('show');
    dom.btnAction.textContent = btnLabel;
    dom.btnAction.classList.add('ready');
  } else {
    dom.prompt.classList.remove('show');
    dom.btnAction.textContent = 'FALAR';
    dom.btnAction.classList.remove('ready');
  }

  // Guide arrow pointing to the current goal (teacher, passage or boss)
  const target = currentTarget();
  const [psx, psy] = toScreen(p.x, p.y - 50);
  if (target && Math.hypot(target.x - p.x, target.y - p.y) > 260) {
    const ang = Math.atan2(target.y - p.y, target.x - p.x);
    const dist = 70;
    dom.arrow.style.transform = `translate(${psx + Math.cos(ang) * dist}px, ${psy + Math.sin(ang) * dist}px) translate(-50%, -50%) rotate(${ang}rad)`;
    dom.arrow.classList.add('show');
  } else {
    dom.arrow.classList.remove('show');
  }
}

function currentTarget() {
  const complete = isLevelComplete(state.levelIndex);
  return interactables.find((it) => (L().isBoss ? it.kind === 'boss' && !state.bossDefeated : complete ? it.kind === 'gate' : it.kind === 'npc'));
}

/* =====================================================================
   13. INTERACTION
   ===================================================================== */
function interact() {
  if (!state || state.mode !== 'explore') return;   // never open two windows at the same time
  updateNear();                                      // always use the current position
  const it = state.near;
  if (!it) { toast('Chegue mais perto de um personagem ou objeto.', 1800); return; }
  Sound.play('click');
  if (it.kind === 'npc') talkToNpc();
  else if (it.kind === 'object') openObject(it);
  else if (it.kind === 'gate') useGate();
  else if (it.kind === 'boss') openBossIntro();
}

function talkToNpc() {
  const li = state.levelIndex;
  const lv = L();
  if (isLevelComplete(li)) {
    showMessage({
      art: characterHTML(LOOKS[lv.npc.look]), title: lv.npc.name, cls: 'msg-npc',
      body: `<p class="big-text">${lv.npc.done}</p><p>Caminhe até a passagem brilhante para ir para <b>${nextLevelName(li)}</b>.</p>`,
      buttons: [{ label: 'OK!', primary: true, onClick: closeMessage }]
    });
    return;
  }
  const qi = P().questions.findIndex((q) => !q.solved);
  openQuestion(li, qi);
}

function openObject(it) {
  const o = it.data;
  const isNew = !state.objectsFound.has(o.key);
  if (isNew) {
    state.objectsFound.add(o.key);
    it.el.classList.add('found');
    Sound.play('word');
    updateHUD();
  }
  showMessage({
    art: picSVG(o.pic, 'msg-pic'), title: o.word, cls: 'msg-word',
    body: `<p class="word-pt">Em português: <b>${o.pt}</b></p><p class="big-text">"${o.text}"</p><p class="word-pt">(${o.textPt})</p>
           ${isNew ? `<p class="word-new">✔ Palavra nova! (${state.objectsFound.size}/${TOTAL_WORDS})</p>` : ''}`,
    buttons: [{ label: 'Legal!', primary: true, onClick: closeMessage }]
  });
}

function useGate() {
  const li = state.levelIndex;
  if (isLevelComplete(li)) { goToNextLevel(); return; }
  const left = L().questions.length - solvedCount(li);
  Sound.play('locked');
  toast(`<b>A passagem está fechada!</b><br>Responda mais ${left} ${left > 1 ? 'perguntas' : 'pergunta'} com ${L().npc.name}.`, 2800);
}

/** Walking into an OPEN passage moves to the next level. A locked one only shows a message. */
function checkGateEnter() {
  const gate = interactables.find((it) => it.kind === 'gate');
  if (!gate) return;
  const p = state.player;
  const d = Math.hypot(p.x - gate.x, (p.y - gate.y) * 1.4);
  if (isLevelComplete(state.levelIndex)) {
    if (d < 40) goToNextLevel();
  } else if (d < gate.solidR + PLAYER_RADIUS + 8) {
    const now = performance.now();
    if (now - state.lastLockedToast > 3000) {
      state.lastLockedToast = now;
      useGate();
    }
  }
}

/* ---------- Generic message window ---------- */
function showMessage({ art = '', title = '', body = '', buttons = [], cls = '' }) {
  state.mode = 'message';
  clearInput();
  dom.message.querySelector('.message-box').className = `message-box ${cls}`;
  dom.msgArt.innerHTML = art;
  dom.msgArt.hidden = !art;
  dom.msgTitle.innerHTML = title;
  dom.msgBody.innerHTML = body;
  dom.msgActions.innerHTML = '';
  buttons.forEach((b) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `btn ${b.primary ? 'btn-primary' : 'btn-light'}`;
    btn.innerHTML = b.label;
    btn.addEventListener('click', () => { Sound.play('click'); b.onClick(); }, { once: true });
    dom.msgActions.appendChild(btn);
  });
  dom.message.hidden = false;
  const first = dom.msgActions.querySelector('button');
  if (first) setTimeout(() => first.focus(), 30);
}

function closeMessage() {
  dom.message.hidden = true;
  if (state.mode === 'message') state.mode = 'explore';
  clearInput();
}

/* =====================================================================
   14. QUESTION SYSTEM — max 2 answers per question
   ===================================================================== */
function getQuestion(li, qi) {
  const data = LEVELS[li].questions[qi];
  const prog = state.progress[li].questions[qi];
  return { text: data[0], answer: data[1][0], pic: data[2], hint: data[3] || '', prog };
}

function openQuestion(li, qi) {
  if (state.mode !== 'explore' && state.mode !== 'dialog') return;
  if (qi < 0) return;
  const lv = LEVELS[li];
  const q = getQuestion(li, qi);
  if (q.prog.solved) return;

  state.mode = 'dialog';
  state.dialog = { li, qi };
  state.answerLocked = false;
  clearInput();

  const isBoss = !!lv.isBoss;
  dom.dialog.classList.toggle('boss-dialog', isBoss);
  dom.dlgPortrait.innerHTML = isBoss ? bossHTML() : characterHTML(LOOKS[lv.npc.look]);
  dom.dlgName.textContent = isBoss ? lv.boss.name : lv.npc.name;
  dom.dlgTag.textContent = isBoss ? 'DESAFIO FINAL' : `PERGUNTA ${qi + 1} DE ${lv.questions.length}`;
  dom.dlgGreet.textContent = isBoss ? 'Mostre o que você aprendeu!' : (solvedCount(li) === 0 && q.prog.wrong === 0 ? lv.npc.hello : '');
  dom.dlgGreet.hidden = !dom.dlgGreet.textContent;
  dom.dlgQuestion.textContent = q.text;
  dom.dlgPic.innerHTML = q.pic ? picSVG(q.pic, 'question-svg') : '';
  dom.dlgPic.hidden = !q.pic;
  dom.dlgClose.hidden = false;
  // Portuguese hint (optional — does not change points or chances)
  dom.dlgHint.textContent = q.hint;
  dom.dlgHint.hidden = true;
  dom.dlgHintBtn.hidden = !q.hint;
  dom.dlgHintBtn.textContent = 'Dica: ver em português';
  dom.dlgFeedback.className = 'feedback';
  dom.dlgFeedback.innerHTML = q.prog.wrong > 0 ? '<span class="fb-icon">!</span> Lembre-se: você tem <b>mais uma chance</b>.' : '';
  dom.dlgActions.innerHTML = '';

  dom.dlgAnswers.innerHTML = '';
  q.prog.order.forEach((opt, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'answer';
    b.dataset.index = i;
    b.innerHTML = `<span class="answer-letter">${'ABCD'[i]}</span><span class="answer-text">${opt}</span><span class="answer-mark" aria-hidden="true"></span>`;
    b.addEventListener('click', () => chooseAnswer(i));
    dom.dlgAnswers.appendChild(b);
  });
  renderChances(q.prog.wrong);
  dom.dialog.hidden = false;
  setTimeout(() => { const f = dom.dlgAnswers.querySelector('.answer'); if (f) f.focus(); }, 40);
}

function renderChances(wrong) {
  const left = 2 - wrong;
  dom.dlgChances.innerHTML = `Chances: ${[0, 1].map((i) => `<span class="heart ${i < left ? 'full' : 'empty'}" aria-hidden="true"></span>`).join('')} <span class="sr">${left} de 2</span>`;
  dom.dlgChances.classList.toggle('warning', left === 1);
}

/** Checks the answer. Points are given only once (solved flag + lock). */
function chooseAnswer(index) {
  if (!state.dialog || state.answerLocked) return;
  const { li, qi } = state.dialog;
  const q = getQuestion(li, qi);
  if (q.prog.solved) return;
  const btn = dom.dlgAnswers.querySelector(`[data-index="${index}"]`);
  if (!btn || btn.disabled) return;
  state.answerLocked = true;

  const chosen = q.prog.order[index];
  if (chosen === q.answer) {
    // ---------- CORRECT ----------
    q.prog.solved = true;
    addScore(POINTS.correct);
    btn.classList.add('correct');
    btn.querySelector('.answer-mark').textContent = '✔';
    dom.dlgAnswers.querySelectorAll('.answer').forEach((b) => { b.disabled = true; });
    dom.dlgFeedback.className = 'feedback good';
    const praise = ['Excelente!', 'Muito bem!', 'Parabéns!', 'Incrível!', 'Perfeito!'][Math.floor(Math.random() * 5)];
    dom.dlgFeedback.innerHTML = `<span class="fb-icon">✔</span> ${praise} "<b>${q.answer}</b>" está certo! <span class="points">+${POINTS.correct} pontos</span>`;
    dom.dlgHintBtn.hidden = true;
    Sound.play('correct');
    dom.dlgClose.hidden = true;
    afterCorrect(li);
  } else {
    // ---------- WRONG ----------
    q.prog.wrong += 1;
    state.progress[li].mistakes += 1;
    btn.classList.add('wrong');
    btn.disabled = true;
    btn.querySelector('.answer-mark').textContent = '✖';
    renderChances(q.prog.wrong);
    Sound.play('wrong');
    dom.dialog.querySelector('.dialog-box').classList.remove('shake');
    void dom.dialog.offsetWidth;
    dom.dialog.querySelector('.dialog-box').classList.add('shake');
    if (q.prog.wrong >= 2) {
      // Second mistake on the same question -> Game Over
      dom.dlgAnswers.querySelectorAll('.answer').forEach((b) => { b.disabled = true; });
      dom.dlgFeedback.className = 'feedback bad';
      dom.dlgFeedback.innerHTML = '<span class="fb-icon">✖</span> Ah, não! Esse foi o segundo erro nesta pergunta.';
      dom.dlgClose.hidden = true;
      later(() => gameOver(li, qi), 1300);
    } else {
      dom.dlgFeedback.className = 'feedback warn';
      dom.dlgFeedback.innerHTML = '<span class="fb-icon">!</span> Quase! Tente de novo! Você tem <b>mais uma chance</b>.';
      later(() => { state.answerLocked = false; }, 350);
    }
  }
}

function addScore(n) {
  state.score += n;
  updateHUD();
  bumpScore();
}

function afterCorrect(li) {
  const lv = LEVELS[li];
  updateMission();
  updateHUD();
  refreshEntities();

  if (lv.isBoss) {
    addAction('PEGAR O TESOURO!', true, () => { closeDialog(); defeatBoss(); });
    return;
  }
  if (isLevelComplete(li)) {
    completeLevel(li);   // unlock happens HERE, by the logic, right away
    dom.dlgFeedback.innerHTML += `<br><b>${lv.npc.done}</b>`;
    addAction('TERMINAR NÍVEL ★', true, () => { closeDialog(); });
  } else {
    addAction('PRÓXIMA PERGUNTA ▶', true, () => {
      const next = state.progress[li].questions.findIndex((q) => !q.solved);
      openQuestion(li, next);
    });
    addAction('Explorar', false, () => closeDialog());
  }
}

function addAction(label, primary, onClick) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = `btn ${primary ? 'btn-primary' : 'btn-light'}`;
  b.innerHTML = label;
  b.addEventListener('click', () => { Sound.play('click'); onClick(); }, { once: true });
  dom.dlgActions.appendChild(b);
  if (primary) setTimeout(() => b.focus(), 40);
}

function closeDialog() {
  if (state.mode !== 'dialog') return;
  dom.dialog.hidden = true;
  state.dialog = null;
  state.answerLocked = false;
  state.mode = 'explore';
  clearInput();
  // Show the "level completed" screen once, no matter how the dialog was closed
  const li = state.levelIndex;
  const prog = state.progress[li];
  if (prog.completed && !prog.completeShown && !LEVELS[li].isBoss) {
    prog.completeShown = true;
    showLevelComplete(li);
  }
}

dom.dlgClose.addEventListener('click', () => { Sound.play('click'); closeDialog(); });
dom.dlgHintBtn.addEventListener('click', () => {
  Sound.play('click');
  dom.dlgHint.hidden = !dom.dlgHint.hidden;
  dom.dlgHintBtn.textContent = dom.dlgHint.hidden ? 'Dica: ver em português' : 'Esconder dica';
});

/* =====================================================================
   15. PROGRESS, UNLOCKING AND LEVEL TRANSITIONS
   ===================================================================== */
function starsFor(li) {
  const m = state.progress[li].mistakes;
  return m === 0 ? 3 : m <= 2 ? 2 : 1;
}
const starsHTML = (n) => `<span class="stars" aria-label="${n} de 3 estrelas">${[1, 2, 3].map((i) => `<span class="star ${i <= n ? 'on' : ''}">★</span>`).join('')}</span>`;

/** Marks the level as completed (once), gives the bonus (once) and opens the passage. */
function completeLevel(li) {
  const prog = state.progress[li];
  if (!isLevelComplete(li) || prog.completed) return;
  prog.completed = true;
  if (!prog.bonusGiven) {
    prog.bonusGiven = true;
    addScore(POINTS.level);
  }
  refreshEntities();
  updateHUD();
  updateMission();
}

function showLevelComplete(li) {
  const lv = LEVELS[li];
  Sound.play('unlock');
  confetti();
  const gate = interactables.find((it) => it.kind === 'gate');
  if (gate) { gate.el.classList.remove('opening'); void gate.el.offsetWidth; gate.el.classList.add('opening'); }
  showMessage({
    cls: 'msg-level',
    art: `<div class="level-badge">${lv.number}</div>`,
    title: 'NÍVEL CONCLUÍDO!',
    body: `<p class="big-text">Muito bem! Você completou o mundo <b>${lv.namePt}</b>!</p>
      ${starsHTML(starsFor(li))}
      <p class="bonus">+${POINTS.level} pontos de bônus</p>
      <p class="unlock-text">Caminho liberado para <b>${nextLevelName(li)}</b>!<br>Vá até a passagem para continuar.</p>`,
    buttons: [{ label: 'VAMOS LÁ!', primary: true, onClick: closeMessage }]
  });
}

function goToNextLevel() {
  const li = state.levelIndex;
  // Double check with the logic (not the picture): the level must be complete.
  if (!isLevelComplete(li) || state.mode !== 'explore' || li >= LEVELS.length - 1) return;
  completeLevel(li);   // safety: makes sure the bonus/flags are set
  state.mode = 'transition';
  clearInput();
  dom.prompt.classList.remove('show');
  dom.arrow.classList.remove('show');
  Sound.play('unlock');
  dom.curtain.classList.add('show');
  later(() => {
    loadLevel(li + 1);
    const lv = L();
    later(() => {
      dom.curtain.classList.remove('show');
      showBanner(lv.isBoss ? 'CHEFÃO FINAL' : `NÍVEL ${lv.number}`, lv.isBoss ? 'O Templo do Tesouro' : lv.namePt.toUpperCase());
      state.mode = 'explore';
    }, 250);
  }, 600);
}

/* =====================================================================
   16. FINAL BOSS, VICTORY AND GAME OVER
   ===================================================================== */
function allWorldsDone() {
  return LEVELS.every((lv, i) => lv.isBoss || state.progress[i].completed);
}

function openBossIntro() {
  if (!allWorldsDone()) { toast('Complete os quatro mundos primeiro!'); return; }   // extra safety
  if (state.bossDefeated) return;
  Sound.play('boss');
  const li = state.levelIndex;
  const tried = state.progress[li].questions[0].wrong > 0;
  showMessage({
    cls: 'msg-boss',
    art: bossHTML(),
    title: 'DESAFIO FINAL!',
    body: `<p class="big-text">Eu sou o <b>Guardião do Tesouro</b>.<br>Mostre o que você aprendeu!</p>
           <p>Uma pergunta. ${tried ? '<b>Só resta uma chance!</b>' : 'Duas chances. Pense com calma!'}</p>`,
    buttons: [{ label: 'ESTOU PRONTO(A)!', primary: true, onClick: () => { dom.message.hidden = true; state.mode = 'explore'; openQuestion(li, 0); } }]
  });
}

function defeatBoss() {
  if (state.bossDefeated) return;
  state.bossDefeated = true;
  addScore(POINTS.boss);
  state.mode = 'cutscene';
  clearInput();
  dom.prompt.classList.remove('show');
  dom.arrow.classList.remove('show');
  const boss = interactables.find((it) => it.kind === 'boss');
  const chest = interactables.find((it) => it.kind === 'chest');
  if (boss) boss.el.classList.add('defeated');
  showBanner('VOCÊ CONSEGUIU!', 'O Guardião foi vencido!');
  Sound.play('win');
  later(() => {
    if (chest) { chest.el.innerHTML = chestSVG(true); chest.el.classList.add('open'); }
    confetti(120);
  }, 1100);
  later(showVictory, 3200);
}

function showVictory() {
  state.mode = 'victory';
  updateHUD();
  $('victory-score').textContent = state.score;
  $('victory-levels').innerHTML = LEVELS.map((lv, i) => {
    const ok = lv.isBoss ? state.bossDefeated : state.progress[i].completed;
    return `<li><span class="check">${ok ? '✔' : '✖'}</span> ${lv.isBoss ? 'Guardião vencido' : lv.namePt} ${lv.isBoss ? '' : starsHTML(starsFor(i))}</li>`;
  }).join('');
  showScreen('victory');
  confetti(140);
  setTimeout(() => $('btn-play-again').focus(), 100);
}

function gameOver(li, qi) {
  if (state.mode === 'gameover') return;
  const q = getQuestion(li, qi);
  state.mode = 'gameover';
  state.dialog = null;
  dom.dialog.hidden = true;
  dom.message.hidden = true;
  clearInput();
  Sound.play('over');
  $('gameover-score').textContent = state.score;
  $('gameover-review').innerHTML = `<p class="review-q">Pergunta: <b>${q.text}</b> <i>(${q.hint})</i></p><p class="review-a">A resposta certa era: <b>${q.answer}</b></p>`;
  showScreen('gameover');
  setTimeout(() => $('btn-restart').focus(), 100);
}

/* =====================================================================
   17. RESTART — everything goes back to the initial state
   ===================================================================== */
function resetGame() {
  clearTimers();
  state = createState();          // score 0, all levels locked, questions reset, boss reset
  clearInput();
  dom.dialog.hidden = true;
  dom.message.hidden = true;
  dom.curtain.classList.remove('show');
  dom.confetti.classList.remove('show');
  dom.confetti.innerHTML = '';
  dom.toast.classList.remove('show');
  dom.banner.classList.remove('show');
  dom.prompt.classList.remove('show');
  dom.arrow.classList.remove('show');
  dom.dlgAnswers.innerHTML = '';
  dom.dlgFeedback.innerHTML = '';
  dom.dlgActions.innerHTML = '';
}

function startAdventure() {
  Sound.unlock();
  resetGame();
  showScreen('game');
  loadLevel(0);              // player back at the start of the Island
  state.mode = 'explore';
  showBanner('NÍVEL 1', 'ILHA');
  later(() => toast(isTouch() ? 'Use as setas da tela para andar. Toque em <b>FALAR</b> perto dos personagens.' : 'Ande com <b>W A S D</b> ou as <b>setas</b>. Aperte <b>E</b> perto dos personagens.', 4200), 1200);
}

function goToTitle() {
  resetGame();
  state.mode = 'title';
  showScreen('title');
}

/* =====================================================================
   18. START-UP
   ===================================================================== */
function init() {
  state = createState();
  buildStaticArt();
  setupDpad();
  renderIntro();

  $('btn-play').addEventListener('click', () => {
    Sound.unlock(); Sound.play('click');
    renderHeroCards();
    state.mode = 'select';
    showScreen('select');
    setTimeout(() => $('btn-select-ok').focus(), 50);
  });
  $('btn-select-ok').addEventListener('click', () => {
    Sound.play('click');
    refreshHeroArt();
    introPage = 0; renderIntro();
    state.mode = 'intro';
    showScreen('intro');
    setTimeout(() => $('intro-next').focus(), 50);
  });
  $('intro-next').addEventListener('click', () => { Sound.play('click'); introPage = Math.min(introLines().length - 1, introPage + 1); renderIntro(); });
  $('intro-prev').addEventListener('click', () => { Sound.play('click'); introPage = Math.max(0, introPage - 1); renderIntro(); });
  $('btn-start').addEventListener('click', () => { Sound.play('click'); startAdventure(); });
  $('btn-restart').addEventListener('click', () => { Sound.play('click'); startAdventure(); });
  $('btn-play-again').addEventListener('click', () => { Sound.play('click'); startAdventure(); });
  $('btn-to-title').addEventListener('click', () => { Sound.play('click'); goToTitle(); });

  dom.btnSound.addEventListener('click', () => {
    Sound.enabled = !Sound.enabled;
    if (Sound.enabled) { Sound.unlock(); Sound.play('click'); }
    dom.btnSound.textContent = Sound.enabled ? 'Som: SIM' : 'Som: NÃO';
    dom.btnSound.setAttribute('aria-pressed', String(Sound.enabled));
    dom.btnSound.blur();
  });
  dom.btnHelp.addEventListener('click', () => {
    dom.btnHelp.blur();
    if (state.mode !== 'explore') return;
    showMessage({
      title: 'COMO JOGAR', cls: 'msg-help',
      body: `<ul class="help-list">
        <li><b>Andar:</b> W A S D ou as setas do teclado (celular: setas da tela).</li>
        <li><b>Conversar / interagir:</b> tecla E (celular: botão FALAR).</li>
        <li>Responda as <b>5 perguntas</b> de cada mundo para abrir a passagem.</li>
        <li>Você tem <b>2 chances</b> em cada pergunta. Errou duas vezes a mesma pergunta? Fim de jogo.</li>
        <li>Use o botão <b>Dica</b> para ver a pergunta em português.</li>
        <li>Objetos brilhantes ensinam palavras novas em inglês.</li>
        <li>Siga a seta amarela para achar o próximo objetivo!</li></ul>`,
      buttons: [{ label: 'Entendi!', primary: true, onClick: closeMessage }]
    });
  });
  dom.missionToggle.addEventListener('click', () => {
    const collapsed = dom.mission.classList.toggle('collapsed');
    dom.missionToggle.setAttribute('aria-expanded', String(!collapsed));
    dom.missionToggle.blur();
  });

  // Prevent page scroll / zoom gestures inside the game area
  dom.viewport.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
  window.addEventListener('resize', resizeViewport);
  window.addEventListener('orientationchange', () => setTimeout(resizeViewport, 200));

  resizeViewport();
  requestAnimationFrame(loop);
}

init();
