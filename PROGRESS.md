# Automata Simulator — Build Progress

## What This Project Is
A fully interactive, browser-based simulator for 5 types of automata:
**DFA → NFA → ε-NFA → PDA → Turing Machine**

Each machine gets its own tab with:
- Live state diagram (SVG)
- Animated tape / stack
- Step-by-step execution log
- Transition table with active rule highlighted
- Stat cards
- Built-in machine selector
- Custom machine designer

---

## Files Already Created ✅

| File | Status | What it does |
|------|--------|--------------|
| `styles.css` | ✅ Done | All styling — dark theme, cards, tape, stack, buttons, table, designer |
| `diagram.js` | ✅ Done | SVG state diagram renderer (shared by all 5 tabs) |
| `dfa.js` | ✅ Done | DFA engine + UI + designer (3 built-in machines) |
| `nfa.js` | ✅ Done | NFA engine + UI + designer (2 built-in machines) |
| `enfa.js` | ✅ Done | ε-NFA engine + UI + designer (2 built-in machines) |
| `pda.js` | ✅ Done | PDA engine + UI + designer (3 built-in machines) |

---

## Files Still Needed ❌

### 1. `tm.js` — Turing Machine engine + UI + designer
**What to build:**
- Infinite tape (two-way array, initialized with input + blanks `_`)
- Read/write head position
- Step, Run, Stop controls with speed slider
- 3 built-in machines:
  - `0^n 1^n` recognizer
  - Binary increment (adds 1 to a binary number)
  - Palindrome recognizer over {a, b}
- Transition format: `{ state, read, write, move: 'L'|'R', next }`
- Accept/Reject states halt the machine
- Designer with columns: State | Read | Write | Move | Next state
- IDs used in HTML: `tm-machine-select`, `tm-input`, `tm-tape`, `tm-step`, `tm-run`, `tm-reset`, `tm-speed`, `tm-trans-body`, `tm-log`, `tm-diagram`, `tm-result`, `tm-stat-state`, `tm-stat-pos`, `tm-stat-steps`, `tm-stat-head`, `tm-desc`
- Designer IDs: `tm-trans-rows`, `tm-designer-add`, `tm-designer-save`, `tm-designer-delete`, `tm-designer-msg`, `tm-d-name`, `tm-d-states`, `tm-d-start`, `tm-d-accept`, `tm-d-reject`, `tm-d-input`

---

### 2. `index.html` — Main shell
**What to build:**
- Link `styles.css`
- Script tags (in order): `diagram.js`, `dfa.js`, `nfa.js`, `enfa.js`, `pda.js`, `tm.js`
- Header with logo + title "Automata Simulator"
- Tab nav bar with 5 buttons: DFA (Unit 1), NFA (Unit 1), ε-NFA (Unit 1), PDA (Unit 4), TM (Unit 5)
- One `<div class="tab-panel">` per tab, each containing:

#### Per-tab HTML structure (repeat for each of the 5 tabs, using the tab prefix e.g. `dfa-`, `nfa-`, etc.):

```html
<!-- Stats row -->
<div class="stats-row">
  4 stat cards with IDs like: {prefix}-stat-states, etc.
</div>

<!-- Description -->
<div class="desc-card" id="{prefix}-desc"></div>

<!-- Result banner -->
<div class="result-banner" id="{prefix}-result"></div>

<!-- Controls row -->
<div class="input-row">
  <select id="{prefix}-machine-select">
  <input id="{prefix}-input" placeholder="Test input">
</div>

<!-- Buttons + speed -->
<div class="btn-row">
  Step ▶ | Run ▶▶ | Reset ↺ | speed slider
</div>

<!-- Tape (not needed for TM — TM has its own wider tape) -->
<div class="tape-display" id="{prefix}-tape"></div>

<!-- Main 2-col grid -->
<div class="sim-grid">
  <!-- Left: Diagram -->
  <div class="card">
    <div class="diagram-wrap" id="{prefix}-diagram"></div>
  </div>
  <!-- Right: Transition table -->
  <div class="card">
    <div class="trans-table-wrap">
      <table>
        <thead>... columns vary per machine type ...</thead>
        <tbody id="{prefix}-trans-body"></tbody>
      </table>
    </div>
  </div>
</div>

<!-- Log -->
<div class="card">
  <div class="log-wrap" id="{prefix}-log"></div>
</div>

<!-- Designer section -->
<div class="designer-section"> ... </div>
```

#### PDA tab extras (inside sim-grid):
- Add a 3rd column (or sidebar) for the stack: `<div id="pda-stack" class="stack-wrap"></div>`

#### TM tab extras:
- Wider tape display with visible head arrow below current cell
- No stack

#### Table column headers by type:
- DFA: State | Symbol | Next | Active
- NFA: State | Symbol | Next States
- ε-NFA: State | Symbol | Next States
- PDA: State | Input | Pop | Push | Next
- TM: State | Read | Write | Move | Next

#### Designer form fields by type:
- All: Name, States, Start state, Accept states, Test input, transition rows, Save & load / Delete buttons
- PDA adds: Start stack symbol field
- TM adds: Reject state field

---

## Build Order

1. ✅ `styles.css`
2. ✅ `diagram.js`
3. ✅ `dfa.js`
4. ✅ `nfa.js`
5. ✅ `enfa.js`
6. ✅ `pda.js`
7. ❌ `tm.js` ← **next to build**
8. ❌ `index.html` ← **build last** (depends on all JS files)

---

## How to Run (once complete)
Just open `index.html` in any modern browser — no server needed, no dependencies, pure HTML/CSS/JS.

---

## Built-in Machine Summary

| Tab | Key | Machine Name |
|-----|-----|-------------|
| DFA | `even-a` | Even number of a's |
| DFA | `ends-ab` | Strings ending with 'ab' |
| DFA | `div3` | Binary divisible by 3 |
| NFA | `contains-ab` | Contains substring 'ab' |
| NFA | `len-div2-or-3` | Length divisible by 2 or 3 |
| ε-NFA | `012star` | 0*1*2* |
| ε-NFA | `ab-or-ba` | (ab)*\|(ba)* |
| PDA | `anbn` | aⁿbⁿ |
| PDA | `palindrome` | Palindromes over {a,b} |
| PDA | `balanced` | Balanced parentheses |
| TM | `anbn` | aⁿbⁿ recognizer |
| TM | `increment` | Binary increment |
| TM | `palindrome` | Palindrome over {a,b} |
