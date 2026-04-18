// ===== PDA ENGINE + UI =====

const PDA_MACHINES = {
  'anbn': {
    name: "aⁿbⁿ (equal a's and b's)",
    description: "Accepts strings of form aⁿbⁿ (n≥0). Pushes 'A' for each 'a', pops for each 'b'. Uses $ as stack bottom marker.",
    states: ['q0','q1','q2'],
    startState: 'q0',
    acceptStates: ['q2'],
    alphabet: ['a','b'],
    stackAlphabet: ['A','$'],
    startStack: '$',
    transitions: [
      // Push phase
      { state:'q0', input:'a', pop:'A', push:['A','A'], next:'q0' },
      { state:'q0', input:'a', pop:'$', push:['A','$'], next:'q0' },
      // Switch phase (ε on a)
      { state:'q0', input:'ε', pop:'A', push:['A'], next:'q1' },
      // Pop phase
      { state:'q1', input:'b', pop:'A', push:[], next:'q1' },
      // Accept
      { state:'q1', input:'ε', pop:'$', push:[], next:'q2' },
    ],
    type: 'pda',
  },
  'palindrome': {
    name: "Palindromes over {a,b}",
    description: "Accepts palindromes (strings that read the same forwards and backwards) over {a,b}. Pushes first half, pops against second half.",
    states: ['q0','q1','q2'],
    startState: 'q0',
    acceptStates: ['q2'],
    alphabet: ['a','b'],
    stackAlphabet: ['A','B','$'],
    startStack: '$',
    transitions: [
      { state:'q0', input:'a', pop:'A', push:['A','A'], next:'q0' },
      { state:'q0', input:'a', pop:'B', push:['A','B'], next:'q0' },
      { state:'q0', input:'a', pop:'$', push:['A','$'], next:'q0' },
      { state:'q0', input:'b', pop:'A', push:['B','A'], next:'q0' },
      { state:'q0', input:'b', pop:'B', push:['B','B'], next:'q0' },
      { state:'q0', input:'b', pop:'$', push:['B','$'], next:'q0' },
      // Guess midpoint (ε)
      { state:'q0', input:'ε', pop:'A', push:['A'], next:'q1' },
      { state:'q0', input:'ε', pop:'B', push:['B'], next:'q1' },
      { state:'q0', input:'ε', pop:'$', push:['$'], next:'q1' },
      // Pop phase
      { state:'q1', input:'a', pop:'A', push:[], next:'q1' },
      { state:'q1', input:'b', pop:'B', push:[], next:'q1' },
      // Accept
      { state:'q1', input:'ε', pop:'$', push:[], next:'q2' },
    ],
    type: 'pda',
  },
  'balanced': {
    name: "Balanced parentheses",
    description: "Accepts strings of balanced parentheses '(' and ')'. Pushes on '(' and pops on ')'. Accepts when stack is empty.",
    states: ['q0','q1'],
    startState: 'q0',
    acceptStates: ['q1'],
    alphabet: ['(',')'],
    stackAlphabet: ['P','$'],
    startStack: '$',
    transitions: [
      { state:'q0', input:'(', pop:'P', push:['P','P'], next:'q0' },
      { state:'q0', input:'(', pop:'$', push:['P','$'], next:'q0' },
      { state:'q0', input:')', pop:'P', push:[], next:'q0' },
      { state:'q0', input:'ε', pop:'$', push:[], next:'q1' },
    ],
    type: 'pda',
  },
};

class PDASimulator {
  constructor() {
    this.machines = { ...PDA_MACHINES };
    this.current = null;
    this.input = '';
    this.pos = 0;
    this.state = null;
    this.stack = [];
    this.running = false;
    this.timer = null;
    this.log = [];
    this.speed = 700;
    this.init();
  }

  init() {
    this.buildMachineSelect();
    this.bindEvents();
    this.loadMachine('anbn');
    this.setInput('aaabbb');
  }

  buildMachineSelect() {
    const sel = document.getElementById('pda-machine-select');
    sel.innerHTML = '';
    const bi = document.createElement('optgroup');
    bi.label = 'Built-in machines';
    Object.keys(PDA_MACHINES).forEach(k => {
      const o = document.createElement('option');
      o.value = k; o.textContent = PDA_MACHINES[k].name;
      bi.appendChild(o);
    });
    sel.appendChild(bi);
    const userKeys = Object.keys(this.machines).filter(k => !PDA_MACHINES[k]);
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
    document.getElementById('pda-machine-select').addEventListener('change', e => this.loadMachine(e.target.value));
    document.getElementById('pda-input').addEventListener('input', e => this.setInput(e.target.value));
    document.getElementById('pda-step').addEventListener('click', () => this.step());
    document.getElementById('pda-run').addEventListener('click', () => this.run());
    document.getElementById('pda-reset').addEventListener('click', () => this.reset());
    document.getElementById('pda-speed').addEventListener('input', e => { this.speed = 1100 - e.target.value; });
    PDADesigner.init(this);
  }

  loadMachine(key) {
    this.stop();
    this.current = this.machines[key];
    document.getElementById('pda-machine-select').value = key;
    document.getElementById('pda-desc').textContent = this.current.description;
    this.reset();
  }

  setInput(str) {
    this.input = str;
    document.getElementById('pda-input').value = str;
    this.reset();
  }

  reset() {
    this.stop();
    this.pos = 0;
    this.state = this.current ? this.current.startState : null;
    this.stack = this.current ? [this.current.startStack] : [];
    this.log = [];
    this.renderAll();
    this.showResult('');
  }

  // Find a matching rule for a specific input symbol (or ε).
  // pop='ε' means do not pop and does not depend on current stack top.
  findRule(symbol) {
    const top = this.stack.length ? this.stack[this.stack.length - 1] : null;
    return this.current.transitions.find(t =>
      t.state === this.state &&
      t.input === symbol &&
      (t.pop === 'ε' || (top !== null && t.pop === top))
    );
  }

  step() {
    if (!this.current) return;

    // Prefer consuming transitions; use ε only as fallback.
    if (this.pos < this.input.length) {
      const readRule = this.findRule(this.input[this.pos]);
      if (readRule) {
        this.applyRule(readRule, true);
        return;
      }
    }

    const epsRule = this.findRule('ε');
    if (epsRule) {
      this.applyRule(epsRule, false);
      return;
    }

    if (this.pos >= this.input.length) {
      this.finish();
      return;
    }

    const sym = this.input[this.pos];
    const top = this.stack.length ? this.stack[this.stack.length - 1] : 'ε';
    this.log.push({ text: `No rule for (${this.state}, '${sym}', ${top}) — REJECT`, cls: 'reject' });
    this.renderAll();
    this.finish();
  }

  applyRule(rule, consume) {
    let top = 'ε';
    if (rule.pop !== 'ε') {
      top = this.stack.length ? this.stack[this.stack.length - 1] : 'ε';
      this.stack.pop();
    }
    if (rule.push.length) {
      [...rule.push].reverse().forEach(s => this.stack.push(s));
    }
    const prevState = this.state;
    this.state = rule.next;
    if (consume) this.pos++;

    const inp = rule.input === 'ε' ? 'ε' : `'${rule.input}'`;
    const pushStr = rule.push.length ? rule.push.join('') : 'ε';
    this.log.push({
      text: `(${prevState}, ${inp}, ${top}) → (${this.state}, ${pushStr})`,
      cls: rule.input === 'ε' ? 'epsilon' : 'step',
      rule
    });
    this.renderAll(rule);
    if (this.pos >= this.input.length && !this.running) {
      setTimeout(() => this.finish(), 150);
    }
  }

  finish() {
    this.stop();
    if (!this.current) return;
    const accepted = this.current.acceptStates.includes(this.state);
    const verdict = accepted ? 'ACCEPTED' : 'REJECTED';
    this.log.push({ text: `Halted in ${this.state} → ${verdict}`, cls: accepted ? 'accept' : 'reject' });
    this.renderLog();
    this.showResult(accepted ? 'accept' : 'reject', `"${this.input}" ${verdict} — state: ${this.state}, stack: [${this.stack.join(',')||'empty'}]`);
  }

  run() {
    if (this.running) { this.stop(); return; }
    if (this.pos >= this.input.length) this.reset();
    this.running = true;
    document.getElementById('pda-run').textContent = '⏹ Stop';
    this.timer = setInterval(() => {
      if (this.pos > this.input.length + 5) { this.stop(); this.finish(); return; }
      if (this.pos >= this.input.length) {
        // Try remaining ε transitions
        const eps = this.findRule('ε');
        if (eps) { this.applyRule(eps, false); }
        else { this.stop(); this.finish(); }
        return;
      }
      this.step();
    }, this.speed);
  }

  stop() {
    clearInterval(this.timer);
    this.running = false;
    const btn = document.getElementById('pda-run');
    if (btn) btn.textContent = '▶▶ Run';
  }

  renderAll(activeRule) {
    this.renderTape();
    this.renderStack();
    this.renderTable(activeRule);
    this.renderLog();
    this.renderDiagram(activeRule);
    this.renderStats();
  }

  renderTape() {
    const tape = document.getElementById('pda-tape');
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

  renderStack() {
    const wrap = document.getElementById('pda-stack');
    if (!wrap) return;
    const stackCopy = [...this.stack].reverse();
    if (!stackCopy.length) {
      wrap.innerHTML = '<div class="stack-label" style="color:var(--text3)">empty</div>';
      return;
    }
    wrap.innerHTML = stackCopy.map((s, i) =>
      `<div class="stack-cell" ${i===0 ? 'style="background:rgba(108,99,255,0.2);border-color:var(--accent)"' : ''}>${s}</div>`
    ).join('') + '<div class="stack-label">stack</div>';
  }

  renderTable(activeRule) {
    const tbody = document.getElementById('pda-trans-body');
    if (!tbody) return;
    let html = '';
    this.current.transitions.forEach(t => {
      const isActive = activeRule && activeRule.state === t.state && activeRule.input === t.input && activeRule.pop === t.pop;
      const inp = t.input === 'ε' ? '<span style="color:var(--yellow)">ε</span>' : `<code>${t.input}</code>`;
      const pushStr = t.push.length ? t.push.join('') : 'ε';
      html += `<tr class="${isActive ? 'active-rule' : ''}">
        <td>${t.state}</td>
        <td>${inp}</td>
        <td>${t.pop}</td>
        <td>${pushStr}</td>
        <td>${t.next}</td>
      </tr>`;
    });
    tbody.innerHTML = html;
    const ar = tbody.querySelector('.active-rule');
    if (ar) ar.scrollIntoView({ block: 'nearest' });
  }

  renderLog() {
    const wrap = document.getElementById('pda-log');
    if (!wrap) return;
    wrap.innerHTML = this.log.map(e => `<div class="log-entry ${e.cls}">${e.text}</div>`).join('');
    wrap.scrollTop = wrap.scrollHeight;
  }

  renderDiagram(activeRule) {
    DIAGRAM.render('pda-diagram', this.current, this.state, activeRule);
  }

  renderStats() {
    const m = this.current;
    document.getElementById('pda-stat-state').textContent = this.state || '—';
    document.getElementById('pda-stat-stack').textContent = this.stack.length;
    document.getElementById('pda-stat-pos').textContent = `${this.pos}/${this.input.length}`;
    document.getElementById('pda-stat-top').textContent = this.stack.length ? this.stack[this.stack.length-1] : '—';
  }

  showResult(type, msg) {
    const b = document.getElementById('pda-result');
    if (!b) return;
    b.className = 'result-banner';
    if (!type) { b.classList.remove('show'); return; }
    b.classList.add('show', type);
    b.textContent = msg || '';
  }
}

// ===== PDA DESIGNER =====
const PDADesigner = {
  sim: null,
  rows: [],

  init(sim) {
    this.sim = sim;
    this.rows = [];
    this.renderRows();
    document.getElementById('pda-designer-add').addEventListener('click', () => this.addRow());
    document.getElementById('pda-designer-prefill').addEventListener('click', () => this.prefillFromSelected());
    document.getElementById('pda-designer-save').addEventListener('click', () => this.save());
    document.getElementById('pda-designer-delete').addEventListener('click', () => this.deleteMachine());
  },

  prefillFromSelected() {
    const key = document.getElementById('pda-machine-select').value;
    const m = this.sim.machines[key];
    if (!m) { this.msg('Select a machine first', 'err'); return; }

    document.getElementById('pda-d-name').value = `${m.name} copy`;
    document.getElementById('pda-d-states').value = (m.states || []).join(',');
    document.getElementById('pda-d-start').value = m.startState || '';
    document.getElementById('pda-d-accept').value = (m.acceptStates || []).join(',');
    document.getElementById('pda-d-stack').value = m.startStack || '$';
    document.getElementById('pda-d-input').value = document.getElementById('pda-input').value || '';

    this.rows = (m.transitions || []).map((t, i) => ({
      id: Date.now() + i + Math.random(),
      state: t.state || '',
      input: t.input || 'ε',
      pop: t.pop || 'ε',
      push: Array.isArray(t.push) ? t.push.join(',') : (t.push || ''),
      next: t.next || '',
    }));
    this.renderRows();
    this.msg('Prefilled from selected machine', 'ok');
  },

  addRow() {
    const id = Date.now() + Math.random();
    this.rows.push({ id, state:'', input:'', pop:'', push:'', next:'' });
    this.renderRows();
  },

  removeRow(id) {
    this.rows = this.rows.filter(r => r.id !== id);
    this.renderRows();
  },

  renderRows() {
    const cont = document.getElementById('pda-trans-rows');
    if (!cont) return;
    cont.innerHTML = this.rows.map(r => `
      <div class="trans-row" style="grid-template-columns:1fr 60px 60px 1fr 1fr 30px" data-id="${r.id}">
        <input placeholder="State" value="${r.state||''}" class="tr-state"/>
        <input placeholder="In/ε" value="${r.input||''}" class="tr-input" maxlength="4"/>
        <input placeholder="Pop" value="${r.pop||''}" class="tr-pop" maxlength="4"/>
        <input placeholder="Push (comma-sep)" value="${r.push||''}" class="tr-push"/>
        <input placeholder="Next" value="${r.next||''}" class="tr-next"/>
        <button class="remove-btn" onclick="PDADesigner.removeRow(${r.id})">✕</button>
      </div>`).join('');
    cont.querySelectorAll('.trans-row').forEach(row => {
      const id = parseFloat(row.dataset.id);
      ['state','input','pop','push','next'].forEach(f => {
        row.querySelector(`.tr-${f}`).addEventListener('input', e => { const r=this.rows.find(x=>x.id===id); if(r) r[f]=e.target.value; });
      });
    });
  },

  save() {
    const name = document.getElementById('pda-d-name').value.trim();
    const states = document.getElementById('pda-d-states').value.split(',').map(s=>s.trim()).filter(Boolean);
    const startState = document.getElementById('pda-d-start').value.trim();
    const acceptStates = document.getElementById('pda-d-accept').value.split(',').map(s=>s.trim()).filter(Boolean);
    const startStack = document.getElementById('pda-d-stack').value.trim() || '$';
    const testInput = document.getElementById('pda-d-input').value;

    if (!name || !states.length || !startState) { this.msg('Name, states, and start state are required','err'); return; }

    const transitions = this.rows.map(r => ({
      state: r.state,
      input: r.input || 'ε',
      pop: r.pop || 'ε',
      push: r.push ? r.push.split(',').map(s=>s.trim()).filter(Boolean) : [],
      next: r.next,
    }));
    const key = 'user-pda-' + name.toLowerCase().replace(/\s+/g,'-');
    const machine = { name, description:`Custom PDA: ${name}`, states, startState, acceptStates, startStack, alphabet:[], stackAlphabet:[], transitions, type:'pda' };
    this.sim.machines[key] = machine;
    this.sim.buildMachineSelect();
    this.sim.loadMachine(key);
    this.sim.setInput(testInput);
    this.msg('Machine saved and loaded!', 'ok');
  },

  msg(text, type) {
    const el = document.getElementById('pda-designer-msg');
    if (!el) return;
    el.textContent = text;
    el.className = `designer-msg show ${type}`;
    setTimeout(() => el.classList.remove('show'), 3000);
  },

  deleteMachine() {
    const sel = document.getElementById('pda-machine-select');
    const key = sel.value;
    if (PDA_MACHINES[key]) { this.msg("Can't delete built-in machines", 'err'); return; }
    delete this.sim.machines[key];
    this.sim.buildMachineSelect();
    this.sim.loadMachine(Object.keys(PDA_MACHINES)[0]);
    this.msg('Machine deleted', 'ok');
  },
};

window.PDASimulator = PDASimulator;
window.PDADesigner = PDADesigner;
