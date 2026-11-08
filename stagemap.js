// ステージのマップ(2026-11-08本人「ステージも一覧じゃなくてホントのマップ形式で見せたい」)
// 5ステージで1つの地方。地方の名前は仕様書の「お菓子の国の地図」の8地方から取る(地図の100マスとは別の画面)
// 区切りの画面では、いま通ってきた地方と、次の地方の2つを、下から上へ曲がりくねる道で見せる

export const REGIONS = [
  {name:'ミントの森',       ic:'🌿', bg:'#dff5ea', road:'#9fe3c8'},
  {name:'レモン渓谷',       ic:'🍋', bg:'#fff6c8', road:'#f2d65c'},
  {name:'ラベンダー高原',   ic:'💜', bg:'#efe6fb', road:'#c3abe9'},
  {name:'チョコレート山脈', ic:'🍫', bg:'#f1e2d6', road:'#b98564'},
  {name:'キャラメル砂漠',   ic:'🐪', bg:'#fbead2', road:'#e3b36e'},
  {name:'バニラ雪原',       ic:'❄️', bg:'#f4f7ff', road:'#cdd8f0'},
  {name:'いちご城',         ic:'🏰', bg:'#ffe3ec', road:'#ff9bb8'},
  {name:'星の湖',           ic:'⭐', bg:'#e3e8ff', road:'#9fb0f0'},
];
export const regionOf = (stage, per) => REGIONS[Math.floor((stage - 1)/per) % REGIONS.length];

// svg=描く先 / opts={stage(次に遊ぶ番号), per(1地方のステージ数), log(クリアした{got,q}の配列), quota(n), marks({番号:'💣 ばくだん'})}
export function drawMap(svg, {stage, per, log, quota, marks = {}}){
  const NS = 'http://www.w3.org/2000/svg', el = (t, a, txt) => { const e = document.createElementNS(NS, t); for(const k in a) e.setAttribute(k, a[k]); if(txt != null) e.textContent = txt; return e };
  svg.innerHTML = '';
  const W = 340, H = 540, first = Math.max(1, stage - per);   // 通ってきた地方の最初のステージ
  const n = per*2, gap = (H - 104)/(n - 1);   // 上は地方の名前を置くぶん空ける
  // 道の上の位置: 下から上へ、左右に大きく曲がる
  const pos = i => ({x: W/2 + Math.sin(i*1.05 + .4)*110, y: H - 40 - i*gap});
  // 地方ごとの背景の帯と名前
  for(let r = 0; r < 2; r++){
    const s0 = first + r*per, reg = regionOf(s0, per), h = H/2;
    svg.append(el('rect', {x:0, y:H/2 - r*H/2, width:W, height:h, fill:reg.bg}));
    for(let k = 0; k < 5; k++) svg.append(el('text', {class:'deco', x:30 + ((k*67 + r*40) % 290), y:H/2 - r*H/2 + 40 + ((k*97) % (h - 70))}, reg.ic));
    // 地方の名前は帯の右上(道は右上を通らない)
    svg.append(el('text', {class:'region', x:W - 12, y:H/2 - r*H/2 + 24, 'text-anchor':'end'}, `${reg.ic} ${reg.name}`));
  }
  // 道(太い帯の上に、点線の中心線)
  let d = '';
  for(let i = 0; i < n; i++){
    const p = pos(i);
    if(!i){ d = `M${p.x},${p.y}`; continue }
    const q = pos(i - 1), my = (p.y + q.y)/2;
    d += ` C${q.x},${my} ${p.x},${my} ${p.x},${p.y}`;
  }
  svg.append(el('path', {d, class:'road'}));
  svg.append(el('path', {d, class:'roadLine'}));
  // ステージの印
  for(let i = 0; i < n; i++){
    const s = first + i, p = pos(i), done = s < stage, next = s === stage, boss = s % per === 0;
    const g = el('g', {class:'stop' + (done ? ' done' : next ? ' next' : ' lock') + (boss ? ' boss' : ''), transform:`translate(${p.x},${p.y})`});
    g.append(el('circle', {r:boss ? 21 : 17}));
    g.append(el('text', {class:'num', y:6}, done ? '✓' : s));
    const side = p.x > W/2 ? -1 : 1, tx = side*(boss ? 30 : 26);
    const label = done ? `${log[s - 1].got.toLocaleString()}点` : `ノルマ${quota(s).toLocaleString()}`;
    g.append(el('text', {class:'cap', x:tx, y:-2, 'text-anchor':side > 0 ? 'start' : 'end'}, `ステージ${s}`));
    g.append(el('text', {class:'sub', x:tx, y:14, 'text-anchor':side > 0 ? 'start' : 'end'}, marks[s] ? `${label} ${marks[s]}` : label));
    if(next) g.append(el('text', {class:'here', y:-24}, '☁️'));
    svg.append(g);
  }
}
