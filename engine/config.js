// Full-mock gate. Shared-key unlock: Stripe's after-payment redirect goes to buy/thanks.html?level=n4&key=<KEY> (level n5|n4|both)
// ponytail: one shared key per level; per-order licenses once sales justify it.
const UNLOCK_KEYS={n5:'vn0yt908jfgc',n4:'6uni4rm3c116',both:'a7m94w2dafp4'}; // both = unlocks n5 and n4
const PAID_GATE=async({level})=>{
  const k='jlptmock:unlock:'+level;
  try{
    const key=new URLSearchParams(location.search).get('key')||(location.hash.slice(1).split('-')[2]||null); // artifact viewer: #n4-full-<KEY>
    if(key&&(UNLOCK_KEYS[level]===key||UNLOCK_KEYS.both===key))localStorage.setItem(k,'1');
    return localStorage.getItem(k)==='1';
  }catch(e){return !!UNLOCK_KEYS[level]&&[UNLOCK_KEYS[level],UNLOCK_KEYS.both].includes(new URLSearchParams(location.search).get('key')||location.hash.slice(1).split('-')[2])}
};
// Link target of the "Full mock + explanations" box on the mini result screen.
const CTA_URL='buy/index.html';
