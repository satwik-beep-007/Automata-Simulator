// ===== NFA ENGINE + UI =====

const NFA_MACHINES = {
  'contains-ab': {
    name: "Contains substring 'ab'",
    description: "Accepts strings over {a,b} that contain 'ab' as a substring. NFA non-deterministically guesses where 'ab' starts.",
    states: ['q0','q1','q2'],
    startState: 'q0',
    acceptStates: ['q2'],
    alphabet: ['a','b'],
    transitions: [
      { state:'q0', symbol:'a', next:['q0','q1'] },
      { state:'q0', symbol:'b', next:['q0'] },
      { state:'q1', symbol:'b', next:['q2'] },
      { state:'q2', symbol:'a', next:['q2'] },
      { state:'q2', symbol:'b', next:['q2'] },
    ],
    type: 'nfa',
  },
  'len-div2-or-3': {
    name: "Length divisible by 2 or 3",
    description: "Accepts strings over {a} whose length is divisible by 2 or 3. The NFA forks into two paths at the start.",
    states: ['q0','qA','qB','qC','qD','qE'],
    startState: 'q0',
    acceptStates: ['q0','qA','qC'],
    alphabet: ['a'],
    transitions: [
      // div by 2 path: q0 -> qA -> q0
      { state:'q0', symbol:'a', next:['qA','qC'] },
      { state:'qA', symbol:'a', next:['q0'] },
      // div by 3 path: q0 -> qC -> qD -> q0
      { state:'qC', symbol:'a', next:['qD'] },
      { state:'qD', symbol:'a', next:['q0'] },
    ],
    type: 'nfa',
  },
};

class NFASimulator {
  constructor() {
    this.machines = { ...NFA_MACHINES };
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
    this.loadMachine('contains-ab');
    this.setInput('aab');
  }

  buildMachineSelect() {
    const sel = document.getElementById('nfa-machine-select');
    sel.innerHTML = '';
    const bi = document.createElement('optgroup');
    bi.label = 'Built-in machines';
    Object.keys(NFA_MACHINES).forEach(k => {
      const o = document.createElement('option');
      o.value = k; o.textContent = NFA_MACHINES[k].name;
      bi.appendChild(o);
    });
    sel.appendChild(bi);
    const userKeys = Object.keys(this.machines).filter(k => !NFA_MACHINES[k]);
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
    document.getElementById('nfa-machine-select').addEventListener('change', e => this.loadMachine(e.target.value));
    document.getElementById('nfa-input').addEventListener('input', e => this.setInput(e.target.value));
    document.getElementById('nfa-step').addEventListener('click', () => this.step());
    document.getElementById('nfa-run').addEventListener('click', () => this.run());
    document.getElementById('nfa-reset').addEventListener('click', () => this.reset());
    document.getElementById('nfa-speed').addEventListener('input', e => { this.speed = 1100 - e.target.value; });
    NFADesigner.init(this);
  }

  loadMachine(key) {
    this.stop();
    this.current = this.machines[key];
    document.getElementById('nfa-machine-select').value = key;
    document.getElementById('nfa-desc').textContent = this.current.description;
    this.reset();
  }

  setInput(str) {
    this.input = str;
    document.getElementById('nfa-input').value = str;
    this.reset();
  }

  reset() {
    this.stop();
    this.pos = 0;
    this.activeStates = this.current ? [this.current.startState] : [];
    this.log = [];
    this.renderAll();
    this.showResult('');
  }

  // Compute all states reachable from a set via a symbol
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
    const next = this.move(this.activeStates, sym);
    this.log.push({ text: `Step ${this.pos+1}: {${this.activeStates.join(',')}} —'${sym}'→ {${next.join(',') || '∅'}}`, cls: 'step' });
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
    document.getElementById('nfa-run').textContent = '⏹ Stop';
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
    const btn = document.getElementById('nfa-run');
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
    const tape = document.getElementById('nfa-tape');
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
    const tbody = document.getElementById('nfa-trans-body');
    if (!tbody) return;
    let html = '';
    this.current.transitions.forEach(t => {
      const nexts = Array.isArray(t.next) ? t.next.join(', ') : t.next;
      html += `<tr>
        <td>${t.state}${this.current.acceptStates.includes(t.state) ? ' <span class="badge badge-accept">acc</span>' : ''}</td>
        <td><code>${t.symbol}</code></td>
        <td>{${nexts}}</td>
      </tr>`;
    });
    tbody.innerHTML = html;
  }

  renderLog() {
    const wrap = document.getElementById('nfa-log');
    if (!wrap) return;
    wrap.innerHTML = this.log.map(e => `<div class="log-entry ${e.cls}">${e.text}</div>`).join('');
    wrap.scrollTop = wrap.scrollHeight;
  }

  renderDiagram() {
    DIAGRAM.render('nfa-diagram', this.current, this.activeStates, null);
  }

  renderActiveStates() {
    const wrap = document.getElementById('nfa-active-states');
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
    document.getElementById('nfa-stat-states').textContent = m.states.length;
    document.getElementById('nfa-stat-active').textContent = this.activeStates.length;
    document.getElementById('nfa-stat-pos').textContent = `${this.pos}/${this.input.length}`;
    document.getElementById('nfa-stat-trans').textContent = m.transitions.length;
  }

  showResult(type, msg) {
    const b = document.getElementById('nfa-result');
    if (!b) return;
    b.className = 'result-banner';
    if (!type) { b.classList.remove('show'); return; }
    b.classList.add('show', type);
    b.textContent = msg || '';
  }
}

// ===== NFA DESIGNER =====
const NFADesigner = {
  sim: null,
  rows: [],

  init(sim) {
    this.sim = sim;
    this.rows = [];
    this.renderRows();
    document.getElementById('nfa-designer-add').addEventListener('click', () => this.addRow());
    document.getElementById('nfa-designer-prefill').addEventListener('click', () => this.prefillFromSelected());
    document.getElementById('nfa-designer-save').addEventListener('click', () => this.save());
    document.getElementById('nfa-designer-delete').addEventListener('click', () => this.deleteMachine());
  },

  prefillFromSelected() {
    const key = document.getElementById('nfa-machine-select').value;
    const m = this.sim.machines[key];
    if (!m) { this.msg('Select a machine first', 'err'); return; }

    document.getElementById('nfa-d-name').value = `${m.name} copy`;
    document.getElementById('nfa-d-states').value = (m.states || []).join(',');
    document.getElementById('nfa-d-start').value = m.startState || '';
    document.getElementById('nfa-d-accept').value = (m.acceptStates || []).join(',');
    document.getElementById('nfa-d-input').value = document.getElementById('nfa-input').value || '';

    this.rows = (m.transitions || []).map((t, i) => ({
      id: Date.now() + i + Math.random(),
      state: t.state || '',
      symbol: t.symbol || '',
      next: Array.isArray(t.next) ? t.next.join(',') : (t.next || ''),
    }));
    this.renderRows();
    this.msg('Prefilled from selected machine', 'ok');
  },

  addRow(data) {
    const id = Date.now() + Math.random();
    this.rows.push({ id, state: '', symbol: '', next: '', ...(data||{}) });
    this.renderRows();
  },

  removeRow(id) {
    this.rows = this.rows.filter(r => r.id !== id);
    this.renderRows();
  },

  renderRows() {
    const cont = document.getElementById('nfa-trans-rows');
    if (!cont) return;
    cont.innerHTML = this.rows.map(r => `
      <div class="trans-row" style="grid-template-columns:1fr 80px 1fr 30px" data-id="${r.id}">
        <input placeholder="State" value="${r.state||''}" class="tr-state"/>
        <input placeholder="Symbol" value="${r.symbol||''}" class="tr-symbol" maxlength="4"/>
        <input placeholder="Next states (comma-sep)" value="${r.next||''}" class="tr-next"/>
        <button class="remove-btn" onclick="NFADesigner.removeRow(${r.id})">✕</button>
      </div>`).join('');
    cont.querySelectorAll('.trans-row').forEach(row => {
      const id = parseFloat(row.dataset.id);
      row.querySelector('.tr-state').addEventListener('input', e => { const r=this.rows.find(x=>x.id===id); if(r) r.state=e.target.value; });
      row.querySelector('.tr-symbol').addEventListener('input', e => { const r=this.rows.find(x=>x.id===id); if(r) r.symbol=e.target.value; });
      row.querySelector('.tr-next').addEventListener('input', e => { const r=this.rows.find(x=>x.id===id); if(r) r.next=e.target.value; });
    });
  },

  save() {
    const name = document.getElementById('nfa-d-name').value.trim();
    const states = document.getElementById('nfa-d-states').value.split(',').map(s=>s.trim()).filter(Boolean);
    const startState = document.getElementById('nfa-d-start').value.trim();
    const acceptStates = document.getElementById('nfa-d-accept').value.split(',').map(s=>s.trim()).filter(Boolean);
    const testInput = document.getElementById('nfa-d-input').value;

    if (!name || !states.length || !startState) { this.msg('Name, states, and start state are required','err'); return; }

    const transitions = this.rows.map(r => ({
      state: r.state,
      symbol: r.symbol,
      next: r.next.split(',').map(s=>s.trim()).filter(Boolean),
    }));
    const key = 'user-nfa-' + name.toLowerCase().replace(/\s+/g,'-');
    const machine = { name, description: `Custom NFA: ${name}`, states, startState, acceptStates, alphabet: [], transitions, type:'nfa' };
    this.sim.machines[key] = machine;
    this.sim.buildMachineSelect();
    this.sim.loadMachine(key);
    this.sim.setInput(testInput);
    this.msg('Machine saved and loaded!', 'ok');
  },

  msg(text, type) {
    const el = document.getElementById('nfa-designer-msg');
    if (!el) return;
    el.textContent = text;
    el.className = `designer-msg show ${type}`;
    setTimeout(() => el.classList.remove('show'), 3000);
  },

  deleteMachine() {
    const sel = document.getElementById('nfa-machine-select');
    const key = sel.value;
    if (NFA_MACHINES[key]) { this.msg("Can't delete built-in machines", 'err'); return; }
    delete this.sim.machines[key];
    this.sim.buildMachineSelect();
    this.sim.loadMachine(Object.keys(NFA_MACHINES)[0]);
    this.msg('Machine deleted', 'ok');
  },
};

window.NFASimulator = NFASimulator;
window.NFADesigner = NFADesigner;
