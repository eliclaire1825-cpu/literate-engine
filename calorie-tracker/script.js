// ═══════════════════════════════════════════════════════════════
//  script.js — Nutr Calorie Tracker
//
//  Modules (all in one file for easy deployment, zero dependencies):
//    FOOD_DB      — static food nutrition database
//    QUICK_ITEMS  — chip buttons shown above the input
//    Storage      — localStorage read/write helpers
//    Parser       — natural language → structured food/water entry
//    Dashboard    — update the summary tiles at the top
//    Log          — render and manage the food log list
//    Chat         — handle conversation UI and bot responses
//    QuickChips   — render and wire up quick-add buttons
//    App.init()   — bootstrap everything on page load
// ═══════════════════════════════════════════════════════════════

'use strict';

// ── App-wide constants ──────────────────────────────────────────
const STORAGE_KEY  = 'nutr_logs';   // localStorage key
const GOAL_CAL     = 2000;          // daily calorie target (kcal)
const GOAL_PROTEIN = 150;           // daily protein target (g)
const GOAL_WATER   = 8;             // daily water target (glasses)


// ── Food Database ───────────────────────────────────────────────
// Structure: 'food name': { cal, p (protein g), c (carbs g), f (fat g) }
// Keys are lowercase; the parser matches against them case-insensitively.
// To add a new food: add another entry here — no other code needs to change.
const FOOD_DB = {
  'coffee':          { cal: 5,   p: 0,  c: 1,  f: 0  },
  'black coffee':    { cal: 5,   p: 0,  c: 1,  f: 0  },
  'espresso':        { cal: 10,  p: 0,  c: 2,  f: 0  },
  'latte':           { cal: 190, p: 7,  c: 15, f: 11 },
  'cappuccino':      { cal: 130, p: 6,  c: 10, f: 6  },
  'almonds':         { cal: 164, p: 6,  c: 6,  f: 14 },
  'protein shake':   { cal: 150, p: 25, c: 5,  f: 3  },
  'whey protein':    { cal: 120, p: 24, c: 3,  f: 2  },
  'banana':          { cal: 105, p: 1,  c: 27, f: 0  },
  'apple':           { cal: 95,  p: 0,  c: 25, f: 0  },
  'orange':          { cal: 62,  p: 1,  c: 15, f: 0  },
  'blueberries':     { cal: 84,  p: 1,  c: 21, f: 0  },
  'greek yogurt':    { cal: 100, p: 17, c: 6,  f: 0  },
  'oatmeal':         { cal: 150, p: 5,  c: 27, f: 3  },
  'oats':            { cal: 150, p: 5,  c: 27, f: 3  },
  'egg':             { cal: 70,  p: 6,  c: 1,  f: 5  },
  'eggs':            { cal: 140, p: 12, c: 1,  f: 10 },
  'boiled egg':      { cal: 70,  p: 6,  c: 1,  f: 5  },
  'scrambled eggs':  { cal: 200, p: 14, c: 2,  f: 15 },
  'chicken breast':  { cal: 165, p: 31, c: 0,  f: 4  },
  'chicken':         { cal: 165, p: 31, c: 0,  f: 4  },
  'salmon':          { cal: 208, p: 28, c: 0,  f: 10 },
  'tuna':            { cal: 109, p: 24, c: 0,  f: 1  },
  'beef':            { cal: 215, p: 26, c: 0,  f: 12 },
  'steak':           { cal: 271, p: 26, c: 0,  f: 18 },
  'rice':            { cal: 200, p: 4,  c: 44, f: 0  },
  'brown rice':      { cal: 215, p: 5,  c: 45, f: 2  },
  'pasta':           { cal: 220, p: 8,  c: 43, f: 1  },
  'bread':           { cal: 80,  p: 3,  c: 15, f: 1  },
  'toast':           { cal: 80,  p: 3,  c: 15, f: 1  },
  'avocado':         { cal: 240, p: 3,  c: 12, f: 22 },
  'peanut butter':   { cal: 190, p: 8,  c: 6,  f: 16 },
  'almond butter':   { cal: 200, p: 7,  c: 6,  f: 18 },
  'milk':            { cal: 149, p: 8,  c: 12, f: 8  },
  'cheese':          { cal: 110, p: 7,  c: 0,  f: 9  },
  'cottage cheese':  { cal: 98,  p: 11, c: 4,  f: 4  },
  'salad':           { cal: 20,  p: 2,  c: 3,  f: 0  },
  'burger':          { cal: 540, p: 35, c: 40, f: 25 },
  'pizza':           { cal: 285, p: 12, c: 36, f: 10 },
  'chips':           { cal: 150, p: 2,  c: 15, f: 10 },
  'chocolate':       { cal: 155, p: 2,  c: 17, f: 9  },
  'protein bar':     { cal: 200, p: 20, c: 22, f: 7  },
  'orange juice':    { cal: 110, p: 2,  c: 26, f: 0  },
  'smoothie':        { cal: 180, p: 3,  c: 40, f: 1  },
};


// ── Quick-add chip buttons ──────────────────────────────────────
// Shown as pill buttons above the input. Add/remove freely.
const QUICK_ITEMS = [
  { label: 'Coffee',        food: 'coffee'        },
  { label: 'Latte',         food: 'latte'         },
  { label: 'Almonds',       food: 'almonds'       },
  { label: 'Protein Shake', food: 'protein shake' },
  { label: 'Banana',        food: 'banana'        },
  { label: 'Greek Yogurt',  food: 'greek yogurt'  },
  { label: 'Eggs',          food: 'eggs'          },
  { label: 'Chicken',       food: 'chicken breast'},
];


// ── High-protein suggestions shown on "help" requests ──────────
const HIGH_PROTEIN_SUGGESTIONS = [
  '🍗 Grilled chicken breast — 165 cal, 31g protein',
  '🐟 Canned tuna — 109 cal, 24g protein',
  '🥚 2 scrambled eggs — 200 cal, 14g protein',
  '🫙 Greek yogurt + almonds — 264 cal, 23g protein',
  '🥛 Whey protein shake — 120 cal, 24g protein',
  '🧀 Cottage cheese — 98 cal, 11g protein',
];


// ═══════════════════════════════════════════════════════════════
//  Storage
//  All data lives in localStorage under STORAGE_KEY.
//  Shape: { "YYYY-MM-DD": [ ...entries ] }
// ═══════════════════════════════════════════════════════════════
const Storage = (() => {

  /** Returns today's date as "YYYY-MM-DD" (used as the storage key). */
  function todayKey() {
    return new Date().toISOString().slice(0, 10);
  }

  /** Load the full data object from localStorage. */
  function loadAll() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch {
      return {};
    }
  }

  /** Persist the full data object back to localStorage. */
  function saveAll(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  /** Return today's entry array. */
  function getToday() {
    return loadAll()[todayKey()] || [];
  }

  /** Append a single entry object to today's array. */
  function saveEntry(entry) {
    const all = loadAll();
    const key = todayKey();
    if (!all[key]) all[key] = [];
    all[key].push(entry);
    saveAll(all);
  }

  /** Remove a single entry by its unique id from today's array. */
  function removeEntry(id) {
    const all = loadAll();
    const key = todayKey();
    if (all[key]) {
      all[key] = all[key].filter(e => e.id !== id);
      saveAll(all);
    }
  }

  /** Wipe today's log entirely. */
  function clearToday() {
    const all = loadAll();
    delete all[todayKey()];
    saveAll(all);
  }

  return { getToday, saveEntry, removeEntry, clearToday };
})();


// ═══════════════════════════════════════════════════════════════
//  Parser
//  Converts a raw chat string into a typed result object.
//
//  Return shapes:
//    { type: 'food',    name, cal, p, c, f }
//    { type: 'water',   glasses }
//    { type: 'help' }
//    { type: 'unknown' }
// ═══════════════════════════════════════════════════════════════
const Parser = (() => {

  /**
   * Extract an explicit calorie number from text.
   * Accepts: "100 cal", "250 calories", "300kcal"
   */
  function extractCalories(text) {
    const m = text.match(/(\d+(?:\.\d+)?)\s*(?:cal(?:ories)?|kcal)/i);
    return m ? parseFloat(m[1]) : null;
  }

  /**
   * Extract water quantity, returning a number of glasses.
   * Accepts: "2 glasses", "1 cup", "500ml", "1.5L", or bare "water".
   */
  function extractWater(text) {
    // Glasses / cups
    let m = text.match(/(\d+(?:\.\d+)?)\s*(?:glass(?:es)?|cup(?:s)?)\s*(?:of\s+)?water/i);
    if (m) return parseFloat(m[1]);

    // Millilitres → glasses (250 ml = 1 glass)
    m = text.match(/(\d+(?:\.\d+)?)\s*ml\s*(?:of\s+)?water/i);
    if (m) return Math.round((parseFloat(m[1]) / 250) * 10) / 10;

    // Litres → glasses
    m = text.match(/(\d+(?:\.\d+)?)\s*l(?:itres?|iters?)?\s*(?:of\s+)?water/i);
    if (m) return Math.round((parseFloat(m[1]) * 4) * 10) / 10;

    // Bare mention of water (no quantity) → assume 1 glass
    if (/\bwater\b/i.test(text) && !/\d/.test(text)) return 1;

    return null;
  }

  /**
   * Scan text for a known food in FOOD_DB.
   * Checks longer keys first so "protein shake" beats "shake".
   */
  function matchFoodDB(text) {
    const lower = text.toLowerCase();
    const keys  = Object.keys(FOOD_DB).sort((a, b) => b.length - a.length);
    for (const key of keys) {
      if (lower.includes(key)) {
        return { name: key, ...FOOD_DB[key] };
      }
    }
    return null;
  }

  /**
   * Extract explicitly stated macros.
   * e.g. "30g protein", "50g carbs", "12g fat"
   */
  function extractMacros(text) {
    const p = text.match(/(\d+)\s*g\s*protein/i);
    const c = text.match(/(\d+)\s*g\s*(?:carbs?|carbohydrates?)/i);
    const f = text.match(/(\d+)\s*g\s*fat/i);
    return {
      protein: p ? parseInt(p[1], 10) : null,
      carbs:   c ? parseInt(c[1], 10) : null,
      fat:     f ? parseInt(f[1], 10) : null,
    };
  }

  /** True if the message looks like a help / suggestion request. */
  function isHelpRequest(text) {
    return /\b(help|suggest|recommend|what should|high.?protein|ideas?|option|lunch|dinner|breakfast|snack)\b/i.test(text);
  }

  /**
   * Strip common filler words to extract the food name from
   * an unrecognised message.
   */
  function guessFoodName(text) {
    return text
      .replace(/\b(just|had|ate|have|eaten|consumed|logged?|drank?|grabbed?|finished?|i|a|an|the|some|my)\b/gi, '')
      .replace(/\d+(?:\.\d+)?\s*(?:cal(?:ories)?|kcal|g|ml|oz|glasses?|cups?)/gi, '')
      .replace(/\s{2,}/g, ' ')
      .trim() || 'Food item';
  }

  /**
   * Very rough macro fallback when no DB entry exists.
   * Assumes a balanced-ish split just to show something.
   */
  function roughMacro(cal, type) {
    if (type === 'p') return Math.round(cal * 0.15 / 4);
    if (type === 'c') return Math.round(cal * 0.50 / 4);
    if (type === 'f') return Math.round(cal * 0.35 / 9);
    return 0;
  }

  /** Capitalise first letter of a string. */
  function cap(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /** Main entry point — returns a typed result object. */
  function parse(rawText) {
    const text = rawText.trim();

    // 1. Help / suggestion request
    if (isHelpRequest(text)) {
      return { type: 'help' };
    }

    // 2. Water entry
    const glasses = extractWater(text);
    if (glasses !== null) {
      return { type: 'water', glasses };
    }

    // 3. Food entry — need at least a calorie count OR a DB match
    const explicitCal = extractCalories(text);
    const dbMatch     = matchFoodDB(text);
    const macroHints  = extractMacros(text);

    if (explicitCal !== null || dbMatch) {
      const cal  = explicitCal ?? dbMatch.cal;
      const name = dbMatch ? cap(dbMatch.name) : cap(guessFoodName(text));
      return {
        type: 'food',
        name,
        cal: Math.round(cal),
        p:   macroHints.protein ?? dbMatch?.p ?? roughMacro(cal, 'p'),
        c:   macroHints.carbs   ?? dbMatch?.c ?? roughMacro(cal, 'c'),
        f:   macroHints.fat     ?? dbMatch?.f ?? roughMacro(cal, 'f'),
      };
    }

    // 4. Unrecognised
    return { type: 'unknown' };
  }

  return { parse };
})();


// ═══════════════════════════════════════════════════════════════
//  Dashboard
//  Reads today's log and refreshes all stat tiles.
// ═══════════════════════════════════════════════════════════════
const Dashboard = (() => {

  function render() {
    const entries = Storage.getToday();
    let cal = 0, p = 0, c = 0, f = 0, water = 0;

    for (const e of entries) {
      if (e.type === 'food') {
        cal   += e.cal || 0;
        p     += e.p   || 0;
        c     += e.c   || 0;
        f     += e.f   || 0;
      } else if (e.type === 'water') {
        water += e.glasses || 0;
      }
    }

    setText('dashCalories', cal);
    setText('dashProtein',  p + 'g');
    setText('dashCarbs',    c + 'g');
    setText('dashFat',      f + 'g');
    setText('dashWater',    water % 1 === 0 ? water : water.toFixed(1));

    // Colour the calorie card red if over goal
    document.getElementById('calCard')
      ?.classList.toggle('over-goal', cal > GOAL_CAL);
  }

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  return { render };
})();


// ═══════════════════════════════════════════════════════════════
//  Log
//  Manages the food-log list displayed below the chat.
// ═══════════════════════════════════════════════════════════════
const Log = (() => {

  /** Re-render the entire log list from storage. */
  function render() {
    const list    = document.getElementById('logList');
    const entries = Storage.getToday();

    if (!list) return;

    if (!entries.length) {
      list.innerHTML = '<div class="log-empty">Nothing logged yet — start chatting!</div>';
      return;
    }

    // Most-recent first
    list.innerHTML = entries.slice().reverse().map(entry => {
      if (entry.type === 'food') {
        return `
          <div class="log-item" data-id="${entry.id}">
            <div class="log-item-left">
              <span class="log-food-name">${escHtml(entry.name)}</span>
              <span class="log-time">${entry.time}</span>
            </div>
            <div class="log-item-right">
              <span class="log-cal">${entry.cal} cal</span>
              <span class="log-macros">${entry.p}p · ${entry.c}c · ${entry.f}f</span>
            </div>
            <button class="log-delete" data-id="${entry.id}" title="Remove">×</button>
          </div>`;
      }
      if (entry.type === 'water') {
        const n = entry.glasses % 1 === 0 ? entry.glasses : entry.glasses.toFixed(1);
        return `
          <div class="log-item" data-id="${entry.id}">
            <div class="log-item-left">
              <span class="log-food-name">💧 Water</span>
              <span class="log-time">${entry.time}</span>
            </div>
            <div class="log-item-right">
              <span class="log-cal">${n} glass${entry.glasses !== 1 ? 'es' : ''}</span>
            </div>
            <button class="log-delete" data-id="${entry.id}" title="Remove">×</button>
          </div>`;
      }
      return '';
    }).join('');

    // Wire up delete buttons via event delegation on the container
    list.querySelectorAll('.log-delete').forEach(btn => {
      btn.addEventListener('click', () => remove(btn.dataset.id));
    });
  }

  /** Create a new entry, save it, then refresh UI. */
  function add(entry) {
    entry.id   = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    entry.time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    Storage.saveEntry(entry);
    render();
    Dashboard.render();
  }

  /** Delete a single entry by id. */
  function remove(id) {
    Storage.removeEntry(id);
    render();
    Dashboard.render();
  }

  /** Confirm then wipe today's log. */
  function clearDay() {
    if (!confirm('Clear all entries for today?')) return;
    Storage.clearToday();
    render();
    Dashboard.render();
    Chat.addMessage("Today's log cleared. Fresh start!", 'bot');
  }

  return { render, add, remove, clearDay };
})();


// ═══════════════════════════════════════════════════════════════
//  Chat
//  Handles the chat UI: rendering bubbles, parsing input,
//  dispatching actions, and generating bot replies.
// ═══════════════════════════════════════════════════════════════
const Chat = (() => {

  const WELCOME = `Hey! I'm Nutr, your calorie tracker. Try saying:
• "just had a latte"
• "100 cal protein bar"
• "drank 2 glasses of water"
• "help me build a high protein lunch"

Or tap a quick-add button below.`;

  /** Append a chat bubble. role = 'user' | 'bot' */
  function addMessage(text, role = 'bot') {
    const container = document.getElementById('chatMessages');
    if (!container) return;

    const bubble = document.createElement('div');
    bubble.className = `chat-msg ${role}`;

    // Render newlines as line breaks
    bubble.innerHTML = text
      .split('\n')
      .map(line => `<span>${escHtml(line)}</span>`)
      .join('<br>');

    container.appendChild(bubble);
    container.scrollTop = container.scrollHeight;
  }

  /** Read the input, echo as user bubble, process, clear. */
  function send() {
    const input = document.getElementById('chatInput');
    const text  = input.value.trim();
    if (!text) return;

    addMessage(text, 'user');
    input.value = '';
    handleInput(text);
  }

  /** Route a parsed result to the appropriate action + bot reply. */
  function handleInput(text) {
    const result = Parser.parse(text);

    switch (result.type) {

      case 'food': {
        Log.add({
          type: 'food',
          name: result.name,
          cal:  result.cal,
          p:    result.p,
          c:    result.c,
          f:    result.f,
        });
        addMessage(
          `✓ Logged ${result.name}: ${result.cal} cal\n` +
          `  ${result.p}g protein · ${result.c}g carbs · ${result.f}g fat`,
          'bot'
        );
        break;
      }

      case 'water': {
        const n = result.glasses % 1 === 0 ? result.glasses : result.glasses.toFixed(1);
        Log.add({ type: 'water', glasses: result.glasses });
        addMessage(
          `💧 Logged ${n} glass${result.glasses !== 1 ? 'es' : ''} of water. Keep it up!`,
          'bot'
        );
        break;
      }

      case 'help': {
        addMessage(
          `Here are some great high-protein options:\n` +
          HIGH_PROTEIN_SUGGESTIONS.join('\n') +
          `\n\nJust tell me what you ate and I'll log it!`,
          'bot'
        );
        break;
      }

      case 'unknown':
      default: {
        addMessage(
          `I didn't quite catch that. Try:\n` +
          `• "just had a banana"\n` +
          `• "200 cal bowl of rice"\n` +
          `• "2 glasses of water"\n` +
          `Or tap a quick-add chip!`,
          'bot'
        );
      }
    }
  }

  /** Set up event listeners and show the welcome message. */
  function init() {
    addMessage(WELCOME, 'bot');

    // Send on Enter key
    document.getElementById('chatInput')
      ?.addEventListener('keydown', e => { if (e.key === 'Enter') send(); });

    // Send button click
    document.getElementById('sendBtn')
      ?.addEventListener('click', send);

    // Clear day button
    document.getElementById('clearLogBtn')
      ?.addEventListener('click', () => Log.clearDay());
  }

  return { send, addMessage, handleInput, init };
})();


// ═══════════════════════════════════════════════════════════════
//  QuickChips
//  Renders the pill buttons and handles one-tap food logging.
// ═══════════════════════════════════════════════════════════════
const QuickChips = (() => {

  /** Render pill buttons from QUICK_ITEMS. */
  function render() {
    const container = document.getElementById('quickChips');
    if (!container) return;

    container.innerHTML = QUICK_ITEMS.map(item => {
      const db  = FOOD_DB[item.food];
      const tip = db ? `${db.cal} cal` : '';
      return `<button class="chip" data-food="${escHtml(item.food)}" title="${tip}">${escHtml(item.label)}</button>`;
    }).join('');

    // Single delegated listener
    container.addEventListener('click', e => {
      const chip = e.target.closest('.chip');
      if (chip) logFood(chip.dataset.food);
    });
  }

  /** Log a DB food directly, bypassing the text parser. */
  function logFood(foodKey) {
    const db = FOOD_DB[foodKey];
    if (!db) return;
    const name = foodKey.charAt(0).toUpperCase() + foodKey.slice(1);
    Log.add({ type: 'food', name, cal: db.cal, p: db.p, c: db.c, f: db.f });
    Chat.addMessage(`✓ Logged ${name}: ${db.cal} cal`, 'bot');
  }

  return { render };
})();


// ═══════════════════════════════════════════════════════════════
//  Utility
// ═══════════════════════════════════════════════════════════════

/** Escape HTML special characters to prevent XSS. */
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}


// ═══════════════════════════════════════════════════════════════
//  App — bootstrap on DOMContentLoaded
// ═══════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {

  // Show today's date in the header
  const dateEl = document.getElementById('headerDate');
  if (dateEl) {
    dateEl.textContent = new Date().toLocaleDateString(undefined, {
      weekday: 'long', month: 'long', day: 'numeric',
    });
  }

  Dashboard.render();
  Log.render();
  QuickChips.render();
  Chat.init();
});
