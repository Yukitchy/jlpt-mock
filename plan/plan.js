(()=>{
const $app=document.getElementById('app');
const Q=new URLSearchParams(location.search);
const DEV=Q.get('dev')==='1';
const MONTH=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const TAGCAT={'kanji-reading':'kanji','orthography':'kanji','vocab-context':'vocab','paraphrase':'vocab','usage':'vocab','grammar-form':'grammar','grammar-sentence':'grammar','reading-short':'read','reading-mid':'read','reading-info':'read','listen-task':'listen','listen-point':'listen','listen-utterance':'listen','listen-response':'listen'};
const TAGNAME={'kanji-reading':'Kanji reading','orthography':'Kanji writing','vocab-context':'Vocabulary in context','paraphrase':'Paraphrase and synonyms','usage':'Word usage','grammar-form':'Grammar: choosing the form','grammar-sentence':'Grammar: sentence building','reading-short':'Reading: short passages','reading-mid':'Reading: medium passages','reading-info':'Reading: information search','listen-task':'Listening: task-based','listen-point':'Listening: key points','listen-utterance':'Listening: verbal expressions','listen-response':'Listening: quick response'};
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const lsGet=(k,d)=>{try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}};
const lsSet=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
const dnum=(y,m,d)=>Math.floor(Date.UTC(y,m,d)/864e5);
const pdate=s=>{const [y,m,d]=s.split('-').map(Number);return dnum(y,m-1,d)};
const fmt=n=>{const d=new Date(n*864e5);return MONTH[d.getUTCMonth()]+' '+d.getUTCDate()};
const now=new Date(),TODAY=dnum(now.getFullYear(),now.getMonth(),now.getDate());
let LV,P,G;

const key=id=>`jlptplan:${LV}:${id}`;
const isDone=id=>!!lsGet(key(id),false);
const wRange=(P,w)=>{const s=pdate(P.start)+7*(w-1);return [s,w>=10?pdate(P.exam):s+6]};
function curWeek(){const i=TODAY-pdate(P.start);return i<0?1:Math.min(10,Math.floor(i/7)+1)}
function lastResult(){
  let best=null;
  for(const m of ['mini','full']){const h=lsGet(`jlptmock:${LV}:${m}`,[]);const e=Array.isArray(h)&&h[h.length-1];if(e&&e.weak&&e.weak.length&&(!best||e.date>=best.date))best=e}
  return best;
}
function findStart(){
  const r=lastResult();if(!r)return null;
  const tag=r.weak[0],cat=TAGCAT[tag];if(!cat)return null;
  for(let w=curWeek();w<=10;w++){const wk=P.weeks[w-1];const t=wk.tasks.find(t=>t.cat===cat&&!isDone(t.id));if(t)return {tag,cat,week:w,task:t.id,text:t.text}}
  return {tag,cat,week:null};
}
function progress(){const all=P.weeks.flatMap(w=>w.tasks);const d=all.filter(t=>isDone(t.id)).length;return {d,n:all.length,p:Math.round(100*d/all.length)}}

function taskHtml(t,S){
  let h=`<div class="task${isDone(t.id)?' done':''}" data-t="${t.id}"><label><input type="checkbox" data-id="${t.id}" ${isDone(t.id)?'checked':''}><span class="t">${esc(t.text)}${S&&S.task===t.id?'<span class="badge">Start here</span>':''}</span></label>`;
  if(t.links)h+=`<div class="links">${t.links.map(l=>`<a href="${esc(l.href)}">${esc(l.label)}</a>`).join('')}</div>`;
  if(t.items){
    const n=t.items.length;
    h+=`<button type="button" class="gtog" data-n="${n}" aria-expanded="false">Show the ${n} items</button><ul class="gl" hidden>`+t.items.map((id,i)=>{const g=G.items[id];if(!g)return '';
      const day=i===0||Math.floor(i*7/n)!==Math.floor((i-1)*7/n)?`<span class="d">Day ${Math.floor(i*7/n)+1}</span>`:'<span class="d"></span>';
      const name=g.url?`<a class="jp" href="${esc(g.url)}">${esc(g.jp)}</a>`:`<span class="jp">${esc(g.jp)}</span>`;
      return `<li>${day}${name}<span class="en">${esc(g.en)}</span></li>`}).join('')+'</ul>';
  }
  if(t.score){const s=lsGet(key(t.score),{});h+=`<div class="score" data-s="${t.score}">${[['lk','LK plus Reading'],['li','Listening'],['tot','Total']].map(([k,n])=>`<label>${n}<input type="number" inputmode="numeric" min="0" max="180" data-k="${k}" value="${esc(s[k]??'')}"></label>`).join('')}</div>`;}
  return h+'</div>';
}
function flowHtml(){
  const f=P.facts;
  return `<h3>Section flow on test day</h3><table class="flow"><tr><th>Section</th><th>Time</th><th>Seconds per question</th></tr>${f.sections.map(([n,m,q])=>`<tr><td>${n}</td><td>${m} min</td><td>about ${Math.round(m*60/q)}</td></tr>`).join('')}</table><p class="small">Seconds per question are time divided by the question count in our mock. The real test can differ.</p>`;
}
function lessonHtml(){
  return `<div class="lesson"><p>If Language Knowledge + Reading is under 50% on both the mini mock and this full mock, or Listening is under 40% on both, a one-to-one 60-minute lesson fixes it faster than another week alone.</p><a class="btn" href="https://lessons.animesenseijp.com/">Book a trial lesson</a></div>`;
}
function weekBody(w,S){
  const wk=P.weeks[w-1];
  return wk.tasks.map(t=>taskHtml(t,S)).join('')+(wk.testday?flowHtml():'')+`<p class="done-when"><b>Done when:</b> ${esc(wk.done)}</p>`+(wk.lesson?lessonHtml():'');
}
function weekHead(w){
  const wk=P.weeks[w-1],[a,b]=wRange(P,w);
  const big=w<=9?`Week ${w}<small>of 9</small>`:'Final 2 days';
  return `<div class="hd"><div class="phase">${esc(wk.phase)}</div><div class="big${w>9?' fin':''}">${big}</div><h2>${esc(wk.title)}</h2><div class="dates">${fmt(a)} to ${fmt(b)}</div></div>`;
}
function weekCls(w,cw,S){const i=TODAY-pdate(P.start);return 'week'+(i>=0&&w===cw?' cur':'')+(i>=0&&w<cw?' past':'')+(S&&S.week===w?' start':'')}
function layoutHtml(S){
  const cw=curWeek();
  return P.weeks.map((_,i)=>i+1).map(w=>`<section id="wk-${w}" class="${weekCls(w,cw,S)}">${weekHead(w)}${weekBody(w,S)}</section>`).join('');
}
function calHtml(){
  const s0=pdate(P.start),ex=pdate(P.exam);
  let g='<div class="cal"><span></span>'+[1,2,3,4,5,6,7].map(d=>`<span class="dh">D${d}</span>`).join('');
  for(let w=1;w<=10;w++){
    g+=`<button type="button" class="wk" data-w="${w}">${w<=9?'Week '+w:'Final'}</button>`;
    for(let d=0;d<7;d++){
      const day=s0+7*(w-1)+d;
      if(w===10&&day>ex){g+='<span class="dot none"></span>';continue}
      g+=`<span class="dot${day===ex?' exam':day===TODAY?' today':day<TODAY?' past':''}" title="${fmt(day)}"></span>`;
    }
  }
  return g+'</div><p class="small">Grey dots are days gone by. Red is today. Black is test day. Tap a week to jump to it.</p>';
}
function factsHtml(){
  const f=P.facts;
  return `<section class="facts"><h2>Test day facts</h2><div class="tiles">${f.sections.map(s=>`<div class="tile"><b>${s[1]}<small> min</small></b><span>${esc(s[0])}</span></div>`).join('')}</div><p>Pass mark ${f.pass.replace(' of ','/')}. Minimums: ${f.lkr.replace(' of ','/')} in Language Knowledge + Reading, ${f.listen.replace(' of ','/')} in Listening.</p></section>`;
}
function nowHtml(S){
  const pr=progress(),cw=curWeek(),i=TODAY-pdate(P.start),wk=P.weeks[cw-1];
  let where=i<0?`Your plan starts in ${-i} day${-i===1?'':'s'}. Week 1 begins on ${fmt(pdate(P.start))}.`:(P.exam&&TODAY>pdate(P.exam)?'The test date has passed.':`You are in ${cw<=9?'Week '+cw:'the final days'}: ${wk.phase}. Open that week and work down the list.`);
  let st='';
  if(S){st=S.week?`<p>Your lowest area in your last mock was <b>${esc(TAGNAME[S.tag]||S.tag)}</b>. Start here: ${S.week<=9?'Week '+S.week:'the final days'}, the task marked Start here.</p>`:`<p>Your lowest area in your last mock was <b>${esc(TAGNAME[S.tag]||S.tag)}</b>. All tasks for it are ticked. Nice work.</p>`}
  return `<section class="now"><h2>Where you are now</h2><div class="pct" id="pct">${pr.p}%</div><div class="bar"><i id="pbar" style="width:${pr.p}%"></i></div><p class="small" id="pcount">${pr.d} of ${pr.n} tasks done</p><p>${where}</p>${st}${calHtml()}</section>`;
}
function heroHtml(){
  const left=pdate(P.exam)-TODAY,L=LV.toUpperCase();
  document.title=left>0?`JLPT ${L} Study Plan: ${left} Day${left===1?'':'s'} to December 6 | Free Weekly Checklist`:`JLPT ${L} Study Plan | Free Weekly Checklist`;
  const cap=left>0?`day${left===1?'':'s'} to the JLPT, Sunday December 6`:left===0?'Test day is today':'The December 6 test has passed';
  return `<header class="hero"><h1>JLPT ${L} Study Plan</h1><div class="num">${Math.max(left,0)}</div><p class="cap">${cap}</p><p>Follow one list a week. Two full mocks. Every answer explained.</p></header>`;
}
function render(){
  const S=findStart(),q=location.search;
  const lvTabs=['n5','n4'].map(l=>`<a href="${q}#${l}" class="${l===LV?'on':''}">JLPT ${l.toUpperCase()}</a>`).join('');
  $app.innerHTML=`<nav class="lv" aria-label="Level">${lvTabs}</nav>${heroHtml()}${nowHtml(S)}${factsHtml()}${layoutHtml(S)}<p class="srcs">Official facts from the JLPT site: ${P.sources.map(s=>`<a href="${s[1]}">${esc(s[0])}</a>`).join(', ')}. The official vocabulary and kanji lists have not been published since the 2010 revision, so word counts here are approx. Check your test organizer's notice first for anything about your own test.</p>`;
  if(DEV){let d=document.querySelector('.devbar');if(!d){d=document.createElement('nav');d.className='devbar';document.body.appendChild(d)}d.innerHTML='<span>Dev</span><a href="?dev=1#n5">N5</a><a href="?dev=1#n4">N4</a><button type="button" id="reset">Clear saved progress</button>'}
}
async function load(){
  LV=location.hash==='#n4'?'n4':'n5';
  try{
    const [p,g]=await Promise.all([fetch(`data/plan-${LV}.json`).then(r=>r.json()),fetch(`data/grammar-links-${LV}.json`).then(r=>r.json())]);
    P=p;G=g;render();
  }catch(e){$app.textContent='Could not load the plan. Open this page from a web server, not from a file.'}
}
$app.addEventListener('change',e=>{
  const c=e.target;
  if(c.matches('input[type=checkbox]')){lsSet(key(c.dataset.id),c.checked);c.closest('.task').classList.toggle('done',c.checked);const pr=progress();document.getElementById('pct').textContent=pr.p+'%';document.getElementById('pbar').style.width=pr.p+'%';document.getElementById('pcount').textContent=pr.d+' of '+pr.n+' tasks done';return}
  if(c.matches('.score input')){const box=c.closest('.score'),k=box.dataset.s,s=lsGet(key(k),{});s[c.dataset.k]=c.value;lsSet(key(k),s)}
});
$app.addEventListener('click',e=>{
  const b=e.target.closest('.wk');if(b){const el=document.getElementById('wk-'+b.dataset.w);if(el)el.scrollIntoView({behavior:'smooth',block:'start'});return}
  const g=e.target.closest('.gtog');if(g){const ul=g.nextElementSibling,open=ul.hidden;ul.hidden=!open;g.setAttribute('aria-expanded',open);g.textContent=(open?'Hide the ':'Show the ')+g.dataset.n+' items'}
});
document.addEventListener('click',e=>{if(e.target.id==='reset'){try{Object.keys(localStorage).filter(k=>k.startsWith('jlptplan:')).forEach(k=>localStorage.removeItem(k))}catch(x){}render()}});
window.addEventListener('hashchange',load);
load();
})();
