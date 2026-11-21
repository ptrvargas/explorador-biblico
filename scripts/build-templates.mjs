import fs from 'node:fs/promises';
import vm from 'node:vm';
import {Workbook,SpreadsheetFile} from '/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs';
const root='/workspace/sites/gran-desafio';
const c=vm.createContext({navigator:{language:'es'},localStorage:{getItem(){},setItem(){}}});
vm.runInContext(await fs.readFile(root+'/dist/i18n.js','utf8'),c);
for(const lang of ['es','en']){
 vm.runInContext(`I18n.set('${lang}')`,c);const t=k=>vm.runInContext(`T('${k}')`,c);
 const wb=Workbook.create(),instructions=wb.worksheets.add('INSTRUCCIONES'),info=wb.worksheets.add('INFORMACION'),cards=wb.worksheets.add('DESAFIOS');
 for(const sheet of [instructions,info,cards]){sheet.showGridLines=false;sheet.tabColor='#183c52';sheet.getRange('A1:K40').format.font={name:'Arial',size:12,color:'#15293b'};sheet.getRange('A1:K40').format.wrapText=true;sheet.getRange('A1:K40').format.verticalAlignment='center';sheet.freezePanes.freezeRows(1);}
 instructions.getRange('A1').values=[[t('templateTitle')]];
 const sections=lang==='es'?[
 ['1. Completa INFORMACION','Nombre, tema, descripción, versión, fuente principal e idioma son obligatorios. Autor y fecha son opcionales.'],
 ['2. Crea tus tarjetas','Cada fila en DESAFIOS contiene una tarjeta. Elimina el ejemplo cuando añadas tus propias tarjetas. Usa un ID único. No cambies los nombres de hojas ni columnas.'],
 ['3. Puntos y tipos','PUNTOS: 100, 200, 300, 500. TIPO: PREGUNTA, CITA, COMPLETAR, EMOJI, ORDEN. Estos tipos se usan también para contenido en inglés.'],
 ['4. Respuesta correcta','Debe contener el texto EXACTO de una opción. No escribas A, B, C o D. Las cuatro opciones deben ser distintas.'],
 ['5. Referencias y explicación','REFERENCIA y EXPLICACION son opcionales. Para bancos bíblicos, incluye la referencia y la versión usada.'],
 ['6. Revisa errores frecuentes','IDs duplicados, opciones vacías, espacios extra en la respuesta, tipos traducidos y columnas renombradas impiden la activación. No uses fórmulas ni macros.'],
 ['7. Importa y activa','Guarda como XLSX. En el juego abre Ajustes > Personalizar banco > Importar XLSX. Corrige los errores. Revisa el resumen y pulsa Activar banco. Los bancos se guardan solo en tu dispositivo.']
 ]:[['1. Fill INFORMACION','Bank name, topic, description, version, main source and language are required. Author and date are optional.'],['2. Create your cards','Each DESAFIOS row is one card. Delete the example when adding your cards. Use a unique ID. Do not rename sheets or columns.'],['3. Points and types','PUNTOS: 100, 200, 300, 500. TIPO: PREGUNTA, CITA, COMPLETAR, EMOJI, ORDEN. These canonical types also apply to English content.'],['4. Correct answer','Use the EXACT text of one option. Do not write A, B, C or D. All four options must be different.'],['5. References and explanations','REFERENCIA and EXPLICACION are optional. For Bible banks, include the reference and Bible version used.'],['6. Common errors','Duplicate IDs, blank options, extra spaces in answers, translated types and renamed columns prevent activation. Do not use formulas or macros.'],['7. Import and activate','Save as XLSX. Open Settings > Customize bank > Import XLSX. Fix errors. Review the summary and select Activate bank. Banks are stored only on your device.']];
 instructions.getRange('A2:B8').values=sections;instructions.getRange('A1:B1').merge();instructions.getRange('A:A').format.columnWidth=28;instructions.getRange('B:B').format.columnWidth=90;instructions.getRange('A2:B8').format.rowHeight=78;
 const labels=lang==='es'?['Nombre del banco','Tema','Descripción','Autor','Versión','Fuente principal','Idioma','Fecha']:['Bank name','Topic','Description','Author','Version','Main source','Language','Date'];
 info.getRange('A1:B8').values=labels.map((s,i)=>[s,[t('exampleBank'),t('exampleTopic'),t('exampleDesc'),'','1.0',t('exampleSource'),lang,''][i]]);info.getRange('A:A').format.columnWidth=26;info.getRange('B:B').format.columnWidth=90;info.getRange('A1:B8').format.rowHeight=42;info.getRange('A1:A8').format.fill='#183c52';info.getRange('A1:A8').format.font={name:'Arial',size:12,bold:true,color:'#FFFFFF'};info.getRange('B1:B8').format.font={name:'Arial',size:12,color:'#2459A6'};
 const headers=['ID','PUNTOS','TIPO','PREGUNTA','OPCION_A','OPCION_B','OPCION_C','OPCION_D','RESPUESTA_CORRECTA','REFERENCIA','EXPLICACION'];
 cards.getRange('A1:K2').values=[headers,['EJ-001',100,'PREGUNTA',t('exampleQuestion'),'2','3','4','5','4','',lang==='es'?'2 + 2 = 4.':'2 + 2 = 4.']];
 const widths=[18,12,20,54,25,25,25,25,30,26,50];widths.forEach((w,i)=>cards.getRange(String.fromCharCode(65+i)+':'+String.fromCharCode(65+i)).format.columnWidth=w);cards.getRange('A1:K1').format.rowHeight=44;cards.getRange('A2:K2').format.rowHeight=64;
 for(const [sheet,range] of [[instructions,'A1:B1'],[cards,'A1:K1']]){sheet.getRange(range).format.fill='#183c52';sheet.getRange(range).format.font={name:'Arial',size:13,bold:true,color:'#FFFFFF'};}
 wb.recalculate();await wb.inspect({kind:'table',range:'DESAFIOS!A1:K2',tableMaxRows:2,tableMaxCols:11,maxChars:1000});
 for(const [sheet,range] of [['INSTRUCCIONES','A1:B8'],['INFORMACION','A1:B8'],['DESAFIOS','A1:D2']]){const image=await wb.render({sheetName:sheet,range,scale:1,format:'png'});await fs.writeFile(`/tmp/explorador-xlsx-v2/${lang}-${sheet}.png`,new Uint8Array(await image.arrayBuffer()));}
 await(await SpreadsheetFile.exportXlsx(wb)).save(root+`/dist/downloads/template-${lang}.xlsx`);console.log(`Created ${lang}: 3 exact sheets, 11 canonical columns.`);
}
