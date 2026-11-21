// Navigation and content tools surround the proven V1.4 game engine.
let view='home',warning='',previewBank=null,importErrors=[],busy=false,promptReady=false,initializing=true;
TEAMS.push({symbol:'◆',color:'#c599ff'},{symbol:'♥',color:'#ffaf67'},{symbol:'☾',color:'#ff9cd2'},{symbol:'✚',color:'#69e5e0'});
const TEAM_NAMES=[['CÍRCULO AZUL','BLUE CIRCLE'],['TRIÁNGULO ROJO','RED TRIANGLE'],['CUADRADO VERDE','GREEN SQUARE'],['ESTRELLA AMARILLA','YELLOW STAR'],['DIAMANTE MORADO','PURPLE DIAMOND'],['CORAZÓN NARANJA','ORANGE HEART'],['LUNA ROSA','PINK MOON'],['CRUZ TURQUESA','TURQUOISE CROSS']];
TEAMS.forEach((t,i)=>Object.defineProperty(t,'name',{get:()=>TEAM_NAMES[i][I18n.lang==='es'?0:1]}));
const TYPE_KEYS={pregunta:['📖','typeQuestion'],cita:['📍','typeReference'],completar:['✏️','typeComplete'],emoji:['😀','typeEmoji'],orden:['🔀','typeOrder']};
Object.entries(TYPE_KEYS).forEach(([type,[icon,key]])=>Object.defineProperty(TYPES,type,{get:()=>icon+' '+T(key)}));
function recoverable(s){return s&&s.order?.length>=2&&!['setup','instructions','drawing','order','final','tiedFinal'].includes(s.phase);}
function validState(s){
 const phases=['setup','instructions','drawing','order','select','bonus','question','result','standings','tieIntro','tieExhausted','final','tiedFinal'];
 const ids=a=>Array.isArray(a)&&a.length>=2&&a.length<=8&&new Set(a).size===a.length&&a.every(n=>Number.isInteger(n)&&n>=0&&n<8);
 if(!s||s.version!==2||!phases.includes(s.phase)||!ids(s.teams)||!Array.isArray(s.order)||s.order.length&&(!ids(s.order)||s.order.length!==s.teams.length||s.order.some(n=>!s.teams.includes(n))))return false;
 if(!Array.isArray(s.scores)||s.scores.length!==8||s.scores.some(n=>!Number.isSafeInteger(n)||n<0)||!Number.isInteger(s.serial)||s.serial<0||!Number.isInteger(s.turn)||s.turn<0)return false;
 if(BankStore.validateCards(s.bankData?.cards).length||!Array.isArray(s.used)||new Set(s.used).size!==s.used.length||s.used.some(id=>!s.bankData.cards.some(c=>c.id===id)))return false;
 if(!s.cooldown||typeof s.cooldown!=='object'||Object.values(s.cooldown).some(n=>!Number.isInteger(n)||n<0))return false;
 if(s.beforeScores&&(!Array.isArray(s.beforeScores)||s.beforeScores.length!==8||s.beforeScores.some(n=>!Number.isSafeInteger(n)||n<0)))return false;
 if(s.tie&&(!ids(s.tie.teams)||s.tie.teams.some(n=>!s.order.includes(n))||![100,200,300,500].includes(s.tie.value)||!Array.isArray(s.tie.queue)||s.tie.queue.some(c=>!c||!c.extra&&!s.bankData.cards.some(b=>b.id===c.id))||s.phase!=='tieExhausted'&&s.phase!=='tiedFinal'&&s.tie.queue.length!==s.tie.teams.length))return false;
 if(s.order.length&&s.turn>=(s.tie?s.tie.teams:s.order).length)return false;
 if(['question','result','standings'].includes(s.phase)){const c=s.card?.extra||s.bankData.cards.find(c=>c.id===s.card?.id);if(!c||BankStore.validateCards([c]).length||!Array.isArray(s.options)||s.options.length!==4||new Set(s.options).size!==4||s.options.some(o=>!c.options.includes(o)))return false;if(s.optionIndices&&(!Array.isArray(s.optionIndices)||s.optionIndices.length!==4||new Set(s.optionIndices).size!==4||s.optionIndices.some(i=>!Number.isInteger(i)||i<0||i>3)))return false;if(s.phase==='question'&&s.deadline!==null&&(!Number.isFinite(s.deadline)||s.deadline<0))return false;if(s.phase!=='question'&&(!s.result||!['correct','wrong','timeout'].includes(s.result.kind)||![0,c.points].includes(s.result.points)))return false;}
 return true;
}
function migrate(old){if(!old||old.scores?.length!==4)return null;const s={...fresh(),...old,version:2,teamCount:4,teams:[0,1,2,3],scores:[...old.scores,0,0,0,0],bankData:{...BankStore.original('es'),original:false,name:'V1.4',language:'es',source:'RVR1960',cards:LEGACY_BANK.map(c=>({...c,status:'available'}))}};if(old.beforeScores)s.beforeScores=[...old.beforeScores,0,0,0,0];return validState(s)?s:null;}
function loadSaved(){try{const raw=localStorage.getItem(KEY),old=localStorage.getItem('explorador-v1');if(raw){const s=JSON.parse(raw);if(!validState(s))throw Error();saved=s;}else if(old){saved=migrate(JSON.parse(old));if(!saved)throw Error();}}catch{warning=T('corrupt');saved=null;}}
const originalSave=save;
save=function(){if(view!=='game'||!state.order.length)return;try{state.uiLanguage=I18n.lang;localStorage.setItem(KEY,JSON.stringify(state));saved=JSON.parse(JSON.stringify(state));}catch{warning=T('saveFailed');}};
const originalStartQuestion=startQuestion;
startQuestion=function(c){if(!c)return;originalStartQuestion(c);state.optionIndices=state.options.map(o=>c.options.indexOf(o));save();};
// More than four teams use a two-column ranking. Move whole cards on both
// axes so changing columns preserves the existing animated score reveal.
animateStandings=function(){const rows=Array.from(document.querySelectorAll('[data-rank-team]'));if(!rows.length)return;const previous=scoreOrder(state.beforeScores||state.scores),slots=rows.map(row=>row.getBoundingClientRect());rows.forEach(row=>{const old=slots[previous.indexOf(Number(row.dataset.rankTeam))],now=row.getBoundingClientRect();row.style.transition='none';row.style.transform=`translate(${old.left-now.left}px,${old.top-now.top}px)`;});rankMoveTimer=setTimeout(()=>{if(state.phase!=='standings')return;rows.forEach(row=>{row.style.transition=matchMedia('(prefers-reduced-motion: reduce)').matches?'none':'transform 1.65s cubic-bezier(.22,.8,.2,1)';row.style.transform='translate(0px,0px)';});},900);};
// Empty custom banks cannot strand teams midway through a round. Once fewer
// cards than a full round remain, the existing engine ends at the boundary.
tieRound=function(){const t=state.tie,p=[500,300,200,100].find(p=>available(p).length>=t.teams.length);state.turn=0;if(!p){state.phase='tieExhausted';render();return;}t.value=p;t.queue=shuffle(available(p)).slice(0,t.teams.length).map(c=>({id:c.id}));state.phase='tieIntro';render();};
function teamText(id){return `<span style="color:${TEAMS[id].color}">${TEAMS[id].symbol} ${escape(TEAMS[id].name)}</span>`;}
function bankSummary(b){return `<section class="bank-summary"><h2>${escape(b.name)}</h2><p>${escape(b.topic)} · ${T('bankLanguage')}: ${escape(b.language)}</p><div class="bank-counts"><b>${T('total')}: ${b.cards.length}</b>${BankStore.summary(b).map(c=>`<span>${c.points}: <b>${c.count}</b></span>`).join('')}</div></section>`;}
function decorate(html){return `<div class="explorer-decor" aria-hidden="true"><span class="expedition-icon compass-icon">🧭</span><span class="expedition-icon map-icon">🗺️</span><span class="expedition-icon bible-icon">📖</span><div class="expedition-seal">🧭 <span>${T('seal')}</span> 📖</div></div>${html}`;}
function localization(){
 const phrases=UI_GAME_PHRASES;
 const walk=node=>{if(node.nodeType===3){const raw=node.textContent,key=phrases[raw.trim()];if(key)node.textContent=raw.replace(raw.trim(),T(key));else if(I18n.lang==='en')node.textContent=raw.replace(/PUNTOS TOTALES/g,T('totalPoints')).replace(/PUNTOS/g,T('points')).replace(/tarjetas disponibles/g,T('available')).replace(/AGOTADO/g,T('empty')).replace(/en este desafío/g,T('thisChallenge')).replace(/\.º EN JUGAR/g,' · '+T('playOrder')).replace(/\.º en el orden/g,' · '+T('playOrder')).replace(/(\d+)\.º(?=\s|$)/g,'$1').replace(/▲ SUBE/g,'▲ '+T('up')).replace(/▼ BAJA/g,'▼ '+T('down')).replace(/⚡ DESAFÍO DE DESEMPATE/g,'⚡ '+T('tieChallenge'));return;}if(node.nodeType!==1)return;if(node.matches('.question,.prompt,.options,.reference,.correct-answer-reveal strong,.explanation'))return;for(const child of Array.from(node.childNodes))walk(child);};walk($('app'));walk($('scoreboard'));
}
function render(){
 clearTimers();document.documentElement.lang=I18n.lang;document.title=T('title')+' — V2.0';$('brandText').innerHTML=T('brand');$('subtitle').textContent=T('subtitle');$('full').textContent='⛶ '+T('full');$('homeNav').textContent='⌂ '+T('home');$('es').setAttribute('aria-pressed',I18n.lang==='es');$('en').setAttribute('aria-pressed',I18n.lang==='en');$('sound').textContent=sound?'🔊':'🔇';$('sound').setAttribute('aria-label',T('sound')+' '+T(sound?'on':'off'));
 let html='',decorated=false;
 const back=btn('← '+T('back'),'home','small');
 if(view==='game'&&state.phase!=='setup'&&!['tieExhausted','tiedFinal'].includes(state.phase)){renderGame();localization();if(state.phase==='instructions')$('app').innerHTML=`<span class="eyebrow">${T('before')}</span><h1>${T('how')}</h1><div class="rules-grid">${[['🎲','Teams'],['💎','Value'],['⏱️','Clock'],['✅','Score'],['🎁','Bonus'],['🏆','Fair']].map(([icon,k])=>`<div><b>${icon} ${T('rule'+k)}</b><p>${T('rule'+k+'Body')}</p></div>`).join('')}</div>${btn('🎲 '+T('draw'),'draw')}`;if(state.phase==='tieIntro')$('app').innerHTML=`<span class="result-icon">⚡</span><h1>${T('tie')}</h1><p>${state.tie.teams.map(teamText).join(' · ')}</p><p>${T('tieBody')} ${state.tie.value} ${T('points')}.</p>${btn(T('tieContinue'),'tieStart')}`;if(state.phase==='question'){const heading=document.createElement('h2');heading.className='question-team';heading.innerHTML=teamText(current());$('app').prepend(heading);}if(state.phase==='result'&&state.result.kind!=='timeout'&&card()?.explanation){const explanation=document.createElement('p');explanation.className='explanation';explanation.textContent=card().explanation;$('app').append(explanation);} }
 else {
 if(view==='home'){decorated=true;html=`<span class="eyebrow">${T('expedition')}</span><h1>${T('title')}</h1><p>${T('subtitle')}</p>${initializing?`<p role="status">🧭 ${T('ready')}</p>`:`<div class="home-actions">${btn('▶ '+T('newGame'),'newGame')}${recoverable(saved)?btn('↩ '+T('continueGame'),'resume'):''}${btn('⚙️ '+T('settings'),'settings','small')}${btn('❓ '+T('help'),'help','small')}</div>${btn('ℹ️ '+T('about'),'about','quiet')}`}`;}
 if(view==='game'&&state.phase==='setup'){decorated=true;html=`<span class="eyebrow">${T('expedition')}</span><h1>${T('teamCount')}</h1><div class="team-count">${[2,3,4,5,6,7,8].map(n=>`<button class="small ${state.teamCount===n?'selected':''}" data-count="${n}" aria-pressed="${state.teamCount===n}">${n}</button>`).join('')}</div><p>${T('chooseIdentity')}</p><div class="identities" data-count="${state.teamCount}">${state.teams.map(id=>`<div class="identity" style="border-top:4px solid ${TEAMS[id].color}"><span class="symbol" style="color:${TEAMS[id].color}">${TEAMS[id].symbol}</span><strong>${escape(TEAMS[id].name)}</strong></div>`).join('')}</div>${btn(T('start'),'instructions')}`;}
 if(view==='settings')html=`${back}<h1>⚙️ ${T('settings')}</h1><div class="settings-panel"><section><h2>${T('language')}</h2>${btn('ES','lang-es','small')}${btn('EN','lang-en','small')}<h2>${T('sound')}</h2>${btn((sound?'🔊 ':'🔇 ')+T(sound?'on':'off'),'sound','small')}</section><section><h2>📚 ${T('bank')}</h2>${bankSummary(BankStore.current())}${btn(T('customize'),'banks','small')}<p class="note">${T('bankLocked')}</p></section><section><h2>📲 ${T('installTitle')}</h2><p>${PWA.instructions()}</p>${PWA.canInstall?btn(T('install'),'install','small'):''}<p class="note">${T(PWA.offlineReady?'offlineReady':'offlinePending')}</p></section></div>`;
 if(['banks','manual','ai'].includes(view))html=`${back}<h1>📚 ${T('customize')}</h1>${bankSummary(BankStore.current())}<div class="actions">${btn('✍️ '+T('manual'),'manual','small')}${btn('✨ '+T('ai'),'ai','small')}</div>${view==='manual'?`<p>${T('manualSteps')}</p>${btn(T('template'),'template')}`:''}${view==='ai'?`<p>${T('aiSteps')}</p>${btn('📦 '+T('kit'),'kit','primary')}${!promptReady?`<p class="note">${T('promptPending')}</p>`:''}`:''}<div class="actions">${btn('📥 '+T('import'),'import','small')}${btn('📤 '+T('export'),'export','small')}${btn('↩ '+T('restore'),'restore','small')}</div><p class="note">${T('localOnly')}</p>${busy?`<p role="status">${T('importReading')}</p>`:''}${importErrors.length?`<div class="import-errors" role="alert"><p>${T('importErrors')}</p><ul>${importErrors.map(e=>`<li>${escape(e)}</li>`).join('')}</ul></div>`:''}${previewBank?`<section class="bank-preview"><span class="eyebrow">${T('preview')}</span>${bankSummary(previewBank)}${btn(T('activate'),'activate')}${btn(T('cancel'),'cancelPreview','small')}</section>`:''}`;
 if(view==='help')html=`${back}<h1>❓ ${T('help')}</h1><p>${T('helpIntro')}</p><div class="help-blocks">${['Teams','Responses','Bonus','Devices','Banks','Recovery'].map(k=>`<details><summary>${T('help'+k)}</summary><p>${T('help'+k+'Body')}</p></details>`).join('')}<details><summary>${T('installTitle')}</summary><p>${PWA.instructions()}</p></details></div>`;
 if(view==='about'){decorated=true;html=`${back}<h1>${T('about')}</h1><h2>El Gran Desafío del Explorador Bíblico</h2><p>The Great Bible Explorer Challenge</p><p>${T('createdBy')}: <strong>Ricardo Vargas</strong><br>${T('social')}: @ptrvargas<br>${T('version')}: V2.0</p>`;}
 if(view==='game'&&state.phase==='tieExhausted')html=`<span class="result-icon">⚡</span><h1>${T('tie')}</h1><p>${T('tieExhausted')}</p>${btn(T('tieFinish'),'tiedFinal')}`;
 if(view==='game'&&state.phase==='tiedFinal'){decorated=true;const ranking=scoreOrder(state.scores);html=`<h1>⚡ ${T('tie')}</h1><p>${T('tieExhausted')}</p><div class="rankings">${ranking.map(id=>`<div class="rank"><span>${ranking.findIndex(n=>state.scores[n]===state.scores[id])+1}</span><span>${teamText(id)}</span><b>${state.scores[id]}</b></div>`).join('')}</div>${btn(T('newGame'),'newGame')}`;}
 $('app').className=decorated?'explorer-screen':'';$('app').innerHTML=decorated?decorate(html):html;
 }
 const playing=view==='game'&&state.order.length>0;
 if(!playing)$('scoreboard').innerHTML='';$('scoreboard').dataset.count=playing?state.order.length:0;
 $('scoreboard').querySelectorAll('.team').forEach(el=>el.dataset.playing=T('inPlay'));
 $('app').querySelectorAll('.live-rankings').forEach(el=>el.dataset.count=state.order.length);
 $('finish').hidden=!playing||['final','tiedFinal','tieExhausted'].includes(state.phase);$('finish').disabled=!playing||!!state.tie;$('finish').textContent='🏁 '+T('finish');$('finish').title=T(canFinish()?'roundComplete':'incomplete');$('reset').hidden=!playing&&!recoverable(saved);$('reset').textContent=T('reset');
 const b=playing?state.bankData:BankStore.current();$('footerText').textContent=(b.original||b.source==='RVR1960'?T('bibleTexts')+': '+b.source:T('bankLanguage')+': '+b.language)+' · V2.0';
 if(view==='game'&&state.finishRound){const p=document.createElement('p');p.className='badge';p.textContent=T('roundPending');$('app').append(p);}
 if(warning){const p=document.createElement('p');p.className='warning';p.setAttribute('role','alert');p.textContent=warning;$('app').append(p);if(warning===T('corrupt'))$('app').insertAdjacentHTML('beforeend',btn(T('discard'),'discard','small'));}
 save();GameAudio.setMode(playing?state.phase:'setup');
}
function setLanguage(lang){I18n.set(lang);warning='';if(state.bankData.original&&BankStore.mastersReady){state.bankData=BankStore.original(lang);BANK=state.bankData.cards;if(state.card&&!state.card.extra){const c=card();state.options=(state.optionIndices||[0,1,2,3]).map(i=>c.options[i]);}}render();}
function toggleSound(){sound=!sound;try{localStorage.setItem('explorador-sound',sound?'on':'off');}catch{}GameAudio.setEnabled(sound);if(sound)GameAudio.start();render();}
function begin(){state=fresh();BANK=state.bankData.cards;view='game';render();}
function discard(){localStorage.removeItem(KEY);localStorage.removeItem('explorador-v1');saved=null;warning='';state=fresh();BANK=[];}
async function action(a){
 if(initializing)return;
 if(a==='cancel'){$('modal').close();return;}
 if(a==='lang-es'||a==='lang-en'){setLanguage(a.slice(-2));return;}
 if(a==='sound'){toggleSound();return;}
 if(a==='new'||a==='newGame'){if(recoverable(saved)||recoverable(state)){modal(T('resetConfirm'),T('resetBody'),[[T('cancel'),'cancel'],[T('resetYes'),'resetConfirm','danger']]);return;}begin();return;}
 if(a==='reset'){modal(T('resetConfirm'),T('resetBody'),[[T('cancel'),'cancel'],[T('resetYes'),'resetConfirm','danger']]);return;}
 if(a==='resetConfirm'){$('modal').close();clearTimers();try{discard();}catch{warning=T('saveFailed');}begin();return;}
 if(a==='discard'){try{discard();}catch{}view='home';render();return;}
 if(a==='resume'&&saved){if(!validState(saved)){warning=T('corrupt');render();return;}state=JSON.parse(JSON.stringify(saved));BANK=state.bankData.cards;view='game';if(state.bankData.original&&BankStore.mastersReady){const indices=state.optionIndices||state.options.map(o=>card()?.options.indexOf(o));state.bankData=BankStore.original(I18n.lang);BANK=state.bankData.cards;if(state.card&&!state.card.extra)state.options=(indices||[0,1,2,3]).map(i=>card().options[i]);}if(state.phase==='question'&&!state.deadline)state.deadline=Date.now()+20000;render();return;}
 if(['home','settings','help','about','banks','manual','ai'].includes(a)){view=a;render();return;}
 if(a==='start'&&BANK.length<state.order.length){modal(T('bank'),T('equal')+' · '+T('errEmpty'),[[T('cancel'),'cancel']]);return;}
 if(a==='tiedFinal'){state.phase='tiedFinal';render();return;}
 if(a==='restore'){modal(T('restore'),T('restoreBody'),[[T('cancel'),'cancel'],[T('restore'),'restoreConfirm','gold']]);return;}
 if(a==='cancelPreview'){previewBank=null;render();return;}
 try{
 if(a==='restoreConfirm'){BankStore.restore();$('modal').close();previewBank=null;warning='';render();return;}
 if(a==='activate'&&previewBank&&!busy){busy=true;render();try{await BankStore.activate(previewBank);previewBank=null;warning=T('bankSaved');}finally{busy=false;}render();return;}
 if(a==='import'&&!busy){$('bankFile').value='';$('bankFile').click();return;}
 if(a==='template'){await BankWorkbook.template();return;}
 if(a==='export'){await BankWorkbook.exportBank(BankStore.current());return;}
 if(a==='kit'){await BankWorkbook.kit();return;}
 if(a==='install'){await PWA.install();return;}
 }catch(e){busy=false;warning=e.message||T('errFile');render();return;}
 gameAction(a);
}
// Capture count changes while allowing the existing delegated gameplay handler.
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.disabled)return;if(b.dataset.count&&state.phase==='setup'){state.teamCount=+b.dataset.count;state.teams=Array.from({length:state.teamCount},(_,i)=>i);render();}});
$('sound').onclick=toggleSound;$('es').onclick=()=>setLanguage('es');$('en').onclick=()=>setLanguage('en');$('homeNav').onclick=()=>action('home');$('reset').onclick=()=>action('reset');
$('bankFile').onchange=async e=>{const file=e.target.files[0];if(!file)return;busy=true;previewBank=null;importErrors=[];warning='';render();try{const result=await BankWorkbook.read(file);importErrors=result.errors;previewBank=result.bank;}catch(e){importErrors=[e.message||T('errFile')];}finally{busy=false;render();}};
document.addEventListener('visibilitychange',()=>{save();if(document.visibilityState==='visible'&&view==='game'&&state.phase==='question')runClock();});
async function initialize(){render();await BankStore.init();state=fresh();loadSaved();warning=warning||BankStore.warning;try{promptReady=(await fetch('downloads/Prompt_Generador_Banco.txt')).ok;}catch{}initializing=false;render();PWA.init();}
initialize();
finishDialog=function(){if(view!=='game'||state.tie)return;modal(T('finishConfirm'),T(canFinish()?'finishBody':'incomplete'),[[T('cancel'),'cancel'],[T(canFinish()?'finish':'completeRound'),canFinish()?'end':'complete','gold']]);};
$('finish').onclick=finishDialog;
