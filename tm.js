// ===== TM ENGINE + UI =====

const TM_MACHINES = {
  anbn: {
    name: '0^n1^n recognizer',
    description: "Accepts strings in 0^n1^n by marking pairs (0 -> X, 1 -> Y). Rejects if symbols are out of order or counts differ.",
    states: ['q0', 'q1', 'q2', 'q3', 'qA', 'qR'],
    startState: 'q0',
    acceptStates: ['qA'],
    rejectState: 'qR',
    blankSymbol: '_',
    sampleInput: '0011',
    transitions: [
      { state: 'q0', read: 'X', write: 'X', move: 'R', next: 'q0' },
      { state: 'q0', read: '0', write: 'X', move: 'R', next: 'q1' },
      { state: 'q0', read: 'Y', write: 'Y', move: 'R', next: 'q3' },
      { state: 'q0', read: '1', write: '1', move: 'R', next: 'qR' },
      { state: 'q0', read: '_', write: '_', move: 'R', next: 'qA' },

      { state: 'q1', read: '0', write: '0', move: 'R', next: 'q1' },
      { state: 'q1', read: 'X', write: 'X', move: 'R', next: 'q1' },
      { state: 'q1', read: 'Y', write: 'Y', move: 'R', next: 'q1' },
      { state: 'q1', read: '1', write: 'Y', move: 'L', next: 'q2' },
      { state: 'q1', read: '_', write: '_', move: 'R', next: 'qR' },

      { state: 'q2', read: '0', write: '0', move: 'L', next: 'q2' },
      { state: 'q2', read: '1', write: '1', move: 'L', next: 'q2' },
      { state: 'q2', read: 'X', write: 'X', move: 'L', next: 'q2' },
      { state: 'q2', read: 'Y', write: 'Y', move: 'L', next: 'q2' },
      { state: 'q2', read: '_', write: '_', move: 'R', next: 'q0' },

      { state: 'q3', read: 'Y', write: 'Y', move: 'R', next: 'q3' },
      { state: 'q3', read: '_', write: '_', move: 'R', next: 'qA' },
      { state: 'q3', read: '0', write: '0', move: 'R', next: 'qR' },
      { state: 'q3', read: '1', write: '1', move: 'R', next: 'qR' },
      { state: 'q3', read: 'X', write: 'X', move: 'R', next: 'qR' },
    ],
    type: 'tm',
  },

  increment: {
    name: 'Binary increment (+1)',
    description: 'Adds 1 to a binary string in-place by scanning to the right end, then propagating carry left.',
    states: ['q0', 'q1', 'qA', 'qR'],
    startState: 'q0',
    acceptStates: ['qA'],
    rejectState: 'qR',
    blankSymbol: '_',
    sampleInput: '1011',
    transitions: [
      { state: 'q0', read: '0', write: '0', move: 'R', next: 'q0' },
      { state: 'q0', read: '1', write: '1', move: 'R', next: 'q0' },
      { state: 'q0', read: '_', write: '_', move: 'L', next: 'q1' },

      { state: 'q1', read: '1', write: '0', move: 'L', next: 'q1' },
      { state: 'q1', read: '0', write: '1', move: 'R', next: 'qA' },
      { state: 'q1', read: '_', write: '1', move: 'R', next: 'qA' },
    ],
    type: 'tm',
  },

  palindrome: {
    name: 'Palindrome over {a,b}',
    description: "Accepts palindromes over {a,b} by marking matching outer symbols and moving inward.",
    states: ['q0', 'q1a', 'q1b', 'q2a', 'q2b', 'q3', 'qA', 'qR'],
    startState: 'q0',
    acceptStates: ['qA'],
    rejectState: 'qR',
    blankSymbol: '_',
    sampleInput: 'abba',
    transitions: [
      { state: 'q0', read: 'X', write: 'X', move: 'R', next: 'q0' },
      { state: 'q0', read: 'Y', write: 'Y', move: 'R', next: 'q0' },
      { state: 'q0', read: 'a', write: 'X', move: 'R', next: 'q1a' },
      { state: 'q0', read: 'b', write: 'Y', move: 'R', next: 'q1b' },
      { state: 'q0', read: '_', write: '_', move: 'R', next: 'qA' },

      { state: 'q1a', read: 'a', write: 'a', move: 'R', next: 'q1a' },
      { state: 'q1a', read: 'b', write: 'b', move: 'R', next: 'q1a' },
      { state: 'q1a', read: 'X', write: 'X', move: 'R', next: 'q1a' },
      { state: 'q1a', read: 'Y', write: 'Y', move: 'R', next: 'q1a' },
      { state: 'q1a', read: '_', write: '_', move: 'L', next: 'q2a' },

      { state: 'q2a', read: 'X', write: 'X', move: 'L', next: 'q2a' },
      { state: 'q2a', read: 'Y', write: 'Y', move: 'L', next: 'q2a' },
      { state: 'q2a', read: 'a', write: 'X', move: 'L', next: 'q3' },
      { state: 'q2a', read: 'b', write: 'b', move: 'R', next: 'qR' },
      { state: 'q2a', read: '_', write: '_', move: 'R', next: 'qA' },

      { state: 'q1b', read: 'a', write: 'a', move: 'R', next: 'q1b' },
      { state: 'q1b', read: 'b', write: 'b', move: 'R', next: 'q1b' },
      { state: 'q1b', read: 'X', write: 'X', move: 'R', next: 'q1b' },
      { state: 'q1b', read: 'Y', write: 'Y', move: 'R', next: 'q1b' },
      { state: 'q1b', read: '_', write: '_', move: 'L', next: 'q2b' },

      { state: 'q2b', read: 'X', write: 'X', move: 'L', next: 'q2b' },
      { state: 'q2b', read: 'Y', write: 'Y', move: 'L', next: 'q2b' },
      { state: 'q2b', read: 'b', write: 'Y', move: 'L', next: 'q3' },
      { state: 'q2b', read: 'a', write: 'a', move: 'R', next: 'qR' },
      { state: 'q2b', read: '_', write: '_', move: 'R', next: 'qA' },

      { state: 'q3', read: 'a', write: 'a', move: 'L', next: 'q3' },
      { state: 'q3', read: 'b', write: 'b', move: 'L', next: 'q3' },
      { state: 'q3', read: 'X', write: 'X', move: 'L', next: 'q3' },
      { state: 'q3', read: 'Y', write: 'Y', move: 'L', next: 'q3' },
      { state: 'q3', read: '_', write: '_', move: 'R', next: 'q0' },
    ],
    type: 'tm',
  },
};

class TMSimulator {
  constructor() {
    this.machines = { ...TM_MACHINES };
    this.current = null;
    this.input = '';
    this.state = null;
    this.head = 0;
    this.stepCount = 0;
    this.tape = new Map();
    this.writtenCells = new Set();
    this.running = false;
    this.timer = null;
    this.log = [];
    this.speed = 650;
    this.halted = false;
    this.finished = false;
    this.lastRule = null;
    this.init();
  }

  init() {
    this.buildMachineSelect();
    this.bindEvents();
    this.loadMachine('anbn');
    this.setInput('0011');
  }

  blank() {
    return (this.current && this.current.blankSymbol) || '_';
  }

  buildMachineSelect() {
    const sel = document.getElementById('tm-machine-select');
    if (!sel) return;
    sel.innerHTML = '';

    const bi = document.createElement('optgroup');
    bi.label = 'Built-in machines';
    Object.keys(TM_MACHINES).forEach((k) => {
      const o = document.createElement('option');
      o.value = k;
      o.textContent = TM_MACHINES[k].name;
      bi.appendChild(o);
    });
    sel.appendChild(bi);

    const userKeys = Object.keys(this.machines).filter((k) => !TM_MACHINES[k]);
    if (userKeys.length) {
      const ug = document.createElement('optgroup');
      ug.label = '★ Your machines';
      userKeys.forEach((k) => {
        const o = document.createElement('option');
        o.value = k;
        o.textContent = '★ ' + this.machines[k].name;
        ug.appendChild(o);
      });
      sel.appendChild(ug);
    }
  }

  bindEvents() {
    document.getElementById('tm-machine-select').addEventListener('change', (e) => this.loadMachine(e.target.value));
    document.getElementById('tm-input').addEventListener('input', (e) => this.setInput(e.target.value));
    document.getElementById('tm-step').addEventListener('click', () => this.step());
    document.getElementById('tm-run').addEventListener('click', () => this.run());
    document.getElementById('tm-reset').addEventListener('click', () => this.reset());
    document.getElementById('tm-speed').addEventListener('input', (e) => {
      this.speed = 1100 - e.target.value;
    });
    TMDesigner.init(this);
  }

  loadMachine(key) {
    this.stop();
    this.current = this.machines[key];
    if (!this.current) return;
    document.getElementById('tm-machine-select').value = key;
    document.getElementById('tm-desc').textContent = this.current.description;

    const inputField = document.getElementById('tm-input');
    const seed = inputField.value || this.current.sampleInput || '';
    this.setInput(seed);
  }

  setInput(str) {
    this.input = str;
    document.getElementById('tm-input').value = str;
    this.reset();
  }

  readTape(pos) {
    const at = typeof pos === 'number' ? pos : this.head;
    return this.tape.has(at) ? this.tape.get(at) : this.blank();
  }

  writeTape(pos, symbol) {
    if (symbol === this.blank()) this.tape.delete(pos);
    else this.tape.set(pos, symbol);
  }

  isAcceptState(state) {
    return !!(this.current && this.current.acceptStates.includes(state));
  }

  isRejectState(state) {
    return !!(this.current && this.current.rejectState && this.current.rejectState === state);
  }

  reset() {
    this.stop();
    this.state = this.current ? this.current.startState : null;
    this.head = 0;
    this.stepCount = 0;
    this.tape = new Map();
    this.writtenCells = new Set();
    this.log = [];
    this.halted = false;
    this.finished = false;
    this.lastRule = null;

    if (this.current) {
      for (let i = 0; i < this.input.length; i++) this.writeTape(i, this.input[i]);
    }

    this.renderAll();
    this.showResult('');
  }

  step() {
    if (!this.current || this.finished) return;

    if (this.halted || this.isAcceptState(this.state) || this.isRejectState(this.state)) {
      this.halted = true;
      this.finish();
      return;
    }

    const read = this.readTape();
    const rule = this.current.transitions.find((t) => t.state === this.state && t.read === read);

    if (!rule) {
      this.log.push({ text: `No transition for (${this.state}, ${read})`, cls: 'reject' });
      if (this.current.rejectState) this.state = this.current.rejectState;
      this.halted = true;
      this.renderAll();
      this.finish();
      return;
    }

    const prevState = this.state;
    const prevHead = this.head;
    const before = this.readTape();

    this.writeTape(this.head, rule.write);
    if (before !== rule.write) this.writtenCells.add(this.head);

    this.state = rule.next;
    this.head += rule.move === 'L' ? -1 : 1;
    this.stepCount += 1;
    this.lastRule = rule;

    this.log.push({
      text: `Step ${this.stepCount}: (${prevState}, ${before}) -> (${rule.next}, ${rule.write}, ${rule.move}) @${prevHead}`,
      cls: 'step',
      rule,
    });

    this.renderAll(rule);

    if (this.isAcceptState(this.state) || this.isRejectState(this.state)) {
      this.halted = true;
      this.finish();
    }
  }

  finish() {
    if (this.finished || !this.current) return;
    this.finished = true;
    this.halted = true;
    this.stop();

    const accepted = this.isAcceptState(this.state);
    const verdict = accepted ? 'ACCEPTED' : 'REJECTED';
    this.log.push({
      text: `Halted in ${this.state} after ${this.stepCount} step(s) -> ${verdict}`,
      cls: accepted ? 'accept' : 'reject',
    });
    this.renderLog();
    this.showResult(accepted ? 'accept' : 'reject', `"${this.input}" ${verdict} — state: ${this.state}, head: ${this.head}`);
  }

  run() {
    if (this.running) {
      this.stop();
      return;
    }

    if (this.finished) this.reset();

    this.running = true;
    document.getElementById('tm-run').textContent = '⏹ Stop';
    this.showResult('running', 'Running...');

    this.timer = setInterval(() => {
      if (this.halted || this.finished) {
        this.stop();
        this.finish();
        return;
      }
      this.step();
    }, this.speed);
  }

  stop() {
    clearInterval(this.timer);
    this.running = false;
    const btn = document.getElementById('tm-run');
    if (btn) btn.textContent = '▶▶ Run';
    if (!this.halted && !this.finished) this.showResult('');
  }

  renderAll(activeRule) {
    this.renderTape();
    this.renderTable(activeRule);
    this.renderLog();
    this.renderDiagram(activeRule);
    this.renderStats();
  }

  renderTape() {
    const wrap = document.getElementById('tm-tape');
    if (!wrap) return;

    const left = this.head - 12;
    const right = this.head + 12;

    let html = '';
    for (let i = left; i <= right; i++) {
      const sym = this.readTape(i);
      let cls = 'tape-cell';
      if (i === this.head) cls += ' current';
      else if (this.writtenCells.has(i)) cls += ' written';
      html += `<div class="${cls}" title="cell ${i}">${sym}${i === this.head ? '<div class="tape-head">▼</div>' : ''}</div>`;
    }

    wrap.innerHTML = html;
  }

  renderTable(activeRule) {
    const tbody = document.getElementById('tm-trans-body');
    if (!tbody || !this.current) return;

    let html = '';
    this.current.transitions.forEach((t) => {
      const isActive =
        activeRule &&
        activeRule.state === t.state &&
        activeRule.read === t.read &&
        activeRule.write === t.write &&
        activeRule.move === t.move &&
        activeRule.next === t.next;
      html += `<tr class="${isActive ? 'active-rule' : ''}">
        <td>${t.state}</td>
        <td><code>${t.read}</code></td>
        <td><code>${t.write}</code></td>
        <td>${t.move}</td>
        <td>${t.next}</td>
      </tr>`;
    });

    tbody.innerHTML = html;
    const activeRow = tbody.querySelector('.active-rule');
    if (activeRow) activeRow.scrollIntoView({ block: 'nearest' });
  }

  renderLog() {
    const logWrap = document.getElementById('tm-log');
    if (!logWrap) return;
    logWrap.innerHTML = this.log.map((e) => `<div class="log-entry ${e.cls}">${e.text}</div>`).join('');
    logWrap.scrollTop = logWrap.scrollHeight;
  }

  renderDiagram(activeRule) {
    if (!this.current) return;
    DIAGRAM.render('tm-diagram', this.current, this.state, activeRule || this.lastRule);
  }

  renderStats() {
    document.getElementById('tm-stat-state').textContent = this.state || '—';
    document.getElementById('tm-stat-pos').textContent = String(this.head);
    document.getElementById('tm-stat-steps').textContent = String(this.stepCount);
    document.getElementById('tm-stat-head').textContent = this.readTape();
  }

  showResult(type, msg) {
    const b = document.getElementById('tm-result');
    if (!b) return;
    b.className = 'result-banner';
    if (!type) {
      b.classList.remove('show');
      return;
    }
    b.classList.add('show', type);
    b.textContent = msg || '';
  }
}

// ===== TM DESIGNER =====
const TMDesigner = {
  sim: null,
  rows: [],

  init(sim) {
    this.sim = sim;
    this.rows = [];
    this.renderRows();
    document.getElementById('tm-designer-add').addEventListener('click', () => this.addRow());
    document.getElementById('tm-designer-prefill').addEventListener('click', () => this.prefillFromSelected());
    document.getElementById('tm-designer-save').addEventListener('click', () => this.save());
    document.getElementById('tm-designer-delete').addEventListener('click', () => this.deleteMachine());
  },

  prefillFromSelected() {
    const key = document.getElementById('tm-machine-select').value;
    const m = this.sim.machines[key];
    if (!m) { this.msg('Select a machine first', 'err'); return; }

    document.getElementById('tm-d-name').value = `${m.name} copy`;
    document.getElementById('tm-d-states').value = (m.states || []).join(',');
    document.getElementById('tm-d-start').value = m.startState || '';
    document.getElementById('tm-d-accept').value = (m.acceptStates || []).join(',');
    document.getElementById('tm-d-reject').value = m.rejectState || '';
    document.getElementById('tm-d-input').value = document.getElementById('tm-input').value || '';

    this.rows = (m.transitions || []).map((t, i) => ({
      id: Date.now() + i + Math.random(),
      state: t.state || '',
      read: t.read || '',
      write: t.write || '',
      move: (t.move || 'R').toUpperCase(),
      next: t.next || '',
    }));
    this.renderRows();
    this.msg('Prefilled from selected machine', 'ok');
  },

  addRow(data) {
    const id = Date.now() + Math.random();
    this.rows.push({ id, state: '', read: '', write: '', move: 'R', next: '', ...(data || {}) });
    this.renderRows();
  },

  removeRow(id) {
    this.rows = this.rows.filter((r) => r.id !== id);
    this.renderRows();
  },

  renderRows() {
    const cont = document.getElementById('tm-trans-rows');
    if (!cont) return;

    cont.innerHTML = this.rows
      .map(
        (r) => `
      <div class="trans-row" style="grid-template-columns:1fr 70px 70px 70px 1fr 30px" data-id="${r.id}">
        <input placeholder="State" value="${r.state || ''}" class="tr-state"/>
        <input placeholder="Read" value="${r.read || ''}" class="tr-read" maxlength="4"/>
        <input placeholder="Write" value="${r.write || ''}" class="tr-write" maxlength="4"/>
        <input placeholder="L/R" value="${r.move || 'R'}" class="tr-move" maxlength="1"/>
        <input placeholder="Next" value="${r.next || ''}" class="tr-next"/>
        <button class="remove-btn" onclick="TMDesigner.removeRow(${r.id})">✕</button>
      </div>`
      )
      .join('');

    cont.querySelectorAll('.trans-row').forEach((row) => {
      const id = parseFloat(row.dataset.id);
      row.querySelector('.tr-state').addEventListener('input', (e) => {
        const r = this.rows.find((x) => x.id === id);
        if (r) r.state = e.target.value;
      });
      row.querySelector('.tr-read').addEventListener('input', (e) => {
        const r = this.rows.find((x) => x.id === id);
        if (r) r.read = e.target.value;
      });
      row.querySelector('.tr-write').addEventListener('input', (e) => {
        const r = this.rows.find((x) => x.id === id);
        if (r) r.write = e.target.value;
      });
      row.querySelector('.tr-move').addEventListener('input', (e) => {
        const r = this.rows.find((x) => x.id === id);
        if (r) r.move = e.target.value.toUpperCase();
      });
      row.querySelector('.tr-next').addEventListener('input', (e) => {
        const r = this.rows.find((x) => x.id === id);
        if (r) r.next = e.target.value;
      });
    });
  },

  getFormValues() {
    return {
      name: document.getElementById('tm-d-name').value.trim(),
      states: document
        .getElementById('tm-d-states')
        .value.split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      startState: document.getElementById('tm-d-start').value.trim(),
      acceptStates: document
        .getElementById('tm-d-accept')
        .value.split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      rejectState: document.getElementById('tm-d-reject').value.trim(),
      testInput: document.getElementById('tm-d-input').value,
    };
  },

  validate(f) {
    if (!f.name) return 'Name is required';
    if (!f.states.length) return 'States are required';
    if (!f.startState) return 'Start state is required';
    if (!f.acceptStates.length) return 'At least one accept state is required';
    if (!f.rejectState) return 'Reject state is required';
    if (!f.states.includes(f.startState)) return `Start state "${f.startState}" is not in states`;
    if (!f.states.includes(f.rejectState)) return `Reject state "${f.rejectState}" is not in states`;
    for (const s of f.acceptStates) {
      if (!f.states.includes(s)) return `Accept state "${s}" is not in states`;
    }

    if (!this.rows.length) return 'Add at least one transition row';

    for (const r of this.rows) {
      if (!r.state || !r.read || !r.write || !r.move || !r.next) {
        return 'All transition fields are required';
      }
      if (!f.states.includes(r.state)) return `Transition state "${r.state}" is not in states`;
      if (!f.states.includes(r.next)) return `Transition next state "${r.next}" is not in states`;
      if (r.move.toUpperCase() !== 'L' && r.move.toUpperCase() !== 'R') {
        return `Invalid move "${r.move}". Use L or R`;
      }
    }

    return null;
  },

  save() {
    const f = this.getFormValues();
    const err = this.validate(f);
    if (err) {
      this.msg(err, 'err');
      return;
    }

    const transitions = this.rows.map((r) => ({
      state: r.state,
      read: r.read,
      write: r.write,
      move: r.move.toUpperCase(),
      next: r.next,
    }));

    const key = 'user-tm-' + f.name.toLowerCase().replace(/\s+/g, '-');
    const machine = {
      name: f.name,
      description: `Custom TM: ${f.name}`,
      states: f.states,
      startState: f.startState,
      acceptStates: f.acceptStates,
      rejectState: f.rejectState,
      blankSymbol: '_',
      sampleInput: f.testInput,
      transitions,
      type: 'tm',
    };

    this.sim.machines[key] = machine;
    this.sim.buildMachineSelect();
    this.sim.loadMachine(key);
    this.sim.setInput(f.testInput);
    this.msg('Machine saved and loaded!', 'ok');
  },

  deleteMachine() {
    const sel = document.getElementById('tm-machine-select');
    const key = sel.value;
    if (TM_MACHINES[key]) {
      this.msg("Can't delete built-in machines", 'err');
      return;
    }

    delete this.sim.machines[key];
    this.sim.buildMachineSelect();
    this.sim.loadMachine(Object.keys(TM_MACHINES)[0]);
    this.msg('Machine deleted', 'ok');
  },

  msg(text, type) {
    const el = document.getElementById('tm-designer-msg');
    if (!el) return;
    el.textContent = text;
    el.className = `designer-msg show ${type}`;
    setTimeout(() => el.classList.remove('show'), 3000);
  },
};

window.TMSimulator = TMSimulator;
window.TMDesigner = TMDesigner;
