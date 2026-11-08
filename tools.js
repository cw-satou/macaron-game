// パティシエの道具(2026-11-09本人「ゲームオーバーになったあとにパティシエの道具としてホイッパーとか金のボウルとか計量カップとか強力なアイテムを購入できるようにして欲しい。
// クリアしたステージ数に応じてメダルをもらい道具を買える」)
// ・メダル=ゲームオーバー(ここで終える を含む)までにクリアしたステージ数。この端末(localStorage)に貯まる
// ・道具は一度買えばずっと効く(スキルツリーはそのランだけ。道具はランをまたいで残る)
// ・前のアイテム交換で貯めた「面数」(yuki-macaron-bag-v1 の pts)は、同じ数え方なのでメダルとして引き継ぐ
// ・中身と値段は私の仮置き(本人未確認)

const KEY = 'yuki-macaron-tools-v1', OLD_KEY = 'yuki-macaron-bag-v1';

export const TOOLS = [
  {id:'whipper',  ic:'🥄', name:'ホイッパー',     cost:3,  desc:'すべての点 ×1.5'},
  {id:'cup',      ic:'🥛', name:'計量カップ',     cost:5,  desc:'ノルマ -15%'},
  {id:'pin',      ic:'🪵', name:'めん棒',         cost:6,  desc:'どのステージも時間 +10秒'},
  {id:'goldBowl', ic:'🏆', name:'金のボウル',     cost:8,  desc:'シュガー10個を持って始まる'},
  {id:'mitt',     ic:'🧤', name:'オーブンミット', cost:10, desc:'ばくだんの威力 +2'},
  {id:'piping',   ic:'🍦', name:'絞り袋',         cost:12, desc:'どの種類も Lv.3 から始まる'},
  {id:'oven',     ic:'🔥', name:'金のオーブン',   cost:20, desc:'すべての点 ×2(ホイッパーと重なる)'},
];

export function load(){
  let s; try{ s = JSON.parse(localStorage.getItem(KEY)) }catch(e){}
  if(!s || typeof s !== 'object'){
    // はじめて開いたとき: 前のアイテム交換の面数をメダルとして引き継ぐ(前の記録は消さない)
    let old; try{ old = JSON.parse(localStorage.getItem(OLD_KEY)) }catch(e){}
    s = {medals: Math.max(0, (old && old.pts)|0), own:{}};
    save(s);
  }
  return {medals: Math.max(0, s.medals|0), own: Object.assign({}, s.own)};
}
export function save(s){ localStorage.setItem(KEY, JSON.stringify(s)) }
export const has = id => !!load().own[id];
export function addMedals(n){ const s = load(); s.medals += n; save(s); return s.medals }
export function buy(id){
  const s = load(), t = TOOLS.find(t => t.id === id);
  if(!t || s.own[id] || s.medals < t.cost) return false;
  s.medals -= t.cost; s.own[id] = true; save(s); return true;
}

// 効き目(index.html から読む)
export const fx = {
  scoreMul:   () => (has('whipper') ? 1.5 : 1) * (has('oven') ? 2 : 1),
  quotaRate:  () => has('cup') ? .85 : 1,
  extraSec:   () => has('pin') ? 10 : 0,
  startSugar: () => has('goldBowl') ? 10 : 0,
  bombPlus:   () => has('mitt') ? 2 : 0,
  startLv:    () => has('piping') ? 3 : 1,
};

// 道具の棚を描く。list=並べる先、onBuy=買ったあと
export function draw(list, medalEl, onBuy){
  const s = load();
  medalEl.textContent = s.medals;
  list.innerHTML = '';
  for(const t of TOOLS){
    const own = !!s.own[t.id], li = document.createElement('li');
    li.className = 'tool' + (own ? ' own' : '');
    li.innerHTML = `<span class="ic">${t.ic}</span><b>${t.name}</b><span class="tx">${t.desc}</span>`;
    const bt = document.createElement('button'); bt.className = 'btn';
    bt.textContent = own ? '持っている' : `メダル${t.cost}`;
    bt.disabled = own || s.medals < t.cost;
    bt.onclick = () => { if(buy(t.id)){ onBuy && onBuy(t); draw(list, medalEl, onBuy) } };
    li.append(bt); list.append(li);
  }
}
