const PWA=(()=>{
 let deferred=null,offlineReady=false;
 const standalone=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone;
 const ios=()=>/iPad|iPhone|iPod/.test(navigator.userAgent)||navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1;
 window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferred=e;if(typeof render==='function'&&view==='settings')render();});
 window.addEventListener('appinstalled',()=>{deferred=null;});
 async function init(){if(standalone()){const el=document.createElement('div');el.className='pwa-splash';el.innerHTML=`<span>🧭 📖</span><h1>${T('title')}</h1><p>V2.0</p>`;document.body.append(el);setTimeout(()=>el.remove(),1400);}if('serviceWorker'in navigator){try{const reg=await navigator.serviceWorker.register('./sw.js');navigator.serviceWorker.addEventListener('message',e=>{if(e.data?.type==='OFFLINE_READY'){offlineReady=true;if(view==='settings')render();}});reg.active?.postMessage({type:'STATUS'});}catch{}}}
 async function install(){if(!deferred)return;const event=deferred;deferred=null;await event.prompt();await event.userChoice;}
 return {init,install,instructions:()=>T(standalone()?'installed':ios()?'ios':'installOther'),get canInstall(){return Boolean(deferred)&&!ios();},get offlineReady(){return offlineReady;}};
})();
