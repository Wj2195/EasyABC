/* Evergrove v0.12: Mouse run matches Shift + Arrow Keys pathfinding for PC. No backend required. */
(() => {
  'use strict';
  const api = window.EvergroveNavGame;
  if (!api) return;
  const { canvas, ctx, homes, npcs } = api;
  let route = [], destination = null, action = null, previous = null;
  const isPc = () => matchMedia('(hover: hover) and (pointer: fine)').matches;
  const valid = (x, y) => x >= 0 && y >= 0 && x < api.MW && y < api.MH;
  const canStand = (x, y) => valid(x, y) && !api.blocked(x + .5, y + .5);
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const cancel = () => { route = []; destination = null; action = null; previous = null; };
  const tileIndex = (x, y) => y * api.MW + x;
  function calculate(target) {
    const p = api.player(), sx = Math.floor(p.x), sy = Math.floor(p.y);
    if (!valid(sx, sy)) return null;
    const length = api.MW * api.MH, parent = new Int32Array(length);
    const visited = new Uint8Array(length), queue = new Int32Array(length);
    parent.fill(-1);
    let head = 0, tail = 1;
    const start = tileIndex(sx, sy);
    queue[0] = start; visited[start] = 1;
    let best = start, bestScore = Infinity;
    const tx = Math.floor(target.x), ty = Math.floor(target.y);
    while (head < tail) {
      const index = queue[head++], x = index % api.MW, y = Math.floor(index / api.MW);
      const score = (x - tx) ** 2 + (y - ty) ** 2;
      if (score < bestScore) { bestScore = score; best = index; }
      if (!score && canStand(x, y)) { best = index; break; }
      for (const [dx, dy] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (!valid(nx, ny)) continue;
        const ni = tileIndex(nx, ny);
        if (visited[ni] || !canStand(nx, ny)) continue;
        visited[ni] = 1; parent[ni] = index; queue[tail++] = ni;
      }
    }
    if (best === start && distance(p, target) > 1.15) return null;
    const cells = [];
    for (let at = best; at !== start && at >= 0; at = parent[at]) {
      cells.push({ x: (at % api.MW) + .5, y: Math.floor(at / api.MW) + .5 });
    }
    cells.reverse();
    if (!cells.length) cells.push({ x: sx + .5, y: sy + .5 });
    const nearest = cells[cells.length - 1];
    return { cells, nearest, exact: bestScore === 0 };
  }
  function finish() {
    const intent = action, target = destination;
    cancel();
    if (!intent || !target || api.modal()) return;
    const p = api.player();
    if (distance(p, target) > (intent.type === 'npc' ? 1.8 : 2.3)) return;
    if (intent.type === 'npc') api.openNPC(intent.id);
    if (intent.type === 'home') api.openHome(intent.id);
  }
  function go(target, intent) {
    cancel();
    if (api.modal()) return;
    const computed = calculate(target);
    if (!computed) { api.notify('No clear path to that location.'); return; }
    route = computed.cells;
    destination = target;
    action = intent || null;
    if (!computed.exact && !intent && distance(computed.nearest, target) > 2)
      api.notify('That area is blocked. Walking to the nearest reachable spot.');
    if (action && distance(api.player(), target) < (action.type === 'npc' ? 1.45 : 1.65)) finish();
  }
  function step(dt) {
    if (!route.length) return;
    if (api.modal() || !isPc()) { cancel(); return; }
    const p = api.player();
    if (previous && distance(p, previous) > 2) { cancel(); return; }
    const intentRange = action?.type === 'npc' ? 1.45 : action?.type === 'home' ? 1.65 : 0;
    if (action && distance(p, destination) <= intentRange) { finish(); return; }
    const goal = route[0], dx = goal.x - p.x, dy = goal.y - p.y, d = Math.hypot(dx, dy);
    if (d < .055) { route.shift(); if (!route.length) finish(); return; }
    const speed = 4.7, amount = Math.min(d, speed * Math.min(dt, .05));
    const nx = p.x + dx / d * amount, ny = p.y + dy / d * amount;
    const oldX = p.x, oldY = p.y;
    if (!api.blocked(nx, p.y)) p.x = nx;
    if (!api.blocked(p.x, ny)) p.y = ny;
    if (Math.abs(p.x - oldX) + Math.abs(p.y - oldY) < 0.00001) { cancel(); api.notify('Path blocked. Select a different spot.'); return; }
    p.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
    previous = { x: p.x, y: p.y };
  }
  function draw() {
    if (!route.length || !destination || !isPc()) return;
    const { x: cx, y: cy } = api.camera();
    ctx.save();
    ctx.strokeStyle = '#fce6a3';ctx.lineWidth = 3;
    ctx.setLineDash([7, 8]);ctx.beginPath();
    const p = api.player();ctx.moveTo(p.x * api.T - cx, p.y * api.T - cy);
    for (const spot of route) ctx.lineTo(spot.x * api.T - cx, spot.y * api.T - cy);
    ctx.stroke();ctx.setLineDash([]);
    const spot = route[route.length - 1];
    const sx = spot.x * api.T - cx, sy = spot.y * api.T - cy;
    ctx.strokeStyle = '#f9eda7';ctx.lineWidth = 3;
    ctx.beginPath();ctx.arc(sx, sy, 9 + Math.sin(performance.now() / 160) * 2, 0, Math.PI * 2);ctx.stroke();
    ctx.restore();
  }
  document.addEventListener('click', event => {
    if (!isPc() || event.target !== canvas || api.modal() || window.EvergroveExpansion?.active() || event.detail === 0) return;
    event.preventDefault(); event.stopImmediatePropagation();
    const rect = canvas.getBoundingClientRect(), cam = api.camera();
    const px = (event.clientX - rect.left) / rect.width * canvas.width + cam.x;
    const py = (event.clientY - rect.top) / rect.height * canvas.height + cam.y;
    const x = Math.floor(px / api.T), y = Math.floor(py / api.T);
    if (!valid(x, y)) return;
    if (event.shiftKey) { cancel(); api.useTool(x, y); return; }
    const npc = npcs.find(n => n.x === x && n.y === y);
    if (npc) { go({x:npc.x+.5,y:npc.y+.5}, {type:'npc',id:npc.id}); return; }
    const building = homes.find(h => x >= h.x && x < h.x+h.w && y >= h.y && y <= h.y + h.h);
    if (building) { go(api.door(building), {type:'home',id:building.id}); return; }
    go({ x: x + .5, y: y + .5 }, null);
  }, true);
  document.addEventListener('keydown', e => {
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code) && !api.modal()) cancel();
  }, true);
  document.querySelector('.desktop-key-guide .key-guide-foot')?.insertAdjacentHTML('afterend','<div class="key-guide-foot">🖱 Click: Run · Right-Click: Back / Stop · Shift+Click: Tool</div>');
  window.EvergroveNavigation = { step, draw, cancel, go, getStatus: () => ({walking:route.length>0,waypoints:route.length,destination}) };
})();