// JLPT Mock engine: static, no deps. Content lives in packs/<level>/exam1.json.
const Q=new URLSearchParams(location.search);
const HP=location.hash.slice(1).split('-'); // artifact viewers: #n5-mini / #n4-full (query strings don't reach the page)
let LEVEL,MODE,TS,BASE,UNLOCKED=true;const FREE_SECTIONS=1;
function setup(l,m){LEVEL=(l||'n5').toLowerCase().replace(/[^a-z0-9_]/g,'');MODE=m==='full'?'full':'mini';
TS=MODE==='mini'?(parseFloat(Q.get('ts'))||0.2):(parseFloat(Q.get('ts'))||1); // ts= time scale (testing)
BASE=`packs/${LEVEL}/`}
const MINI_QUOTA={'moji-goi':[['',6]],'bunpo-dokkai':[['grammar',5],['reading',3]],'choukai':[['',6]]};
const KAN='一-龯々〆ヶ';
const TAGS={'kanji-reading':['Kanji reading','Practise reading kanji in context; learn words, not single characters.'],
'orthography':['Kanji writing','Match hiragana words to their kanji; watch similar-looking characters.'],
'vocab-context':['Vocabulary in context','Learn words with example sentences, not isolated lists.'],
'paraphrase':['Paraphrase / synonyms','Study pairs of near-synonyms and how they differ.'],
'usage':['Word usage','Check how a word is really used: what it pairs with, what it cannot take.'],
'grammar-form':['Grammar: choosing the form','Review particles and verb/adjective forms (te, nai, ta, potential...).'],
'grammar-sentence':['Grammar: sentence building','Practise word order: read each sentence aloud once you have built it.'],
'reading-short':['Reading: short passages','Read for the main point first; find the sentence that answers the question.'],
'reading-mid':['Reading: medium passages','Mark who did what and why; watch for conjunctions (but, so, because).'],
'reading-info':['Reading: information search','Scan for dates, prices and conditions; ignore the rest.'],
'listen-task':['Listening: task-based','Listen for what the speaker will do NEXT, not what was discussed.'],
'listen-point':['Listening: key points','Listen for the reason or detail the question asks about; take quick notes.'],
'listen-utterance':['Listening: verbal expressions','Learn set phrases for greetings, thanks and apologies by sound.'],
'listen-response':['Listening: quick response','Train with short call-and-response drills at natural speed.']};
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
// ruby: supports 漢字{ふりがな} (dokkai-dojo style) and {漢字}ふりがな (SPEC style; reading = following kana, max 2 per kanji)
const ruby=s=>esc(s)
  .replace(new RegExp(`\\{([^}]*[${KAN}][^}]*)\\}([ぁ-ゖー]+)`,'g'),(m,k,r)=>{const n=Math.max(1,[...k].length)*2,u=[...r];return `<ruby>${k}<rt>${u.slice(0,n).join('')}</rt></ruby>${u.slice(n).join('')}`;})
  .replace(new RegExp(`([${KAN}]+)\\{([^}]*)\\}`,'g'),'<ruby>$1<rt>$2</rt></ruby>');
const $=s=>document.querySelector(s), app=$('#app');
const lsGet=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch(e){return d}};
const lsSet=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};

let EX,SECT,A={},si=0,qi=0,endAt=0,tick=null,examAudio=true;
const AUD={}; // item id -> {el,state:'idle'|'playing'|'done'|'err'}

document.body.classList.toggle('noruby',!lsGet('jlptmock:ruby',true));

// evenly spaced, deterministic pick of k from arr
const spread=(arr,k)=>k>=arr.length?arr.slice():Array.from({length:k},(_,i)=>arr[Math.floor((i+.5)*arr.length/k)]);

function build(ex){
  return ex.sections.map(s=>{
    const all=s.mondai.flatMap(m=>m.items.map(it=>({...it,instr:m.instr,instr_en:m.instr_en,passage:m.passage})));
    let items=all;
    if(MODE==='mini'){
      const used=new Set(),pick=[];
      for(const [pre,k] of (MINI_QUOTA[s.id]||[['',6]])){
        const pool=all.filter(it=>!used.has(it.id)&&(!pre||(it.tag||'').startsWith(pre)));
        spread(pool,k).forEach(it=>{used.add(it.id);pick.push(it)});
      }
      items=all.filter(it=>used.has(it.id)); // keep exam order
    }
    return {id:s.id,title:s.title,minutes:s.minutes*TS,items};
  }).filter(s=>s.items.length);
}

const EXAM_DAY=new Date(2026,11,6);
const FACTS={n5:{q:87,min:90,lv:'Beginner'},n4:{q:100,min:115,lv:'Upper beginner'}};
function menu(){
  const days=Math.ceil((EXAM_DAY-new Date())/864e5);
  const tile=(l,cls)=>`<section class="lv ${cls}"><div class="lv-big">${l.toUpperCase()}</div><div class="lv-body">
    <p class="lv-sub">${FACTS[l].lv}</p>
    <button class="btn lv-go" data-l="${l}" data-m="mini">Try the free mini mock</button>
    <p class="lv-note">20 questions, about 20 minutes. Score and weak spots at the end.</p>
    <div class="lv-rows">
    <button class="lv-row" data-l="${l}" data-m="full"><span><b>Full mock exam</b><small>${FACTS[l].q} questions, ${Math.floor(FACTS[l].min/60)}h ${FACTS[l].min%60}m. Section 1 is free.</small></span><i>&rarr;</i></button>
    <a class="lv-row" href="plan/plan.html#${l}"><span><b>Study plan</b><small>Week by week until December 6</small></span><i>&rarr;</i></a></div></div></section>`;
  app.innerHTML=`<header class="hero">${days>0?`<div class="hero-days"><span class="hero-n">${days}</span><span class="hero-u">days until the<br>December 6 JLPT</span></div>`:''}
    <h1 class="hero-h">Find your weak spots<br>before exam day.</h1>
    <p class="hero-p">Real exam format, real timing, listening included. Every answer choice is explained.</p></header>
    <div class="lvs">${tile('n5','a')}${tile('n4','b')}</div>
    <ul class="facts"><li><b>3</b><span>sections with the real time limits, just like test day</span></li>
    <li><b>52</b><span>listening clips with audio, played once in exam mode</span></li>
    <li><b>3</b><span>weakest skills named at the end, so you know what to study next</span></li></ul>
    <p class="disc">Original questions, not copied from the official test. Scores are a rough guide, not an official result.</p>`;
  app.querySelectorAll('button[data-l]').forEach(b=>b.onclick=()=>{setup(b.dataset.l,b.dataset.m);init();window.scrollTo(0,0)});
}
async function init(){
  try{
    UNLOCKED=!(PAID_GATE&&MODE==='full')||await PAID_GATE({level:LEVEL,mode:MODE}); // freemium: section 1 of the full mock is free
    const r=await fetch(`${BASE}exam1.json`);if(!r.ok)throw 0;EX=await r.json();
  }catch(e){app.innerHTML=`<div class="card"><h1>Exam not found</h1><p>Could not load <code>${esc(BASE)}exam1.json</code>. Use <code>?level=n5|n4&amp;mode=full|mini</code>.</p></div>`;return}
  SECT=build(EX);start();
}

const histKey=`jlptmock:${LEVEL}:${MODE}`;
const total=()=>SECT.reduce((n,s)=>n+s.items.length,0);
const mmss=ms=>{const t=Math.max(0,Math.ceil(ms/1000));return String(Math.floor(t/60)).padStart(2,'0')+':'+String(t%60).padStart(2,'0')};
const fmtMin=m=>m>=1?Math.round(m)+' min':Math.round(m*60)+' sec';

function start(){
  const h=lsGet(histKey,[]),last=h[h.length-1];
  const mins=Math.round(SECT.reduce((t,x)=>t+x.minutes,0));
  app.innerHTML=`<button class="back" id="bk">← Back to levels</button>
  <header class="st-head"><div class="st-lv">${LEVEL.toUpperCase()}</div><div><h1 class="st-kind">JLPT ${LEVEL.toUpperCase()} Mock Test</h1><p class="st-meta">${MODE==='mini'?'Free mini version, 20 questions':'Full exam, real timing'}. Questions in Japanese, instructions in English.</p></div></header>
  <div class="st-nums"><div><b>${total()}</b><span>questions</span></div><div><b>${mins}</b><span>minutes</span></div><div><b>${SECT.length}</b><span>sections</span></div></div>
  <ol class="st-secs">${SECT.map((x,i)=>`<li><span class="st-min">${fmtMin(x.minutes).replace(/ ?min.*/,'')}<small>min</small></span><span class="st-sn"><b>${esc(x.title)}</b><small>${x.items.length} questions</small></span></li>`).join('')}</ol>
  ${MODE==='full'&&!UNLOCKED?`<p class="st-free">Section 1 is free. Sections 2 and 3, and every explanation, unlock with the pack.</p>`:''}
  <ul class="st-rules"><li>Each section has its own countdown and ends automatically at 0:00.</li><li>You cannot go back to a finished section, like the real test.</li><li>Listening clips play once. Turn your sound on.</li></ul>
  <div class="st-opts"><label class="tog"><input type="checkbox" id="rb" ${document.body.classList.contains('noruby')?'':'checked'}> Show furigana</label>
  <label class="tog"><input type="checkbox" id="ea" checked> Exam mode: listening plays once</label></div>
  ${last?`<p class="mute">Last attempt: ${last.pct}% on ${esc(last.date)}</p>`:''}
  <div class="st-bar"><button id="go" class="st-go">Start the exam</button></div>`;
  $('#bk').onclick=menu;
  $('#rb').onchange=e=>setRuby(e.target.checked);
  $('#go').onclick=()=>{examAudio=$('#ea').checked;si=0;qi=0;A={};beginSection();window.scrollTo(0,0)};
}
function setRuby(on){document.body.classList.toggle('noruby',!on);lsSet('jlptmock:ruby',on);const c=$('#rbt');if(c)c.checked=on}

function beginSection(){
  qi=0;endAt=Date.now()+SECT[si].minutes*60000;clearInterval(tick);
  tick=setInterval(()=>{const t=$('#tm');if(!t)return;const left=endAt-Date.now();t.textContent=mmss(left);t.classList.toggle('low',left<60000);if(left<=0)finishSection(true)},250);
  render();
}
function finishSection(auto){
  clearInterval(tick);Object.values(AUD).forEach(a=>{try{a.el.pause()}catch(e){}});
  if(MODE==='full'&&!UNLOCKED&&si+1>=FREE_SECTIONS){
    const items=SECT[si].items,right=items.filter(it=>A[it.id]===it.a).length;
    app.innerHTML=`<div class="brk"><p class="brk-k">${auto?'Time is up':'Section 1 finished'}</p>
    <h1 class="brk-h">${right} of ${items.length}</h1><p class="brk-closed">correct in ${esc(SECT[si].title)}</p>
    <div class="brk-next"><span>Unlock the rest</span><b>${SECT.slice(FREE_SECTIONS).map(x=>esc(x.title)).join(' and ')}</b><small>plus the explanation for every answer choice, in this section too</small></div>
    <a class="st-go" href="${esc(CTA_URL)}#${LEVEL}">Get the ${LEVEL.toUpperCase()} pack</a>
    <p class="mute" style="margin-top:14px">Already bought? Open the link from your email on this phone, then come back.</p></div>`;
    return;
  }
  if(si+1<SECT.length){
    const nx=SECT[si+1];
    app.innerHTML=`<div class="brk"><p class="brk-k">${auto?'Time is up':'Section finished'}</p>
    <h1 class="brk-h">${si+1} of ${SECT.length} done</h1>
    <div class="brk-dots">${SECT.map((_,i)=>`<i class="${i<=si?'on':''}"></i>`).join('')}</div>
    <p class="brk-closed">${esc(SECT[si].title)} is closed. You can't go back.</p>
    <div class="brk-next"><span>Up next</span><b>${esc(nx.title)}</b><small>${nx.items.length} questions, ${fmtMin(nx.minutes)}</small></div>
    <button id="nx" class="st-go">Start next section</button></div>`;
    $('#nx').onclick=()=>{si++;beginSection()};
  }else results();
}

function audioFor(it){
  if(!it.audio)return null;
  if(!AUD[it.id]){
    const el=new Audio(BASE+it.audio),o={el,state:'idle'};AUD[it.id]=o;
    el.onplaying=()=>{o.state='playing';refreshAudio(it.id)};
    el.onended=()=>{o.state='done';refreshAudio(it.id)};
    el.onerror=()=>{o.state='err';refreshAudio(it.id)};
  }
  return AUD[it.id];
}
function audioBtn(it){
  const o=audioFor(it);if(!o)return '';
  const once=examAudio,lab={idle:'▶ Play'+(once?' (once only)':''),playing:'Playing… (you can answer now)',done:once?'Played':'▶ Replay',err:'Audio unavailable'}[o.state];
  return `<button class="ghost" id="ap" data-w ${(o.state==='playing'||o.state==='err'||(once&&o.state==='done'))?'disabled':''}>${lab}</button>${o.state==='err'?'<p class="mute">The audio file could not be loaded. You can still answer.</p>':''}`;
}
function refreshAudio(id){const it=SECT[si]&&SECT[si].items[qi];if(it&&it.id===id){const b=$('#apbox');if(b){b.innerHTML=audioBtn(it);bindAudio(it)}}}
function bindAudio(it){const b=$('#ap');if(b)b.onclick=()=>{const o=audioFor(it);o.state='playing';o.el.currentTime=0;o.el.play().catch(()=>{o.state='err'});refreshAudio(it.id)}}

function render(){
  const s=SECT[si],it=s.items[qi],ans=A[it.id],n=s.items.length,done=s.items.filter(x=>A[x.id]!==undefined).length;
  app.innerHTML=`<div class="top"><div class="row"><div class="sec-name">${esc(s.title)}<br><span class="mute">Section ${si+1}/${SECT.length} · ${done}/${n} answered</span></div>
  <label class="tog"><input type="checkbox" id="rbt" ${document.body.classList.contains('noruby')?'':'checked'}>ふりがな</label><div class="timer" id="tm">${mmss(endAt-Date.now())}</div></div></div>
  <div class="card"><p class="mute">Question ${qi+1} of ${n}</p>
  ${it.instr?`<div class="instr">${ruby(it.instr)}${it.instr_en?`<br><span class="mute">${esc(it.instr_en)}</span>`:''}</div>`:''}
  ${it.passage?`<div class="passage">${ruby(it.passage)}</div>`:''}
  ${it.audio?`<div id="apbox">${audioBtn(it)}</div>`:''}
  ${it.stem?`<div class="stem">${ruby(it.stem)}</div>`:''}
  ${it.c.map((c,j)=>`<button class="choice${ans===j?' sel':''}" data-j="${j}" aria-pressed="${ans===j}"><b>${j+1}</b><span>${ruby(c)}</span></button>`).join('')}</div>
  <div class="row"><button class="ghost" id="pv" ${qi?'':'disabled'}>← Prev</button><button class="ghost" id="nt" ${qi<n-1?'':'disabled'}>Next →</button></div>
  <div class="meter"><div class="meter-bar"><i style="width:${Math.round(100*done/n)}%"></i><b style="left:${Math.round(100*qi/n)}%"></b></div><p class="mute meter-txt">${done} of ${n} answered, ${n-done} left<span class="keys">Keys: 1 to 4 answer, arrows move</span></p>
  <button id="fin" data-w>${si+1<SECT.length?'Finish this section':'Finish exam'}</button>`;
  app.querySelectorAll('.choice').forEach(b=>b.onclick=()=>{A[it.id]=+b.dataset.j;render()});
  $('#pv').onclick=()=>{qi--;render()};$('#nt').onclick=()=>{qi++;render()};
  if(!window._keys){window._keys=1;document.addEventListener('keydown',e=>{
    if(e.metaKey||e.ctrlKey||e.altKey||/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName))return;
    const cs=app.querySelectorAll('.choice');if(!cs.length)return; // only on a question screen
    const k=e.key;
    if(/^[1-9]$/.test(k)&&cs[+k-1]){cs[+k-1].click();e.preventDefault()}
    else if(k==='ArrowRight'||k==='Enter'){const b=$('#nt');if(b&&!b.disabled){b.click();e.preventDefault()}}
    else if(k==='ArrowLeft'){const b=$('#pv');if(b&&!b.disabled){b.click();e.preventDefault()}}
  })}
  $('#rbt').onchange=e=>setRuby(e.target.checked);
  // two-tap finish (confirm() dialogs are suppressed inside the artifact viewer)
  $('#fin').onclick=()=>{const b=$('#fin');if(b.dataset.arm){clearTimeout(b._t);finishSection(false);return}
    const un=n-done;b.dataset.arm='1';b.classList.add('arm');b.textContent=(un?`${un} unanswered. `:'')+"Tap again to finish (you can't come back)";
    b._t=setTimeout(()=>{delete b.dataset.arm;b.classList.remove('arm');b.textContent='Finish this section'},5000)};
  if(it.audio)bindAudio(it);
  window.scrollTo(0,0);
}

function results(){
  const all=SECT.flatMap(s=>s.items.map(it=>({...it,sec:s.id})));
  const ok=it=>A[it.id]===it.a,right=all.filter(ok).length,pct=Math.round(100*right/all.length);
  const secs=SECT.map(s=>{const r=s.items.filter(ok).length;return {title:s.title,r,n:s.items.length,p:Math.round(100*r/s.items.length)}});
  const by={};all.forEach(it=>{const t=it.tag||'other';(by[t]=by[t]||{r:0,n:0});by[t].n++;if(ok(it))by[t].r++});
  const weak=Object.entries(by).map(([t,v])=>({t,...v,p:v.r/v.n})).sort((a,b)=>a.p-b.p||b.n-a.n).slice(0,3);
  const h=lsGet(histKey,[]);h.push({date:new Date().toISOString().slice(0,10),pct,secs:secs.map(s=>s.p),weak:weak.map(w=>w.t)});lsSet(histKey,h.slice(-20));
  const bar=p=>`<div class="bar"><i style="width:${p}%"></i></div>`;
  app.innerHTML=`<h1>Your results</h1>
  <div class="card"><div class="big">${pct}%</div><p>${right} of ${all.length} correct</p>${bar(pct)}
  <p class="mute">This is a rough practice indicator only. It is not an official JLPT score and does not predict your real exam result.</p></div>
  <h2>Score by section</h2>${secs.map(s=>`<div class="card"><b>${esc(s.title)}</b><br>${s.r} / ${s.n} (${s.p}%)${bar(s.p)}</div>`).join('')}
  <h2>Your top 3 weak spots</h2>${weak.map((w,i)=>{const [name,tip]=TAGS[w.t]||[w.t,''];return `<div class="card weak"><b>${i+1}. ${esc(name)}</b> : ${w.r}/${w.n} correct (${Math.round(w.p*100)}%)<br><span class="mute">${esc(tip)}</span></div>`}).join('')}
  ${MODE==='mini'?`<div class="card cta"><h3>Want every question, with explanations?</h3><p>Get the complete mock exam with a full explanation for every answer choice.</p><a class="btn" href="${esc(CTA_URL)}" data-w>Full mock + explanations</a></div>`:''}
  <h2>Review</h2><label class="tog"><input type="checkbox" id="wo"> Show only questions I got wrong</label><div id="rv"></div>
  <div class="row"><button class="ghost" id="again">Try again</button></div>
  <p class="disc">Results are saved only in this browser. Practice material, not affiliated with the JLPT organisers.</p>`;
  const drawRv=()=>{const wo=$('#wo').checked;let n=0;$('#rv').innerHTML=all.map(it=>{n++;if(wo&&ok(it))return '';
    const a=A[it.id],good=ok(it);
    return `<div class="card rv ${good?'ok':'bad'}"><b>Q${n}</b> ${good?'✓ Correct':a===undefined?'✗ Not answered':'✗ Incorrect'}
    ${it.passage?`<div class="passage">${ruby(it.passage)}</div>`:''}${it.stem?`<div class="stem">${ruby(it.stem)}</div>`:''}
    ${it.c.map((c,j)=>`<div class="opt${j===it.a?' right':j===a?' wrong':''}"><b>${j+1}.</b> ${ruby(c)}${j===it.a?' ✓ correct answer':''}${j===a?' ← your answer':''}${it.ng&&it.ng[j]?`<br><span class="mute">${esc(it.ng[j])}</span>`:''}</div>`).join('')}
    ${it.why?`<div class="why"><b>Why:</b> ${esc(it.why)}</div>`:''}
    ${it.script?`<div class="script"><b>Audio script</b><br>${it.script.map(l=>`${esc(l.v)}: ${ruby(l.t)}`).join('<br>')}</div>`:''}</div>`}).join('')||'<p>Nothing to show.</p>'};
  $('#wo').onchange=drawRv;drawRv();$('#again').onclick=()=>menu();window.scrollTo(0,0);
}
if(Q.get('level')||HP[0]){setup(Q.get('level')||HP[0],Q.get('mode')||HP[1]);init()}else menu();
