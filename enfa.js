// ===== ε-NFA ENGINE + UI =====

const ENFA_MACHINES = {
  '012star': {
    name: "0*1*2*",
    description: "Accepts strings of the form 0*1*2*: zero or more 0s, then 1s, then 2s. ε-transitions allow jumping between groups without consuming input.",
    states: ['q0','q1','q2','q3'],
    startState: 'q0',
    acceptStates: ['q3'],
    alphabet: ['0','1','2'],
    transitions: [
      { state:'q0', symbol:'0', next:['q0'] },
      { state:'q0', symbol:'ε', next:['q1'] },
      { state:'q1', symbol:'1', next:['q1'] },
      { state:'q1', symbol:'ε', next:['q2'] },
      { state:'q2', symbol:'2', next:['q2'] },
      { state:'q2', symbol:'ε', next:['q3'] },
    ],
    type: 'enfa',
  },
  'ab-or-ba': {
    name: "(ab)*|(ba)*",
    description: "Accepts strings that are either repetitions of 'ab' or repetitions of 'ba'. NFA forks at start via ε-transitions.",
    states: ['q0','qA','qB','qC','qD','qE'],
    startState: 'q0',
    acceptStates: ['q0','qB','qD'],
    alphabet: ['a','b'],
    transitions: [
      { state:'q0', symbol:'ε', next:['qA','qC'] },
      // (ab)* path
      { state:'qA', symbol:'a', next:['qB'] },
      { state:'qB', symbol:'b', next:['qA'] },
      // (ba)* path
      { state:'qC', symbol:'b', next:['qD'] },
      { state:'qD', symbol:'a', next:['qC'] },
    ],
    type: 'enfa',
  },
};

class ENFASimulator {
  constructor() {
    this.machines = { ...ENFA_MACHINES };
    this.current = null;
    this.input = '';
    this.pos = 0;
    this.activeStates = [];
    this.running = false;
    this.timer = null;
    this.log = [];
    this.speed = 600;
    this.init();
  }

  init() {
    this.buildMachineSelect();
    this.bindEvents();
    this.loadMachine('012star');
    this.setInput('0011');
  }

  buildMachineSelect() {
    const sel = document.getElementById('enfa-machine-select');
    sel.innerHTML = '';
    const bi = document.createElement('optgroup');
    bi.label = 'Built-in machines';
    Object.keys(ENFA_MACHINES).forEach(k => {
      const o = document.createElement('option');
      o.value = k; o.textContent = ENFA_MACHINES[k].name;
      bi.appendChild(o);
    });
    sel.appendChild(bi);
    const userKeys = Object.keys(this.machines).filter(k => !ENFA_MACHINES[k]);
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
    document.getElementById('enfa-machine-select').addEventListener('change', e => this.loadMachine(e.target.value));
    document.getElementById('enfa-input').addEventListener('input', e => this.setInput(e.target.value));
    document.getElementById('enfa-step').addEventListener('click', () => this.step());
    document.getElementById('enfa-run').addEventListener('click', () => this.run());
    document.getElementById('enfa-reset').addEventListener('click', () => this.reset());
    document.getElementById('enfa-speed').addEventListener('input', e => { this.speed = 1100 - e.target.value; });
    ENFADesigner.init(this);
  }

  loadMachine(key) {
    this.stop();
    this.current = this.machines[key];
    document.getElementById('enfa-machine-select').value = key;
    document.getElementById('enfa-desc').textContent = this.current.description;
    this.reset();
  }

  setInput(str) {
    this.input = str;
    document.getElementById('enfa-input').value = str;
    this.reset();
  }

  reset() {
    this.stop();
    this.pos = 0;
    this.activeStates = this.current ? this.epsilonClosure([this.current.startState]) : [];
    this.log = [];
    if (this.current && this.activeStates.length > 1) {
      this.log.push({ text: `ε-closure({${this.current.startState}}) = {${this.activeStates.join(',')}}`, cls: 'epsilon' });
    }
    this.renderAll();
    this.showResult('');
  }

  epsilonClosure(states) {
    const closure = new Set(states);
    const stack = [...states];
    while (stack.length) {
      const s = stack.pop();
      const eps = this.current.transitions.filter(t => t.state === s && t.symbol === 'ε');
      eps.forEach(t => {
        const nexts = Array.isArray(t.next) ? t.next : [t.next];
        nexts.forEach(n => {
          if (!closure.has(n)) { closure.add(n); stack.push(n); }
        });
      });
    }
    return [...closure];
  }

  move(states, sym) {
    const result = new Set();
    states.forEach(s => {
      const rules = this.current.transitions.filter(t => t.state === s && t.symbol === sym);
      rules.forEach(r => {
        const nexts = Array.isArray(r.next) ? r.next : [r.next];
        nexts.forEach(n => result.add(n));
      });
    });
    return [...result];
  }

  step() {
    if (!this.current || this.activeStates.length === 0) { this.finish(); return; }
    if (this.pos >= this.input.length) { this.finish(); return; }
    const sym = this.input[this.pos];
    const moved = this.move(this.activeStates, sym);
    const next = this.epsilonClosure(moved);
    this.log.push({ text: `Step ${this.pos+1}: δ̂({${this.activeStates.join(',')}}, '${sym}') = {${next.join(',') || '∅'}}`, cls: 'step' });
    if (moved.length !== next.length) {
      this.log.push({ text: `  ε-closure({${moved.join(',')}}) = {${next.join(',')}}`, cls: 'epsilon' });
    }
    this.activeStates = next;
    this.pos++;
    this.renderAll();
    if (this.pos >= this.input.length) setTimeout(() => this.finish(), 100);
  }

  finish() {
    this.stop();
    if (!this.current) return;
    const accepted = this.activeStates.some(s => this.current.acceptStates.includes(s));
    const verdict = accepted ? 'ACCEPTED' : 'REJECTED';
    this.log.push({ text: `Halted: {${this.activeStates.join(',')}} → ${verdict}`, cls: accepted ? 'accept' : 'reject' });
    this.renderLog();
    this.showResult(accepted ? 'accept' : 'reject', `"${this.input}" ${verdict}`);
  }

  run() {
    if (this.running) { this.stop(); return; }
    if (this.pos >= this.input.length) this.reset();
    this.running = true;
    document.getElementById('enfa-run').textContent = '⏹ Stop';
    this.timer = setInterval(() => {
      if (this.pos >= this.input.length || this.activeStates.length === 0) {
        this.stop(); this.finish(); return;
      }
      this.step();
    }, this.speed);
  }

  stop() {
    clearInterval(this.timer);
    this.running = false;
    const btn = document.getElementById('enfa-run');
    if (btn) btn.textContent = '▶▶ Run';
  }

  renderAll() {
    this.renderTape();
    this.renderTable();
    this.renderLog();
    this.renderDiagram();
    this.renderActiveStates();
    this.renderStats();
  }

  renderTape() {
    const tape = document.getElementById('enfa-tape');
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

  renderTable() {
    const tbody = document.getElementById('enfa-trans-body');
    if (!tbody) return;
    let html = '';
    this.current.transitions.forEach(t => {
      const nexts = Array.isArray(t.next) ? t.next.join(', ') : t.next;
      const sym = t.symbol === 'ε' ? '<span style="color:var(--yellow)">ε</span>' : `<code>${t.symbol}</code>`;
      html += `<tr>
        <td>${t.state}${this.current.acceptStates.includes(t.state) ? ' <span class="badge badge-accept">acc</span>' : ''}</td>
        <td>${sym}</td>
        <td>{${nexts}}</td>
      </tr>`;
    });
    tbody.innerHTML = html;
  }

  renderLog() {
    const wrap = document.getElementById('enfa-log');
    if (!wrap) return;
    wrap.innerHTML = this.log.map(e => `<div class="log-entry ${e.cls}">${e.text}</div>`).join('');
    wrap.scrollTop = wrap.scrollHeight;
  }

  renderDiagram() {
    DIAGRAM.render('enfa-diagram', this.current, this.activeStates, null);
  }

  renderActiveStates() {
    const wrap = document.getElementById('enfa-active-states');
    if (!wrap) return;
    if (!this.current) { wrap.innerHTML = ''; return; }
    wrap.innerHTML = this.current.states.map(s => {
      const isActive = this.activeStates.includes(s);
      const isAccept = this.current.acceptStates.includes(s);
      let cls = 'state-chip';
      if (isActive && isAccept) cls += ' accept';
      else if (isActive) cls += ' active';
      return `<div class="${cls}">${s}</div>`;
    }).join('');
  }

  renderStats() {
    const m = this.current;
    document.getElementById('enfa-stat-states').textContent = m.states.length;
    document.getElementById('enfa-stat-active').textContent = this.activeStates.length;
    document.getElementById('enfa-stat-pos').textContent = `${this.pos}/${this.input.length}`;
    document.getElementById('enfa-stat-trans').textContent = m.transitions.length;
  }

  showResult(type, msg) {
    const b = document.getElementById('enfa-result');
    if (!b) return;
    b.className = 'result-banner';
    if (!type) { b.classList.remove('show'); return; }
    b.classList.add('show', type);
    b.textContent = msg || '';
  }
}

// ===== ε-NFA DESIGNER =====
const ENFADesigner = {
  sim: null,
  rows: [],

  init(sim) {
    this.sim = sim;
    this.rows = [];
    this.renderRows();
    document.getElementById('enfa-designer-add').addEventListener('click', () => this.addRow());
    document.getElementById('enfa-designer-prefill').addEventListener('click', () => this.prefillFromSelected());
    document.getElementById('enfa-designer-save').addEventListener('click', () => this.save());
    document.getElementById('enfa-designer-delete').addEventListener('click', () => this.deleteMachine());
  },

  prefillFromSelected() {
    const key = document.getElementById('enfa-machine-select').value;
    const m = this.sim.machines[key];
    if (!m) { this.msg('Select a machine first', 'err'); return; }

    document.getElementById('enfa-d-name').value = `${m.name} copy`;
    document.getElementById('enfa-d-states').value = (m.states || []).join(',');
    document.getElementById('enfa-d-start').value = m.startState || '';
    document.getElementById('enfa-d-accept').value = (m.acceptStates || []).join(',');
    document.getElementById('enfa-d-input').value = document.getElementById('enfa-input').value || '';

    this.rows = (m.transitions || []).map((t, i) => ({
      id: Date.now() + i + Math.random(),
      state: t.state || '',
      symbol: t.symbol || 'ε',
      next: Array.isArray(t.next) ? t.next.join(',') : (t.next || ''),
    }));
    this.renderRows();
    this.msg('Prefilled from selected machine', 'ok');
  },

  addRow() {
    const id = Date.now() + Math.random();
    this.rows.push({ id, state: '', symbol: '', next: '' });
    this.renderRows();
  },

  removeRow(id) {
    this.rows = this.rows.filter(r => r.id !== id);
    this.renderRows();
  },

  renderRows() {
    const cont = document.getElementById('enfa-trans-rows');
    if (!cont) return;
    cont.innerHTML = this.rows.map(r => `
      <div class="trans-row" style="grid-template-columns:1fr 80px 1fr 30px" data-id="${r.id}">
        <input placeholder="State" value="${r.state||''}" class="tr-state"/>
        <input placeholder="Symbol or ε" value="${r.symbol||''}" class="tr-symbol" maxlength="4"/>
        <input placeholder="Next states (comma-sep)" value="${r.next||''}" class="tr-next"/>
        <button class="remove-btn" onclick="ENFADesigner.removeRow(${r.id})">✕</button>
      </div>`).join('');
    cont.querySelectorAll('.trans-row').forEach(row => {
      const id = parseFloat(row.dataset.id);
      row.querySelector('.tr-state').addEventListener('input', e => { const r=this.rows.find(x=>x.id===id); if(r) r.state=e.target.value; });
      row.querySelector('.tr-symbol').addEventListener('input', e => { const r=this.rows.find(x=>x.id===id); if(r) r.symbol=e.target.value; });
      row.querySelector('.tr-next').addEventListener('input', e => { const r=this.rows.find(x=>x.id===id); if(r) r.next=e.target.value; });
    });
  },

  save() {
    const name = document.getElementById('enfa-d-name').value.trim();
    const states = document.getElementById('enfa-d-states').value.split(',').map(s=>s.trim()).filter(Boolean);
    const startState = document.getElementById('enfa-d-start').value.trim();
    const acceptStates = document.getElementById('enfa-d-accept').value.split(',').map(s=>s.trim()).filter(Boolean);
    const testInput = document.getElementById('enfa-d-input').value;

    if (!name || !states.length || !startState) { this.msg('Name, states, and start state are required','err'); return; }

    const transitions = this.rows.map(r => ({
      state: r.state,
      symbol: r.symbol || 'ε',
      next: r.next.split(',').map(s=>s.trim()).filter(Boolean),
    }));
    const key = 'user-enfa-' + name.toLowerCase().replace(/\s+/g,'-');
    const machine = { name, description: `Custom ε-NFA: ${name}`, states, startState, acceptStates, alphabet: [], transitions, type:'enfa' };
    this.sim.machines[key] = machine;
    this.sim.buildMachineSelect();
    this.sim.loadMachine(key);
    this.sim.setInput(testInput);
    this.msg('Machine saved and loaded!', 'ok');
  },

  msg(text, type) {
    const el = document.getElementById('enfa-designer-msg');
    if (!el) return;
    el.textContent = text;
    el.className = `designer-msg show ${type}`;
    setTimeout(() => el.classList.remove('show'), 3000);
  },

  deleteMachine() {
    const sel = document.getElementById('enfa-machine-select');
    const key = sel.value;
    if (ENFA_MACHINES[key]) { this.msg("Can't delete built-in machines", 'err'); return; }
    delete this.sim.machines[key];
    this.sim.buildMachineSelect();
    this.sim.loadMachine(Object.keys(ENFA_MACHINES)[0]);
    this.msg('Machine deleted', 'ok');
  },
};

window.ENFASimulator = ENFASimulator;
window.ENFADesigner = ENFADesigner;
