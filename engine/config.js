// Full-mock gate. Shared-key unlock: the checkout redirect goes to index.html?key=<KEY>&level=n4
// ponytail: one shared key per level; per-order licenses once sales justify it.
const UNLOCK_KEYS={n5:'vn0yt908jfgc',n4:'6uni4rm3c116'};
const PAID_GATE=async({level})=>{
  const k='jlptmock:unlock:'+level;
  try{
    const key=new URLSearchParams(location.search).get('key')||(location.hash.slice(1).split('-')[2]||null); // artifact viewer: #n4-full-<KEY>
    if(key&&UNLOCK_KEYS[level]===key)localStorage.setItem(k,'1');
    return localStorage.getItem(k)==='1';
  }catch(e){return !!UNLOCK_KEYS[level]&&(new URLSearchParams(location.search).get('key')||location.hash.slice(1).split('-')[2])===UNLOCK_KEYS[level]}
};
// Link target of the "Full mock + explanations" box on the mini result screen.
const CTA_URL='buy/index.html';
