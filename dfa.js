// ===== DFA ENGINE + UI =====

const DFA_MACHINES = {
  'even-a': {
    name: "Even number of a's",
    description: "Accepts strings over {a,b} with an even number of 'a' characters. Start in q0 (even count), toggle to q1 on each 'a'.",
    states: ['q0','q1'],
    startState: 'q0',
    acceptStates: ['q0'],
    alphabet: ['a','b'],
    transitions: [
      { state:'q0', symbol:'a', next:'q1' },
      { state:'q0', symbol:'b', next:'q0' },
      { state:'q1', symbol:'a', next:'q0' },
      { state:'q1', symbol:'b', next:'q1' },
    ],
    type: 'dfa',
  },
  'ends-ab': {
    name: "Strings ending with 'ab'",
    description: "Accepts strings over {a,b} that end with the substring 'ab'. Uses a 3-state DFA tracking the longest suffix of 'ab' seen so far.",
    states: ['q0','q1','q2'],
    startState: 'q0',
    acceptStates: ['q2'],
    alphabet: ['a','b'],
    transitions: [
      { state:'q0', symbol:'a', next:'q1' },
      { state:'q0', symbol:'b', next:'q0' },
      { state:'q1', symbol:'a', next:'q1' },
      { state:'q1', symbol:'b', next:'q2' },
      { state:'q2', symbol:'a', next:'q1' },
      { state:'q2', symbol:'b', next:'q0' },
    ],
    type: 'dfa',
  },
  'div3': {
    name: "Binary divisible by 3",
    description: "Accepts binary strings whose numeric value is divisible by 3. Each state represents the remainder (0, 1, or 2) mod 3.",
    states: ['q0','q1','q2'],
    startState: 'q0',
    acceptStates: ['q0'],
    alphabet: ['0','1'],
    transitions: [
      { state:'q0', symbol:'0', next:'q0' },
      { state:'q0', symbol:'1', next:'q1' },
      { state:'q1', symbol:'0', next:'q2' },
      { state:'q1', symbol:'1', next:'q0' },
      { state:'q2', symbol:'0', next:'q1' },
      { state:'q2', symbol:'1', next:'q2' },
    ],
    type: 'dfa',
  },
};

class DFASimulator {
  constructor() {
    this.machines = { ...DFA_MACHINES };
    this.current = null;
    this.input = '';
    this.pos = 0;
    this.state = null;
    this.running = false;
    this.timer = null;
    this.log = [];
    this.speed = 600;
    this.init();
  }

  init() {
    this.buildMachineSelect();
    this.bindEvents();
    this.loadMachine('even-a');
    this.setInput('aabb');
  }

  buildMachineSelect() {
    const sel = document.getElementById('dfa-machine-select');
    sel.innerHTML = '';
    const builtIn = document.createElement('optgroup');
    builtIn.label = 'Built-in machines';
    Object.keys(DFA_MACHINES).forEach(k => {
      const o = document.createElement('option');
      o.value = k; o.textContent = DFA_MACHINES[k].name;
      builtIn.appendChild(o);
    });
    sel.appendChild(builtIn);
    // User machines
    const userKeys = Object.keys(this.machines).filter(k => !DFA_MACHINES[k]);
    if (userKeys.length) {
      const ug = document.createElement('optgroup');
      ug.label = '★ Your machines';
      userKeys.forEach(k => {
        const o = document.createElement('option');
        o.value = k; o.textContent = '★ ' + this.machines[k].name;
        ug.appendChild(o);
      });
      sel.appendChild(ug);
    }
  }

  bindEvents() {
    document.getElementById('dfa-machine-select').addEventListener('change', e => this.loadMachine(e.target.value));
    document.getElementById('dfa-input').addEventListener('input', e => { this.setInput(e.target.value); });
    document.getElementById('dfa-step').addEventListener('click', () => this.step());
    document.getElementById('dfa-run').addEventListener('click', () => this.run());
    document.getElementById('dfa-reset').addEventListener('click', () => this.reset());
    document.getElementById('dfa-speed').addEventListener('input', e => { this.speed = 1100 - e.target.value; });
    DFADesigner.init(this);
  }

  loadMachine(key) {
    this.stop();
    this.current = this.machines[key];
    document.getElementById('dfa-machine-select').value = key;
    document.getElementById('dfa-desc').textContent = this.current.description;
    this.setInput(document.getElementById('dfa-input').value || '');
    this.reset();
  }

  setInput(str) {
    this.input = str;
    document.getElementById('dfa-input').value = str;
    this.reset();
  }

  reset() {
    this.stop();
    this.pos = 0;
    this.state = this.current ? this.current.startState : null;
    this.log = [];
    this.renderAll();
    this.showResult('');
  }

  step() {
    if (!this.current) return;
    if (this.pos >= this.input.length) {
      this.finish();
      return;
    }
    const sym = this.input[this.pos];
    const rule = this.current.transitions.find(t => t.state === this.state && t.symbol === sym);
    if (!rule) {
      this.log.push({ text: `Step ${this.pos+1}: (${this.state}, '${sym}') → ∅ — DEAD`, cls: 'reject' });
      this.state = null;
      this.pos++;
      this.renderAll();
      this.finish();
      return;
    }
    this.log.push({ text: `Step ${this.pos+1}: δ(${this.state}, '${sym}') = ${rule.next}`, cls: 'step', rule });
    this.state = rule.next;
    this.pos++;
    this.renderAll(rule);
    if (this.pos >= this.input.length) setTimeout(() => this.finish(), 100);
  }

  finish() {
    this.stop();
    if (!this.current) return;
    const accepted = this.state && this.current.acceptStates.includes(this.state);
    const verdict = accepted ? 'ACCEPTED' : 'REJECTED';
    let hint = '';
    if (this.current === DFA_MACHINES['even-a']) {
      const aCount = [...this.input].filter(ch => ch === 'a').length;
      hint = ` (count(a)=${aCount}, ${aCount % 2 === 0 ? 'even' : 'odd'})`;
    }
    this.log.push({ text: `Halted in ${this.state} → ${verdict}`, cls: accepted ? 'accept' : 'reject' });
    this.renderLog();
    this.showResult(accepted ? 'accept' : 'reject', `"${this.input}" ${verdict} — final state: ${this.state}${hint}`);
  }

  run() {
    if (this.running) { this.stop(); return; }
    if (this.pos >= this.input.length) this.reset();
    this.running = true;
    document.getElementById('dfa-run').textContent = '⏹ Stop';
    this.timer = setInterval(() => {
      if (this.pos >= this.input.length) { this.stop(); this.finish(); return; }
      this.step();
    }, this.speed);
  }

  stop() {
    clearInterval(this.timer);
    this.running = false;
    const btn = document.getElementById('dfa-run');
    if (btn) btn.textContent = '▶▶ Run';
  }

  renderAll(activeRule) {
    this.renderTape();
    this.renderTable(activeRule);
    this.renderLog();
    this.renderDiagram(activeRule);
    this.renderStats();
  }

  renderTape() {
    const tape = document.getElementById('dfa-tape');
    if (!tape) return;
    let html = '';
    for (let i = 0; i < this.input.length; i++) {
      let cls = 'tape-cell';
      if (i === this.pos) cls += ' current';
      else if (i < this.pos) cls += ' read';
      html += `<div class="${cls}">${this.input[i]}</div>`;
    }
    if (!this.input.length) html = '<span style="color:var(--text3);font-size:.8rem">empty input</span>';
    tape.innerHTML = html;
  }

  renderTable(activeRule) {
    const tbody = document.getElementById('dfa-trans-body');
    if (!tbody) return;
    let html = '';
    this.current.transitions.forEach(t => {
      const isActive = activeRule && activeRule.state === t.state && activeRule.symbol === t.symbol;
      html += `<tr class="${isActive ? 'active-rule' : ''}">
        <td>${t.state}${this.current.acceptStates.includes(t.state) ? ' <span class="badge badge-accept">acc</span>' : ''}</td>
        <td><code>${t.symbol}</code></td>
        <td>${t.next}</td>
        ${isActive ? '<td><span class="badge badge-active">●</span></td>' : '<td></td>'}
      </tr>`;
    });
    tbody.innerHTML = html;
    // Scroll active row into view
    const activeRow = tbody.querySelector('.active-rule');
    if (activeRow) activeRow.scrollIntoView({ block: 'nearest' });
  }

  renderLog() {
    const wrap = document.getElementById('dfa-log');
    if (!wrap) return;
    wrap.innerHTML = this.log.map(e => `<div class="log-entry ${e.cls}">${e.text}</div>`).join('');
    wrap.scrollTop = wrap.scrollHeight;
  }

  renderDiagram(activeRule) {
    DIAGRAM.render('dfa-diagram', this.current, this.state, activeRule);
  }

  renderStats() {
    const m = this.current;
    document.getElementById('dfa-stat-states').textContent = m.states.length;
    document.getElementById('dfa-stat-alpha').textContent = m.alphabet.length;
    document.getElementById('dfa-stat-pos').textContent = `${this.pos}/${this.input.length}`;
    document.getElementById('dfa-stat-state').textContent = this.state || '—';
  }

  showResult(type, msg) {
    const b = document.getElementById('dfa-result');
    if (!b) return;
    b.className = 'result-banner';
    if (!type) { b.classList.remove('show'); return; }
    b.classList.add('show', type);
    b.textContent = msg || '';
  }
}

// ===== DFA DESIGNER =====
const DFADesigner = {
  sim: null,
  rows: [],

  init(sim) {
    this.sim = sim;
    this.rows = [];
    this.renderRows();
    document.getElementById('dfa-designer-add').addEventListener('click', () => this.addRow());
    document.getElementById('dfa-designer-prefill').addEventListener('click', () => this.prefillFromSelected());
    document.getElementById('dfa-designer-save').addEventListener('click', () => this.save());
    document.getElementById('dfa-designer-delete').addEventListener('click', () => this.deleteMachine());
  },

  prefillFromSelected() {
    const key = document.getElementById('dfa-machine-select').value;
    const m = this.sim.machines[key];
    if (!m) { this.msg('Select a machine first', 'err'); return; }

    document.getElementById('dfa-d-name').value = `${m.name} copy`;
    document.getElementById('dfa-d-states').value = (m.states || []).join(',');
    document.getElementById('dfa-d-start').value = m.startState || '';
    document.getElementById('dfa-d-accept').value = (m.acceptStates || []).join(',');
    document.getElementById('dfa-d-input').value = document.getElementById('dfa-input').value || '';

    this.rows = (m.transitions || []).map((t, i) => ({
      id: Date.now() + i + Math.random(),
      state: t.state || '',
      symbol: t.symbol || '',
      next: t.next || '',
    }));
    this.renderRows();
    this.msg('Prefilled from selected machine', 'ok');
  },

  addRow(data) {
    const id = Date.now() + Math.random();
    const row = data || { state: '', symbol: '', next: '' };
    this.rows.push({ id, ...row });
    this.renderRows();
  },

  removeRow(id) {
    this.rows = this.rows.filter(r => r.id !== id);
    this.renderRows();
  },

  renderRows() {
    const cont = document.getElementById('dfa-trans-rows');
    if (!cont) return;
    cont.innerHTML = this.rows.map(r => `
      <div class="trans-row" style="grid-template-columns:1fr 80px 1fr 30px" data-id="${r.id}">
        <input placeholder="State" value="${r.state||''}" class="tr-state"/>
        <input placeholder="Symbol" value="${r.symbol||''}" class="tr-symbol" maxlength="4"/>
        <input placeholder="Next state" value="${r.next||''}" class="tr-next"/>
        <button class="remove-btn" onclick="DFADesigner.removeRow(${r.id})">✕</button>
      </div>`).join('');
    // Update row data on input
    cont.querySelectorAll('.trans-row').forEach(row => {
      const id = parseFloat(row.dataset.id);
      row.querySelector('.tr-state').addEventListener('input', e => { const r = this.rows.find(x=>x.id===id); if(r) r.state=e.target.value; });
      row.querySelector('.tr-symbol').addEventListener('input', e => { const r = this.rows.find(x=>x.id===id); if(r) r.symbol=e.target.value; });
      row.querySelector('.tr-next').addEventListener('input', e => { const r = this.rows.find(x=>x.id===id); if(r) r.next=e.target.value; });
    });
  },

  getFormValues() {
    return {
      name: document.getElementById('dfa-d-name').value.trim(),
      states: document.getElementById('dfa-d-states').value.split(',').map(s=>s.trim()).filter(Boolean),
      startState: document.getElementById('dfa-d-start').value.trim(),
      acceptStates: document.getElementById('dfa-d-accept').value.split(',').map(s=>s.trim()).filter(Boolean),
      testInput: document.getElementById('dfa-d-input').value,
    };
  },

  validate(f) {
    if (!f.name) return 'Name is required';
    if (!f.states.length) return 'States required';
    if (!f.startState) return 'Start state required';
    if (!f.states.includes(f.startState)) return `Start state "${f.startState}" not in states list`;
    for (const s of f.acceptStates) {
      if (!f.states.includes(s)) return `Accept state "${s}" not in states list`;
    }
    for (const r of this.rows) {
      if (!r.state || !r.next) return 'All transition rows need state and next state';
      if (!f.states.includes(r.state)) return `Transition state "${r.state}" not in states list`;
      if (!f.states.includes(r.next)) return `Transition next "${r.next}" not in states list`;
    }
    return null;
  },

  msg(text, type) {
    const el = document.getElementById('dfa-designer-msg');
    if (!el) return;
    el.textContent = text;
    el.className = `designer-msg show ${type}`;
    setTimeout(() => el.classList.remove('show'), 3000);
  },

  save() {
    const f = this.getFormValues();
    const err = this.validate(f);
    if (err) { this.msg(err, 'err'); return; }

    const alphabet = [...new Set(this.rows.map(r => r.symbol).filter(Boolean))];
    const transitions = this.rows.map(r => ({ state: r.state, symbol: r.symbol, next: r.next }));
    const key = 'user-dfa-' + f.name.toLowerCase().replace(/\s+/g,'-');
    const machine = {
      name: f.name,
      description: `Custom DFA: ${f.name}`,
      states: f.states,
      startState: f.startState,
      acceptStates: f.acceptStates,
      alphabet,
      transitions,
      type: 'dfa',
    };
    this.sim.machines[key] = machine;
    this.sim.buildMachineSelect();
    this.sim.loadMachine(key);
    this.sim.setInput(f.testInput);
    this.msg('Machine saved and loaded!', 'ok');
  },

  deleteMachine() {
    const sel = document.getElementById('dfa-machine-select');
    const key = sel.value;
    if (DFA_MACHINES[key]) { this.msg("Can't delete built-in machines", 'err'); return; }
    delete this.sim.machines[key];
    this.sim.buildMachineSelect();
    this.sim.loadMachine(Object.keys(DFA_MACHINES)[0]);
    this.msg('Machine deleted', 'ok');
  },
};

window.DFASimulator = DFASimulator;
window.DFADesigner = DFADesigner;
