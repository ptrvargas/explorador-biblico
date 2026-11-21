const fs=require('fs'),vm=require('vm'),assert=require('assert'),{spawnSync}=require('child_process');
const JSZip=require('/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/jszip');
class XmlNode{
 constructor(o){this.o=o;this.children=(o.children||[]).map(n=>new XmlNode(n));this.textContent=o.text||'';}
 getAttribute(k){return this.o.attrs?.[k]??null;}
 getAttributeNS(ns,k){return this.getAttribute('{'+ns+'}'+k)||this.getAttribute('r:'+k);}
 getElementsByTagNameNS(_,name){return this.children.flatMap(c=>[...(c.o.tag===name?[c]:[]),...c.getElementsByTagNameNS('*',name)]);}
 getElementsByTagName(name){return this.getElementsByTagNameNS('*',name);}
}
class DOMParser{
 parseFromString(xml){const code="import sys,json,xml.etree.ElementTree as E\ndef node(e): return {'tag':e.tag.split('}')[-1],'attrs':e.attrib,'text':''.join(e.itertext()),'children':[node(c) for c in e]}\nprint(json.dumps(node(E.fromstring(sys.stdin.read()))))";const r=spawnSync('python',['-c',code],{input:xml,encoding:'utf8',maxBuffer:10000000});if(r.status)throw Error('XML parse error');return new XmlNode({tag:'document',children:[JSON.parse(r.stdout)]});}
}
let downloaded;const c=vm.createContext({DOMParser,JSZip,Blob,Uint8Array,DataView,ArrayBuffer,console,crypto:require('crypto').webcrypto,navigator:{language:'es'},localStorage:{getItem(){},setItem(){}},fetch:async path=>{try{const b=fs.readFileSync('dist/'+path);return{ok:true,arrayBuffer:async()=>b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength)}}catch{return{ok:false}}},URL:{createObjectURL:blob=>(downloaded=blob,'blob:test'),revokeObjectURL(){}},document:{createElement:()=>({click(){},remove(){}}),body:{append(){}}},setTimeout:()=>1});
for(const f of ['i18n','bank','banks','workbook'])vm.runInContext(fs.readFileSync('dist/'+f+'.js','utf8'),c);
const run=s=>vm.runInContext(s,c);const file=b=>({arrayBuffer:async()=>b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength)});
(async()=>{
 for(const lang of ['es','en']){c.input=file(fs.readFileSync(`dist/downloads/template-${lang}.xlsx`));run(`I18n.set('${lang}')`);const parsed=await run('BankWorkbook.read(input)');assert.deepEqual(parsed.errors,[]);assert.equal(parsed.bank.cards[0].correctAnswer,'4');assert.equal(parsed.bank.language,lang);assert.equal(parsed.bank.cards.length,1);}
 run("I18n.set('es');big={name:'Grande',topic:'Prueba',description:'QA',version:'1',source:'QA',language:'en',cards:Array.from({length:1000},(_,i)=>({id:'TEST-'+i,points:[100,200,300][i%3],type:'pregunta',question:'<script>not executable</script> '+i,options:['A','B','C','D'],correctAnswer:'C',reference:'',explanation:'',status:'available'}))}");
 await run('BankWorkbook.exportBank(big)');c.input=file(Buffer.from(await downloaded.arrayBuffer()));const parsed=await run('BankWorkbook.read(input)');assert.equal(parsed.errors.length,0);assert.equal(parsed.bank.cards.length,1000);assert.equal(parsed.bank.cards[999].question,'<script>not executable</script> 999');assert.equal(parsed.bank.cards.filter(c=>c.points===500).length,0);
 let zip=await JSZip.loadAsync(fs.readFileSync('dist/downloads/template-es.xlsx'));const sheetPath=Object.keys(zip.files).find(p=>/worksheets\/sheet3\.xml/.test(p));const text=await zip.file(sheetPath).async('string');zip.file(sheetPath,text.replace(/(<x:c[^>]*r="[A-Z]+2"[^>]*>)/,'$1<x:f>1+1</x:f>'));c.input=file(Buffer.from(await zip.generateAsync({type:'nodebuffer'})));await assert.rejects(run('BankWorkbook.read(input)'),/fórmulas/);
 zip=await JSZip.loadAsync(fs.readFileSync('dist/downloads/template-es.xlsx'));zip.file('xl/workbook.xml',(await zip.file('xl/workbook.xml').async('string')).replace('DESAFIOS','OTHER'));c.input=file(Buffer.from(await zip.generateAsync({type:'nodebuffer'})));await assert.rejects(run('BankWorkbook.read(input)'),/Faltan las hojas/);
 c.input=file(Buffer.from('invalid'));await assert.rejects(run('BankWorkbook.read(input)'),/XLSX/);
 const old=run('BankStore.current().name');c.input=parsed.bank;await assert.rejects(run('BankStore.activate(input)'),/IndexedDB/);assert.equal(run('BankStore.current().name'),old);
 for(const lang of ['es','en']){run(`I18n.set('${lang}')`);await run('BankWorkbook.kit()');const kit=await JSZip.loadAsync(await downloaded.arrayBuffer());assert.deepEqual(Object.keys(kit.files).sort(),['Plantilla_Banco_Explorador.xlsx','Prompt_Generador_Banco.txt'].sort());assert(Buffer.from(await kit.file('Prompt_Generador_Banco.txt').async('uint8array')).equals(fs.readFileSync('scripts/approved-sources/Prompt_Generador_Banco.txt')));assert(Buffer.from(await kit.file('Plantilla_Banco_Explorador.xlsx').async('uint8array')).equals(fs.readFileSync(`dist/downloads/template-${lang}.xlsx`)));}
 console.log('PASS: actual XLSX templates ES/EN, import/export roundtrip with 1000 cards and empty category, text content preserved, missing sheets/invalid ZIP/formulas rejected, failed storage preserves active bank.');
})().catch(e=>{console.error(e);process.exitCode=1;});
