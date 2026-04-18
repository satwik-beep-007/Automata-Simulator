// ===== STATE DIAGRAM RENDERER =====
// Draws an SVG state diagram for any automaton definition.

const DIAGRAM = (() => {
  const NODE_R = 30;
  const PAD = 28;

  // Layout states in a circle or line depending on count
  function layoutStates(states) {
    const n = states.length;
    const positions = {};
    if (n === 1) {
      positions[states[0]] = { x: 110, y: 132 };
      return { positions, w: 220, h: 240 };
    }
    // Use a multi-row grid layout for many states
    const cols = Math.min(n, Math.ceil(Math.sqrt(n * 1.5)));
    const rows = Math.ceil(n / cols);
    const xGap = n <= 4 ? 170 : n <= 8 ? 145 : 130;
    const yGap = n <= 4 ? 140 : n <= 8 ? 120 : 110;
    const w = cols * xGap + 110;
    const h = rows * yGap + 120;
    states.forEach((s, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      positions[s] = { x: 90 + col * xGap, y: 112 + row * yGap };
    });
    return { positions, w, h };
  }

  // Get all unique transitions (edges) from transition rules
  function buildEdges(rules, machineType) {
    const edges = {}; // key: "from->to", value: { from, to, labels[] }
    rules.forEach(r => {
      let from, to, label;
      if (machineType === 'dfa') {
        from = r.state; to = r.next; label = r.symbol;
      } else if (machineType === 'nfa' || machineType === 'enfa') {
        from = r.state;
        const targets = Array.isArray(r.next) ? r.next : [r.next];
        targets.forEach(t => {
          const k = `${from}->${t}`;
          if (!edges[k]) edges[k] = { from, to: t, labels: [] };
          edges[k].labels.push(r.symbol === '' ? 'ε' : r.symbol);
        });
        return;
      } else if (machineType === 'pda') {
        from = r.state; to = r.next;
        const inp = r.input === '' ? 'ε' : r.input;
        const pop = r.pop === '' ? 'ε' : r.pop;
        const push = (r.push && r.push.length) ? r.push.join('') : 'ε';
        label = `${inp},${pop}/${push}`;
      } else if (machineType === 'tm') {
        from = r.state; to = r.next;
        label = `${r.read}→${r.write},${r.move}`;
      }
      const k = `${from}->${to}`;
      if (!edges[k]) edges[k] = { from, to, labels: [] };
      edges[k].labels.push(label);
    });
    return Object.values(edges);
  }

  function render(containerId, def, activeStates, activeRule) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const states = def.states;
    const { positions, w, h } = layoutStates(states);
    const svgW = w + PAD * 2;
    const svgH = h + PAD * 2;

    const edges = buildEdges(def.transitions, def.type);

    const esc = (text) => String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    const splitLabel = (label) => {
      const txt = String(label);
      if (txt.length <= 18 || !txt.includes(', ')) return [txt];
      const parts = txt.split(', ');
      if (parts.length < 2) return [txt];
      const mid = Math.ceil(parts.length / 2);
      return [parts.slice(0, mid).join(', '), parts.slice(mid).join(', ')];
    };

    const labelMarkup = (x, y, label, isActive) => {
      const lines = splitLabel(label);
      const lineHeight = 11.5;
      const startY = y - ((lines.length - 1) * lineHeight) / 2;
      const color = isActive ? '#1d4ed8' : '#334155';
      const tspans = lines
        .map((line, i) => `<tspan x="${x}" y="${startY + i * lineHeight}">${esc(line)}</tspan>`)
        .join('');
      return `<text text-anchor="middle" font-size="11.5" font-weight="700" fill="${color}" stroke="#f8fafc" stroke-width="4" paint-order="stroke">${tspans}</text>`;
    };

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}">
<defs>
  <marker id="arr" markerWidth="8" markerHeight="8" refX="8" refY="3" orient="auto">
    <path d="M0,0 L0,6 L8,3 z" fill="#64748b"/>
  </marker>
  <marker id="arr-active" markerWidth="8" markerHeight="8" refX="8" refY="3" orient="auto">
    <path d="M0,0 L0,6 L8,3 z" fill="#1d4ed8"/>
  </marker>
</defs>`;

    // Draw start arrow
    const startState = def.startState;
    if (positions[startState]) {
      const p = positions[startState];
      svg += `<line x1="${p.x - NODE_R - 34}" y1="${p.y}" x2="${p.x - NODE_R - 4}" y2="${p.y}" stroke="#64748b" stroke-width="1.7" marker-end="url(#arr)"/>`;
    }

    // Determine active edge key
    let activeEdgeKey = null;
    if (activeRule) {
      if (def.type === 'dfa') activeEdgeKey = `${activeRule.state}->${activeRule.next}`;
      else if (def.type === 'nfa' || def.type === 'enfa') {
        // highlight all edges from active rule's state
        activeEdgeKey = activeRule.state;
      } else if (def.type === 'pda') activeEdgeKey = `${activeRule.state}->${activeRule.next}`;
      else if (def.type === 'tm') activeEdgeKey = `${activeRule.state}->${activeRule.next}`;
    }

    // Draw edges
    edges.forEach(edge => {
      const fp = positions[edge.from];
      const tp = positions[edge.to];
      if (!fp || !tp) return;

      const isActive = activeRule && (
        (def.type === 'dfa' && `${edge.from}->${edge.to}` === activeEdgeKey) ||
        (def.type === 'pda' && `${edge.from}->${edge.to}` === activeEdgeKey) ||
        (def.type === 'tm' && `${edge.from}->${edge.to}` === activeEdgeKey) ||
        ((def.type === 'nfa' || def.type === 'enfa') && edge.from === activeEdgeKey)
      );

      const color = isActive ? '#1d4ed8' : '#64748b';
      const marker = isActive ? 'url(#arr-active)' : 'url(#arr)';
      const labelText = edge.labels.join(', ');

      if (edge.from === edge.to) {
        // Self-loop
        const cx = fp.x, cy = fp.y - NODE_R;
        svg += `<path d="M${cx-16},${cy} C${cx-44},${cy-56} ${cx+44},${cy-56} ${cx+16},${cy}" stroke="${color}" stroke-width="${isActive?3:1.8}" fill="none" marker-end="${marker}"/>`;
        svg += labelMarkup(cx, cy - 44, labelText, isActive);
      } else {
        // Check for reverse edge (need curved)
        const reverseExists = edges.some(e => e.from === edge.to && e.to === edge.from);
        const dx = tp.x - fp.x, dy = tp.y - fp.y;
        const len = Math.sqrt(dx*dx + dy*dy);
        const ux = dx/len, uy = dy/len;
        // Start/end at node circumference
        const sx = fp.x + ux * NODE_R;
        const sy = fp.y + uy * NODE_R;
        const ex = tp.x - ux * NODE_R;
        const ey = tp.y - uy * NODE_R;

        if (reverseExists) {
          // Offset curve
          const perp = 30;
          const px = -uy * perp, py = ux * perp;
          const mx = (sx+ex)/2 + px, my = (sy+ey)/2 + py;
          svg += `<path d="M${sx},${sy} Q${mx},${my} ${ex},${ey}" stroke="${color}" stroke-width="${isActive?3:1.8}" fill="none" marker-end="${marker}"/>`;
          const lx = (sx + 2*mx + ex)/4, ly = (sy + 2*my + ey)/4;
          svg += labelMarkup(lx + px*0.35, ly + py*0.35, labelText, isActive);
        } else {
          svg += `<line x1="${sx}" y1="${sy}" x2="${ex}" y2="${ey}" stroke="${color}" stroke-width="${isActive?3:1.8}" marker-end="${marker}"/>`;
          const mx = (sx+ex)/2, my = (sy+ey)/2;
          const px = -uy * 14, py = ux * 14;
          svg += labelMarkup(mx + px, my + py, labelText, isActive);
        }
      }
    });

    // Draw states
    states.forEach(s => {
      const p = positions[s];
      const isActive = Array.isArray(activeStates) ? activeStates.includes(s) : activeStates === s;
      const isAccept = def.acceptStates.includes(s);
      const nodeColor = isActive ? 'rgba(29,78,216,0.1)' : '#ffffff';
      const strokeColor = isActive ? '#1d4ed8' : (isAccept ? '#0f766e' : '#94a3b8');
      const strokeW = isActive ? 2.5 : 2;
      const glow = isActive ? `filter: drop-shadow(0 0 6px rgba(29,78,216,0.22));` : '';

      svg += `<g class="state-node" style="${glow}">`;
      if (isAccept) {
        svg += `<circle cx="${p.x}" cy="${p.y}" r="${NODE_R + 5}" fill="none" stroke="${isActive ? '#1d4ed8' : '#0f766e'}" stroke-width="1.5"/>`;
      }
      svg += `<circle cx="${p.x}" cy="${p.y}" r="${NODE_R}" fill="${nodeColor}" stroke="${strokeColor}" stroke-width="${strokeW}"/>`;
      svg += `<text x="${p.x}" y="${p.y}" text-anchor="middle" dominant-baseline="middle" font-size="12.5" font-weight="750" fill="${isActive ? '#1e3a8a' : '#0f172a'}" font-family="'Manrope', 'Segoe UI', sans-serif">${esc(s)}</text>`;
      svg += `</g>`;
    });

    svg += `</svg>`;
    container.innerHTML = svg;
  }

  return { render };
})();

window.DIAGRAM = DIAGRAM;
