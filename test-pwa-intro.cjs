const fs=require('fs'),vm=require('vm'),assert=require('assert');
function setup({ua='Mozilla Android Chrome/140 Safari/537',platform='',touch=0,lang='es',reduced=false,standalone=false}={}){
 const events={},domEvents={},timers=new Map(),shell={inert:false},body={append(el){el.isConnected=true;this.last=el}},nodes=[];let focused=null,rendered=0,dialogs=[];
 function el(){const children={};const n={isConnected:false,attributes:{},className:'',innerHTML:'',textContent:'',setAttribute(k,v){this.attributes[k]=v;},querySelector(k){return children[k]??=(el());},focus(){focused=this;},remove(){this.isConnected=false;},get children(){return children}};nodes.push(n);return n;}
 const home=el();home.isConnected=true;
 const c=vm.createContext({console,navigator:{language:lang,userAgent:ua,platform,maxTouchPoints:touch},localStorage:{getItem(){},setItem(){}},matchMedia:q=>({matches:q.includes('prefers-reduced')?reduced:standalone,addEventListener(fn,cb){events['mode']=cb}}),setTimeout:(f,ms)=>{timers.set(timers.size+1,{f,ms});return timers.size},clearTimeout:id=>timers.delete(id),window:{addEventListener:(n,f)=>events[n]=f},document:{activeElement:body,body,createElement:el,querySelector:()=>shell,getElementById:()=>home,addEventListener:(n,f)=>domEvents[n]=f,removeEventListener:n=>delete domEvents[n]},render(){rendered++},modal(...args){dialogs.push(args)},view:'home'});
 for(const name of ['i18n','license','pwa'])vm.runInContext(fs.readFileSync('dist/'+name+'.js','utf8'),c);
 return{c,events,domEvents,timers,shell,body,nodes,dialogs,rendered:()=>rendered,focus:()=>focused,run:s=>vm.runInContext(s,c)};
}
(async()=>{
 let x=setup();assert(x.run('PWA.homeControl()').includes('Instalar aplicación'));await x.run('PWA.install()');assert(x.dialogs.at(-1)[1].includes('Chrome'));assert(!x.run('PWA.instructions()').includes('confirmada'));
 let prompted=0;x.events.beforeinstallprompt({preventDefault(){},prompt:async()=>prompted++,userChoice:Promise.resolve({outcome:'accepted'})});assert(x.run('PWA.canInstall'));await x.run('PWA.install()');assert.equal(prompted,1);assert(!x.run('PWA.instructions()').includes('confirmada'));assert(x.dialogs.at(-1)[1].includes('aún no se ha confirmado'));assert(!x.run('PWA.canInstall'));
 x.events.appinstalled();assert(x.run('PWA.instructions()').includes('confirmada'));assert(!x.run('PWA.homeControl()').includes('data-action="install"'));
 x=setup();x.events.beforeinstallprompt({preventDefault(){},prompt:async()=>{},userChoice:Promise.resolve({outcome:'dismissed'})});await x.run('PWA.install()');assert(!x.run('PWA.instructions()').includes('confirmada'));
 x=setup();x.events.beforeinstallprompt({preventDefault(){},prompt:async()=>{throw Error('denied')}});await x.run('PWA.install()');assert(x.dialogs.at(-1)[1].includes('No se pudo'));
 x=setup({ua:'iPhone Version/18 Safari/604'});assert(x.run('PWA.homeControl()').includes('iPhone/iPad'));assert(x.run('PWA.instructions()').startsWith('En Safari:'));
 x=setup({ua:'iPhone CriOS/140 Safari/604'});assert(x.run('PWA.instructions()').includes('copia este enlace'));await x.run('PWA.install()');assert(x.dialogs.length);
 x=setup({ua:'Macintosh Version/18 Safari/604',platform:'MacIntel',touch:5});assert(x.run('PWA.homeControl()').includes('iPhone/iPad'));
 x=setup({ua:'Windows Chrome/140 Safari/537',lang:'en'});assert(x.run('PWA.homeControl()').includes('Install application'));assert(x.run('PWA.instructions()').includes('Edge'));
 x=setup({standalone:true});assert(x.run('PWA.instructions()').includes('modo independiente'));assert(!x.run('PWA.homeControl()').includes('data-action="install"'));
 for(const lang of ['es','en']){
  x=setup({lang});x.run('PWA.showIntro()');assert(x.shell.inert);const intro=x.body.last;assert(intro.innerHTML.includes('icons/icon-192.png'));assert.equal(intro.children.h1.textContent,x.run("T('title')"));assert(intro.children['.intro-credit'].textContent.includes('Ricardo Vargas — @ptrvargas'));assert.equal([...x.timers.values()][0].ms,2000);assert(x.domEvents.keydown);
  x.run('PWA.showIntro()');assert.equal(x.timers.size,1);intro.children.button.onclick();assert(!x.shell.inert);assert(!intro.isConnected);assert.equal(x.timers.size,0);
  x.run('PWA.showIntro()');assert.equal(x.timers.size,0); // no replay on internal navigation
  x=setup({lang});x.run('PWA.showIntro()');[...x.timers.values()][0].f();assert(!x.shell.inert);
  x=setup({lang});x.run('PWA.showIntro();I18n.set(I18n.lang==="es"?"en":"es");PWA.updateIntro()');assert.equal(x.body.last.children.h1.textContent,x.run("T('title')"));x.domEvents.keydown({key:'Escape',preventDefault(){}});assert(!x.shell.inert);
  x=setup({lang,reduced:true});x.run('PWA.showIntro()');assert.equal(x.timers.size,0);assert(!x.body.last);
  const license=x.run('PWA.licenseHTML()');assert(license.includes('© 2026 Ricardo Vargas — @ptrvargas'));assert(license.includes(lang==='es'?'se prohíbe vender':'selling the game'));assert(license.includes('OSI'));assert(license.includes('RVR1960'));assert(license.includes('NKJV'));assert(license.includes('JSZip'));
 }
 x=setup();let swCallback,registrations=0;x.c.navigator.serviceWorker={addEventListener(n,cb){swCallback=cb;},async register(path){assert.equal(path,'./sw.js');registrations++;return{active:{postMessage(m){assert.equal(m.type,'STATUS')}}}}};await x.run('PWA.init();');await x.run('PWA.init();');assert.equal(registrations,1);swCallback({data:{type:'OFFLINE_READY'}});assert(!x.run('PWA.offlineReady'));swCallback({data:{type:'OFFLINE_READY',build:'license-pwa-intro-1'}});assert(x.run('PWA.offlineReady'));
 x.run("view='game'");const before=x.rendered();x.events.appinstalled();assert.equal(x.rendered(),before); // installation events cannot reset a live clock
 console.log('PASS: Android/native/alternative install, iOS Safari/Chrome/iPadOS, desktop, standalone, accepted/dismissed/error, browser confirmation only; intro ES/EN, 2s, skip, Escape, single launch, reduced motion, focus restore; credits/license; SW build acknowledgment; live gameplay not rerendered.');
})().catch(e=>{console.error(e);process.exitCode=1});
