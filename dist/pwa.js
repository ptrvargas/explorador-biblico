// Installation is a browser capability: userChoice alone never means installed.
const PWA=(()=>{
 let deferred=null,offlineReady=false,confirmed=false,initialized=false,introShown=false,intro=null,introTimer=null,previousFocus=null;
 const standalone=()=>Boolean(matchMedia('(display-mode: standalone)').matches||navigator.standalone);
 const ios=()=>/iPad|iPhone|iPod/.test(navigator.userAgent)||navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1;
 const android=()=>/Android/i.test(navigator.userAgent);
 const safari=()=>/Safari/i.test(navigator.userAgent)&&!/CriOS|FxiOS|EdgiOS|OPiOS|Chrome|Android/i.test(navigator.userAgent);
 const installed=()=>standalone()||confirmed;
 function refresh(){if(typeof render==='function'&&typeof view!=='undefined'&&['home','settings'].includes(view))render();}
 window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferred=e;refresh();});
 window.addEventListener('appinstalled',()=>{confirmed=true;deferred=null;refresh();});
 const displayMode=matchMedia('(display-mode: standalone)');
 displayMode.addEventListener?.('change',refresh);
 function instructions(){return T(standalone()?'installOpened':confirmed?'installConfirmed':ios()?(safari()?'installSafariHelp':'installIOSOtherHelp'):android()?'installAndroidHelp':'installDesktopHelp');}
 function homeControl(){return installed()?`<p class="install-status" role="status">✓ ${instructions()}</p>`:`<div class="install-home"><button class="install-cta" data-action="install">📲 ${T(ios()?'installIOS':'installApp')}</button></div>`;}
 function help(status=''){if(typeof modal!=='function')return;modal(T('installTitle'),(status?T(status)+' ':'')+instructions(),[[T('close'),'cancel']]);}
 async function install(){
  if(installed()||ios()||!deferred){help();return;}
  const event=deferred;deferred=null;
  try{await event.prompt();await event.userChoice;if(!installed())help('installWaiting');}catch{help('installFailed');}
  refresh();
 }
 function updateIntro(){if(!intro)return;intro.querySelector('h1').textContent=T('title');intro.querySelector('img').alt=T('seal');intro.querySelector('.intro-credit').textContent=T('createdBy')+' Ricardo Vargas — @ptrvargas';intro.querySelector('button').textContent=T('skipIntro');intro.setAttribute('aria-label',T('title'));}
 function hideIntro(){if(!intro)return;clearTimeout(introTimer);intro.remove();intro=null;document.querySelector('.shell').inert=false;document.removeEventListener('keydown',onIntroKey);if(previousFocus?.isConnected&&previousFocus!==document.body)previousFocus.focus();else document.getElementById('homeNav')?.focus();}
 function onIntroKey(e){if(e.key==='Escape'){e.preventDefault();hideIntro();}else if(e.key==='Tab'){e.preventDefault();intro?.querySelector('button').focus();}}
 function showIntro(){
  if(introShown)return;introShown=true;
  // Reduced motion skips the transient screen entirely.
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  previousFocus=document.activeElement;intro=document.createElement('section');intro.className='pwa-splash presentation-intro';intro.setAttribute('role','dialog');intro.setAttribute('aria-modal','true');
  intro.innerHTML='<img src="icons/icon-192.png" width="192" height="192" alt=""><h1></h1><button class="small intro-skip"></button><p class="intro-credit"></p>';
  intro.querySelector('button').onclick=hideIntro;updateIntro();document.querySelector('.shell').inert=true;document.body.append(intro);document.addEventListener('keydown',onIntroKey);intro.querySelector('button').focus();introTimer=setTimeout(hideIntro,2000);
 }
 function licenseHTML(){const es=I18n.lang==='es';return `<section class="license-notice"><h2>${T('licenseTitle')}</h2><p class="copyright">${GAME_LICENSE.copyright}</p>${GAME_LICENSE[es?'es':'en'].map(p=>`<p>${p}</p>`).join('')}<p><a href="LICENSE.md">${T('licenseFile')}</a></p><h2>${T('thirdParty')}</h2>${GAME_LICENSE[es?'thirdEs':'thirdEn'].map(p=>`<p>${p}</p>`).join('')}<p><a href="THIRD_PARTY_NOTICES.md">${T('thirdPartyFile')}</a> · <a href="vendor/JSZip-LICENSE.md">JSZip</a></p></section>`;}
 async function init(){if(initialized)return;initialized=true;if('serviceWorker'in navigator){try{navigator.serviceWorker.addEventListener('message',e=>{if(e.data?.type==='OFFLINE_READY'&&e.data?.build==='license-pwa-intro-1'){offlineReady=true;refresh();}});const reg=await navigator.serviceWorker.register('./sw.js');reg.active?.postMessage({type:'STATUS'});}catch{/* The web game remains usable if installation/cache is unsupported. */}}}
 return {init,install,instructions,homeControl,showIntro,hideIntro,updateIntro,licenseHTML,get canInstall(){return Boolean(deferred)&&!ios()&&!installed();},get offlineReady(){return offlineReady;}};
})();
