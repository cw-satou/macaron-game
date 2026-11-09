// マカロンゲームのスキルツリー(仕様書 第2段階①。2026-11-08本人「爆弾の威力n倍とかスキルツリーをみたい」「アイテムみたいな見せ方じゃなくて地図でスキルツリーの形で見せたい」)
// ・シュガーで買う。シュガーはステージをクリアするたびにもらえる。強化はそのランだけ(ゲームオーバーで消える)
// ・根から6本の枝(ばくだん・じしん・まほう・フィーバー・とくてん・じどう)に分かれ、手前のノードを1つ以上取ると奥が開く
// ・「技」(tech:true)は買うと画面の下にボタンが出て、1ステージに1回押して使える(2026-11-09本人「1ステージ自動落下とか地震とかマジカルマカロンとかフィーバータイムが発生するとか、スキルツリーをもっと見直して」)
// ・ノードは {id, parent, ic, name, max, cost[], desc(lv), x, y, tech?} の配列で持ち、足しやすくする。x, y は図の上の位置(幅340・高さ460)
// ・数値は私の仮置き(本人未確認)

const COL = [30, 86, 142, 198, 254, 310];   // 6本の枝の横位置
export const BRANCHES = ['ばくだん', 'じしん', 'まほう', 'フィーバー', 'とくてん', 'じどう'];
const QUAKE_SEC = [0, 3, 4.5, 6], MAGIC_N = [0, 3, 5, 8], AUTO_SEC = [0, 15, 30, Infinity];

export const NODES = [
  {id:'root', parent:null, ic:'🧁', name:'パティシエ見習い', max:1, cost:[0], desc:() => 'ここから枝をのばそう', x:170, y:425},

  // ばくだん
  {id:'bombPow',   parent:'root',      ic:'💣', name:'ばくだんの威力', max:4, cost:[3, 5, 8, 12], desc:l => `爆発で消した点 ×${2 + l}`, x:COL[0], y:330},
  {id:'bombReach', parent:'bombPow',   ic:'💥', name:'大きな爆風',     max:3, cost:[4, 7, 11],    desc:l => `爆発の範囲 +${25*l}%`,   x:COL[0], y:225},
  {id:'bombRate',  parent:'bombReach', ic:'🧨', name:'火薬だな',       max:2, cost:[6, 10],       desc:l => `ばくだんが1ステージに +${l}個`, x:COL[0], y:120},

  // じしん(技): 箱を揺らしながら、同じマカロンどうしを引き寄せる
  {id:'quake',      parent:'root',  ic:'🌋', name:'じしん',       max:3, cost:[5, 8, 12], tech:true, desc:l => `【技】${QUAKE_SEC[l]}秒ゆれて、同じマカロンが寄り合う`, x:COL[1], y:310},
  {id:'quakeTwice', parent:'quake', ic:'〰️', name:'よしん',       max:1, cost:[10],        desc:() => 'じしんを1ステージに2回使える', x:COL[1], y:205},

  // まほう(技): 箱の中のマカロンの真上に、同じマカロンが降ってくる
  {id:'magic',    parent:'root',     ic:'🪄', name:'マジカルマカロン', max:3, cost:[5, 8, 12], tech:true, desc:l => `【技】箱のマカロン${MAGIC_N[l]}個の真上に、同じマカロンが降る`, x:COL[2], y:300},
  {id:'bigShelf', parent:'magic',    ic:'🥚', name:'上等な生地',       max:3, cost:[5, 9, 14], desc:l => `棚に1つ上の段階が出る +${15*l}%`, x:COL[2], y:195},
  {id:'tongs',    parent:'bigShelf', ic:'✨', name:'金のトング',       max:1, cost:[8],        desc:() => '次のステージから、始めにマカロンラッシュ', x:COL[2], y:90},

  // フィーバー
  {id:'feverNow',  parent:'root',      ic:'🎉', name:'フィーバータイム', max:1, cost:[6],    tech:true, desc:() => '【技】すぐにフィーバーが始まる', x:COL[3], y:300},
  {id:'feverLong', parent:'feverNow',  ic:'🥁', name:'お祭りの太鼓',     max:2, cost:[5, 9],  desc:l => `フィーバーが +${4*l}秒長い`, x:COL[3], y:195},
  {id:'feverMul',  parent:'feverLong', ic:'🌈', name:'虹のフィーバー',   max:2, cost:[8, 14], desc:l => `フィーバー中の点 ×${2 + l}`, x:COL[3], y:90},

  // とくてん
  {id:'scoreMul', parent:'root',     ic:'⭐', name:'星の砂糖',     max:5, cost:[3, 5, 8, 12, 18], desc:l => `すべての点 ×${1 + .5*l}`, x:COL[4], y:310},
  {id:'comboUp',  parent:'scoreMul', ic:'🔗', name:'コンボの魔法', max:3, cost:[5, 9, 14],       desc:l => `コンボ1つごとに点 +${10*l}%`, x:COL[4], y:205},
  {id:'sugarUp',  parent:'comboUp',  ic:'🍯', name:'シュガーの壺', max:2, cost:[6, 12],          desc:l => `クリアでもらうシュガー +${2*l}`, x:COL[4], y:100},

  // じどう: 時間とノルマをゆるめ、奥で自動パティシエ(技)
  {id:'hourglass', parent:'root',      ic:'⏳', name:'砂時計',         max:2, cost:[4, 8],      desc:l => `次のステージから時間 +${10*l}秒`, x:COL[5], y:330},
  {id:'whisk',     parent:'hourglass', ic:'🥣', name:'ふるい',         max:3, cost:[4, 7, 11],  desc:l => `ノルマ -${10*l}%`, x:COL[5], y:225},
  {id:'auto',      parent:'whisk',     ic:'🤖', name:'自動パティシエ', max:3, cost:[8, 12, 18], tech:true,
    desc:l => `【技】${AUTO_SEC[l] === Infinity ? 'そのステージの終わりまで' : AUTO_SEC[l] + '秒'}、同じ種類の上へ自動で落とす`, x:COL[5], y:120},
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
  bombStock: () => lv('bombRate'),   // ばくだんは💣ボタンで落とす形になったので、出やすさではなく個数を足す(2026-11-09)
  extraSec:  () => 10*lv('hourglass'),
  feverSec:  () => 4*lv('feverLong'),
  feverMul:  () => 2 + lv('feverMul'),
  rushStart: () => lv('tongs') > 0,
  upShelf:   () => .15*lv('bigShelf'),
  quotaRate: () => 1 - .1*lv('whisk'),
  sugarPlus: () => 2*lv('sugarUp'),
  // 技
  quakeSec:  () => QUAKE_SEC[lv('quake')],
  quakeUses: () => lv('quakeTwice') ? 2 : 1,
  magicN:    () => MAGIC_N[lv('magic')],
  autoSec:   () => AUTO_SEC[lv('auto')],
};
// 持っている技(画面の下のボタンにする)
export const techs = () => NODES.filter(n => n.tech && lv(n.id) > 0);

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
  // 枝の名前(上の端)
  BRANCHES.forEach((b, i) => { const t = el('text', {class:'branch', x:COL[i], y:34}); t.textContent = b; svg.append(t) });
  for(const n of NODES){
    const l = lv(n.id), c = nextCost(n), can = c != null && isOpen(n) && run.sugar >= c;
    const g = el('g', {class:'node' + (n.tech ? ' tech' : '') + (l ? ' got' : '') + (isOpen(n) ? '' : ' lock') + (can ? ' can' : '') + (n.id === picked ? ' pick' : ''),
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
