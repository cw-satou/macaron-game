// マカロンゲームのスキルツリー(仕様書 第2段階①。2026-11-08本人「爆弾の威力n倍とかスキルツリーをみたい」「アイテムみたいな見せ方じゃなくて地図でスキルツリーの形で見せたい」)
// ・シュガーで買う。シュガーはステージをクリアするたびにもらえる。強化はそのランだけ(ゲームオーバーで消える)
// ・根から5本の枝に分かれ、手前のノードを1つ以上取ると奥が開く
// ・ノードは {id, parent, ic, name, max, cost[], desc(lv), x, y} の配列で持ち、足しやすくする。x, y は図の上の位置(幅340・高さ460)
// ・数値は私の仮置き(本人未確認)

export const NODES = [
  {id:'root', parent:null, ic:'🧁', name:'パティシエ見習い', max:1, cost:[0], desc:() => 'ここから枝をのばそう', x:170, y:425},

  // 爆発の枝
  {id:'bombPow',   parent:'root',    ic:'💣', name:'ばくだんの威力', max:4, cost:[3, 5, 8, 12], desc:l => `爆発で消した点 ×${2 + l}`, x:46, y:330},
  {id:'bombReach', parent:'bombPow', ic:'💥', name:'大きな爆風',     max:3, cost:[4, 7, 11],    desc:l => `爆発の範囲 +${25*l}%`,   x:30, y:225},
  {id:'bombRate',  parent:'bombReach', ic:'🧨', name:'火薬だな',     max:2, cost:[6, 10],       desc:l => `棚にばくだんが出やすい +${8*l}%`, x:46, y:120},

  // 得点の枝
  {id:'scoreMul', parent:'root',     ic:'⭐', name:'星の砂糖',     max:5, cost:[3, 5, 8, 12, 18], desc:l => `すべての点 ×${1 + .5*l}`, x:108, y:300},
  {id:'comboUp',  parent:'scoreMul', ic:'🔗', name:'コンボの魔法', max:3, cost:[5, 9, 14],       desc:l => `コンボ1つごとに点 +${10*l}%`, x:100, y:195},
  {id:'sugarUp',  parent:'comboUp',  ic:'🍯', name:'シュガーの壺', max:2, cost:[6, 12],          desc:l => `クリアでもらうシュガー +${2*l}`, x:110, y:90},

  // 時間とフィーバーの枝
  {id:'hourglass', parent:'root',      ic:'⏳', name:'砂時計',       max:2, cost:[4, 8],  desc:l => `次のステージから時間 +${10*l}秒`, x:170, y:285},
  {id:'feverLong', parent:'hourglass', ic:'🥁', name:'お祭りの太鼓', max:2, cost:[5, 9],  desc:l => `フィーバーが +${4*l}秒長い`, x:170, y:180},
  {id:'feverMul',  parent:'feverLong', ic:'🌈', name:'虹のフィーバー', max:2, cost:[8, 14], desc:l => `フィーバー中の点 ×${2 + l}`, x:170, y:75},

  // 素材の枝
  {id:'tongs',    parent:'root',  ic:'✨', name:'金のトング', max:1, cost:[6],        desc:() => '次のステージから、始めにマカロンラッシュ', x:232, y:300},
  {id:'bigShelf', parent:'tongs', ic:'🥚', name:'上等な生地', max:3, cost:[5, 9, 14], desc:l => `棚に1つ上の段階が出る +${15*l}%`, x:240, y:195},

  // ノルマの枝
  {id:'whisk', parent:'root', ic:'🥣', name:'ふるい', max:3, cost:[4, 7, 11], desc:l => `ノルマ -${10*l}%`, x:294, y:330},
];
const byId = Object.fromEntries(NODES.map(n => [n.id, n]));

// そのランの持ち物
export const run = {sugar:0, lv:{root:1}};
export const lv = id => run.lv[id] || 0;
export function resetRun(){ run.sugar = 0; run.lv = {root:1} }
export const isOpen = n => !n.parent || lv(n.parent) > 0;
export const nextCost = n => lv(n.id) < n.max ? n.cost[lv(n.id)] : null;
export function buy(id){
  const n = byId[id], c = nextCost(n);
  if(c == null || !isOpen(n) || run.sugar < c) return false;
  run.sugar -= c; run.lv[id] = lv(id) + 1; return true;
}

// 効き目(index.html から読む)
export const fx = {
  scoreMul:  () => 1 + .5*lv('scoreMul'),
  comboRate: () => .1*lv('comboUp'),
  bombMul:   () => 2 + lv('bombPow'),
  bombReach: () => 1 + .25*lv('bombReach'),
  bombRate:  () => .08*lv('bombRate'),
  extraSec:  () => 10*lv('hourglass'),
  feverSec:  () => 4*lv('feverLong'),
  feverMul:  () => 2 + lv('feverMul'),
  rushStart: () => lv('tongs') > 0,
  upShelf:   () => .15*lv('bigShelf'),
  quotaRate: () => 1 - .1*lv('whisk'),
  sugarPlus: () => 2*lv('sugarUp'),
};

// 図を描く。svg=描く先、info=選んだノードの説明を出す箱、onBuy=買ったあとに呼ぶ
let picked = 'bombPow';
export function draw(svg, info, onBuy){
  const NS = 'http://www.w3.org/2000/svg', el = (t, a) => { const e = document.createElementNS(NS, t); for(const k in a) e.setAttribute(k, a[k]); return e };
  svg.innerHTML = '';
  // 枝(親から子へ、ゆるい曲線)
  for(const n of NODES) if(n.parent){
    const p = byId[n.parent], my = (p.y + n.y)/2;
    svg.append(el('path', {d:`M${p.x},${p.y} C${p.x},${my} ${n.x},${my} ${n.x},${n.y}`, class:'edge' + (lv(n.id) ? ' got' : isOpen(n) ? ' open' : '')}));
  }
  for(const n of NODES){
    const l = lv(n.id), c = nextCost(n), can = c != null && isOpen(n) && run.sugar >= c;
    const g = el('g', {class:'node' + (l ? ' got' : '') + (isOpen(n) ? '' : ' lock') + (can ? ' can' : '') + (n.id === picked ? ' pick' : ''),
      transform:`translate(${n.x},${n.y})`, tabindex:0, role:'button', 'aria-label':n.name});
    g.append(el('circle', {r:n.id === 'root' ? 26 : 22}));
    const ic = el('text', {class:'ic', y:8}); ic.textContent = isOpen(n) ? n.ic : '🔒'; g.append(ic);
    if(n.id !== 'root'){
      const t = el('text', {class:'lvl', y:38}); t.textContent = `${l}/${n.max}`; g.append(t);
    }
    g.onclick = () => { picked = n.id; draw(svg, info, onBuy) };
    svg.append(g);
  }
  // 説明と買うボタン
  const n = byId[picked], l = lv(n.id), c = nextCost(n);
  const now = l ? `いま: ${n.desc(l)}` : 'まだ持っていません';
  const nxt = c != null ? `次: ${n.desc(l + 1)}` : 'これ以上は上がりません';
  info.innerHTML = `<b>${n.ic} ${n.name}</b><span>${now}<br>${nxt}</span>`;
  if(c != null && n.id !== 'root'){
    const bt = document.createElement('button'); bt.className = 'btn';
    bt.textContent = !isOpen(n) ? '手前の枝を先に' : `シュガー${c}で上げる`;
    bt.disabled = !isOpen(n) || run.sugar < c;
    bt.onclick = () => { if(buy(n.id)){ onBuy && onBuy(n); draw(svg, info, onBuy) } };
    info.append(bt);
  }
}
