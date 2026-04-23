/*************************************************
 * Guardianes Climáticos MJB / Pluvi v1.2
 *************************************************/
const CFG = {
  SHEET_CONFIG: 'Configuracion',
  SHEET_REGISTROS: 'Registros',
  SHEET_DASHBOARD: 'Dashboard',
  SHEET_COMPARATIVOS: 'Comparativos',
  SHEET_INFORME: 'Informe',
  FORM_TITLE: 'Registro Pluviómetro Escolar - Guardianes Climáticos MJB',
  SCHOOL_NAME: 'Institución Educativa Manuel J. Betancur',
  SEDES: ['Manuel J. Betancur', 'Gustavo Rodas Isaza'],
  TZ: 'America/Bogota'
};
const HEADERS_REGISTROS = ['Timestamp','Sede','Fecha','Hora','Institucion','Observador','Precipitacion_mm','Condicion','Observaciones','Intensidad','SemanaISO','Mes','Ano','MesClave'];
function onOpen(){SpreadsheetApp.getUi().createMenu('Guardianes Climáticos').addItem('1. Instalar sistema','setupSistemaPluviometro').addItem('2. Sincronizar respuestas a Registros','ejecutarSincronizacionManual').addItem('3. Refrescar comparativos','refreshComparativos_').addItem('4. Probar backend (ping)','probarPing_').addItem('5. Habilitar descargas públicas','habilitarDescargasPublicas').addToUi();}
function setupSistemaPluviometro(){const ss=SpreadsheetApp.getActiveSpreadsheet();prepareConfigSheet_(getOrCreateSheet_(ss,CFG.SHEET_CONFIG));prepareRegistrosSheet_(getOrCreateSheet_(ss,CFG.SHEET_REGISTROS));prepareDashboardSheet_(getOrCreateSheet_(ss,CFG.SHEET_DASHBOARD));prepareComparativosSheet_(getOrCreateSheet_(ss,CFG.SHEET_COMPARATIVOS));prepareInformeSheet_(getOrCreateSheet_(ss,CFG.SHEET_INFORME));const form=getOrCreateForm_();form.setDestination(FormApp.DestinationType.SPREADSHEET,ss.getId());ensureFormSubmitTrigger_(form);ensurePublicDownloads_(ss);writeConfigValues_(ss,form);resyncRegistrosFromForm_();refreshComparativos_();
  prepareInformeSheet_(SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CFG.SHEET_INFORME));SpreadsheetApp.flush();return {ok:true,message:'Sistema instalado correctamente',spreadsheetId:ss.getId(),spreadsheetUrl:ss.getUrl(),formId:form.getId(),formEditUrl:form.getEditUrl(),formPublishedUrl:form.getPublishedUrl()};}
function getOrCreateForm_(){const props=PropertiesService.getScriptProperties();let form=null;const formId=props.getProperty('FORM_ID');if(formId){try{form=FormApp.openById(formId);}catch(err){form=null;}}if(!form){form=FormApp.create(CFG.FORM_TITLE);props.setProperty('FORM_ID',form.getId());}form.setTitle(CFG.FORM_TITLE);form.setDescription('Formulario de registro de precipitación para Guardianes Climáticos MJB.');form.setAllowResponseEdits(false);form.setCollectEmail(false);form.setShowLinkToRespondAgain(true);rebuildFormItems_(form);return form;}
function rebuildFormItems_(form){while(form.getItems().length>0){form.deleteItem(0);}form.addMultipleChoiceItem().setTitle('Sede').setRequired(true).setChoiceValues(CFG.SEDES);form.addDateItem().setTitle('Fecha').setRequired(true);form.addTimeItem().setTitle('Hora').setRequired(true);form.addTextItem().setTitle('Institucion').setRequired(true).setHelpText(CFG.SCHOOL_NAME);form.addTextItem().setTitle('Observador').setRequired(true);form.addTextItem().setTitle('Precipitacion_mm').setRequired(true).setHelpText('Ingrese solo el valor numérico en milímetros. Ejemplo: 12.5');form.addMultipleChoiceItem().setTitle('Condicion').setRequired(true).setChoiceValues(['Cielo despejado','Llovizna','Lluvia moderada','Lluvia intensa','Tormenta','Nublado sin lluvia']);form.addParagraphTextItem().setTitle('Observaciones').setRequired(false);}
function getOrCreateSheet_(ss,name){let sh=ss.getSheetByName(name);if(!sh) sh=ss.insertSheet(name);return sh;}
function prepareConfigSheet_(sheet){sheet.clear();const rows=[['Clave','Valor'],['Institucion',CFG.SCHOOL_NAME],['Sedes',CFG.SEDES.join(' | ')],['Spreadsheet_ID',SpreadsheetApp.getActiveSpreadsheet().getId()],['Spreadsheet_URL',SpreadsheetApp.getActiveSpreadsheet().getUrl()],['Form_ID',''],['Form_Edit_URL',''],['Form_Published_URL',''],['Export_XLSX_URL',''],['Export_PDF_URL',''],['WebApp_URL',''],['Ultima_actualizacion',new Date()]];sheet.getRange(1,1,rows.length,2).setValues(rows);sheet.setFrozenRows(1);sheet.autoResizeColumns(1,2);}
function prepareRegistrosSheet_(sheet){if(!sheet) return;const lastRow=sheet.getLastRow(),lastCol=sheet.getLastColumn();const needsHeaders=lastRow===0||lastCol===0||HEADERS_REGISTROS.some((h,i)=>String(sheet.getRange(1,i+1).getValue()).trim()!==h);if(needsHeaders){sheet.clear();sheet.getRange(1,1,1,HEADERS_REGISTROS.length).setValues([HEADERS_REGISTROS]);sheet.setFrozenRows(1);}sheet.autoResizeColumns(1,HEADERS_REGISTROS.length);}
function prepareDashboardSheet_(sheet){sheet.clear();sheet.getRange('A1').setValue('Guardianes Climáticos MJB - Dashboard');sheet.getRange('A3').setValue('Panel generado y alimentado desde Apps Script.');}
function prepareComparativosSheet_(sheet){sheet.clear();const headers=['Tipo','Clave','Sede','Total_registros','Suma_mm','Promedio_mm','Max_mm'];sheet.getRange(1,1,1,headers.length).setValues([headers]);sheet.setFrozenRows(1);sheet.autoResizeColumns(1,headers.length);}
function ensureFormSubmitTrigger_(form){const formId=form.getId();const triggers=ScriptApp.getProjectTriggers();const exists=triggers.some(t=>t.getHandlerFunction()==='onFormSubmitHandler'&&t.getTriggerSourceId()===formId);if(!exists){ScriptApp.newTrigger('onFormSubmitHandler').forForm(form).onFormSubmit().create();}}
function onFormSubmitHandler(e){syncLatestFormResponseToRegistros_(e);refreshComparativos_();prepareInformeSheet_(SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CFG.SHEET_INFORME));}
function ejecutarSincronizacionManual(){resyncRegistrosFromForm_();refreshComparativos_();prepareInformeSheet_(SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CFG.SHEET_INFORME));}
function syncLatestFormResponseToRegistros_(e){const ss=SpreadsheetApp.getActiveSpreadsheet();const registrosSheet=ss.getSheetByName(CFG.SHEET_REGISTROS);prepareRegistrosSheet_(registrosSheet);if(!e||!e.namedValues){resyncRegistrosFromForm_();return;}const named=normalizeNamedValues_(e.namedValues);const timestamp=firstValue_(named['timestamp'])||new Date();const sede=firstValue_(named['sede']);const fechaRaw=firstValue_(named['fecha']);const horaRaw=firstValue_(named['hora']);const institucion=firstValue_(named['institucion'])||firstValue_(named['instit'])||CFG.SCHOOL_NAME;const observador=firstValue_(named['observador']);const precip=toNumber_(firstValue_(named['precipitacion_mm']));const condicion=firstValue_(named['condicion']);const observaciones=firstValue_(named['observaciones']);const fechaDate=normalizeDate_(fechaRaw);const fechaText=fechaDate?Utilities.formatDate(fechaDate,CFG.TZ,'yyyy-MM-dd'):String(fechaRaw||'').trim();const horaText=normalizeHoraText_(horaRaw);registrosSheet.appendRow([timestamp,sede,fechaText,horaText,institucion,observador,precip,condicion,observaciones,classifyIntensity_(precip),fechaDate?getISOWeek_(fechaDate):'',fechaDate?(fechaDate.getMonth()+1):'',fechaDate?fechaDate.getFullYear():'',fechaDate?(fechaDate.getFullYear()+'-'+pad2_(fechaDate.getMonth()+1)):'' ]);}
function resyncRegistrosFromForm_(){const ss=SpreadsheetApp.getActiveSpreadsheet();const registrosSheet=ss.getSheetByName(CFG.SHEET_REGISTROS);prepareRegistrosSheet_(registrosSheet);if(registrosSheet.getLastRow()>1){registrosSheet.getRange(2,1,registrosSheet.getLastRow()-1,registrosSheet.getLastColumn()).clearContent();}const responseSheet=detectFormResponseSheet_(ss);if(!responseSheet){throw new Error('No se encontró la hoja de respuestas del formulario.');}const values=responseSheet.getDataRange().getValues();if(values.length<2) return;const rawHeaders=values[0].map(h=>String(h).trim());const headers=rawHeaders.map(h=>normalizeHeader_(h));const map=arrayToMap_(headers);const requiredHeaders=['timestamp','sede','fecha','hora','observador','precipitacion_mm','condicion','observaciones'];const missing=requiredHeaders.filter(h=>!(h in map));if(missing.length){throw new Error('Faltan columnas en la hoja de respuestas: '+missing.join(', '));}const out=[];for(let i=1;i<values.length;i++){const row=values[i];if(!row.some(v=>String(v).trim()!=='')) continue;const timestamp=safeCell_(row,map['timestamp']);const sede=safeCell_(row,map['sede']);const fechaRaw=safeCell_(row,map['fecha']);const horaRaw=safeCell_(row,map['hora']);const institucion=safeCell_(row,map['institucion'])||safeCell_(row,map['instit'])||CFG.SCHOOL_NAME;const observador=safeCell_(row,map['observador']);const precip=toNumber_(safeCell_(row,map['precipitacion_mm']));const condicion=safeCell_(row,map['condicion']);const observaciones=safeCell_(row,map['observaciones']);const fechaDate=normalizeDate_(fechaRaw);const fechaText=fechaDate?Utilities.formatDate(fechaDate,CFG.TZ,'yyyy-MM-dd'):String(fechaRaw||'').trim();const horaText=normalizeHoraText_(horaRaw);out.push([timestamp,sede,fechaText,horaText,institucion,observador,precip,condicion,observaciones,classifyIntensity_(precip),fechaDate?getISOWeek_(fechaDate):'',fechaDate?(fechaDate.getMonth()+1):'',fechaDate?fechaDate.getFullYear():'',fechaDate?(fechaDate.getFullYear()+'-'+pad2_(fechaDate.getMonth()+1)):'' ]);}if(out.length){registrosSheet.getRange(2,1,out.length,HEADERS_REGISTROS.length).setValues(out);}registrosSheet.autoResizeColumns(1,HEADERS_REGISTROS.length);}
function detectFormResponseSheet_(ss){const reserved=[CFG.SHEET_CONFIG,CFG.SHEET_REGISTROS,CFG.SHEET_DASHBOARD,CFG.SHEET_COMPARATIVOS, CFG.SHEET_INFORME];const sheets=ss.getSheets();for(let i=0;i<sheets.length;i++){const sh=sheets[i],name=sh.getName();if(reserved.indexOf(name)!==-1) continue;const lastRow=sh.getLastRow(),lastCol=sh.getLastColumn();if(lastRow<1||lastCol<1) continue;const headers=sh.getRange(1,1,1,lastCol).getValues()[0].map(h=>normalizeHeader_(String(h).trim()));if(headers.indexOf('timestamp')!==-1&&headers.indexOf('sede')!==-1&&headers.indexOf('fecha')!==-1&&headers.indexOf('precipitacion_mm')!==-1){return sh;}}return null;}

function prepareInformeSheet_(sheet){
  if(!sheet) return;
  sheet.clear();
  sheet.setHiddenGridlines(true);
  sheet.setColumnWidths(1, 8, 140);
  sheet.setRowHeights(1, 10, 32);

  // Logo desde GitHub Pages. Si cambias el repo, actualiza esta URL.
  sheet.getRange('A1').setFormula('=IMAGE("https://losyoguis.github.io/pluvi-metro-mjb/assets/escudomjb.png",1)');
  sheet.getRange('B1:H1').merge();
  sheet.getRange('B1').setValue('Guardianes Climáticos MJB');
  sheet.getRange('B1').setFontSize(20).setFontWeight('bold');

  sheet.getRange('B2:H2').merge();
  sheet.getRange('B2').setValue('Proyecto: Sistema de medición de la huella de carbono educativa de Medellín');
  sheet.getRange('B2').setFontSize(12).setFontWeight('bold');

  sheet.getRange('B3:H3').merge();
  sheet.getRange('B3').setValue('Líder: Juan Carlos Blandón Vargas');
  sheet.getRange('B3').setFontSize(11);

  sheet.getRange('A5').setValue('Indicador');
  sheet.getRange('B5').setValue('Valor');
  sheet.getRange('A5:B5').setFontWeight('bold').setBackground('#006636').setFontColor('#ffffff');

  const registros = getRegistrosObjects_();
  const total = registros.length;
  const suma = registros.reduce((a,b)=>a+Number(b.Precipitacion_mm||0),0);
  const max = registros.reduce((a,b)=>Math.max(a,Number(b.Precipitacion_mm||0)),0);
  const promedio = total ? suma/total : 0;

  const rows = [
    ['Registros almacenados', total],
    ['Lluvia acumulada (mm)', round1_(suma)],
    ['Promedio por registro (mm)', round1_(promedio)],
    ['Máximo registrado (mm)', round1_(max)],
    ['Última actualización', new Date()]
  ];
  sheet.getRange(6,1,rows.length,2).setValues(rows);

  sheet.getRange('A13:H13').merge();
  sheet.getRange('A13').setValue('Este informe se genera desde Google Sheets para el proyecto Guardianes Climáticos MJB.');
  sheet.getRange('A13').setFontStyle('italic').setFontColor('#666666');
}


function ensurePublicDownloads_(ss){
  try {
    const file = DriveApp.getFileById(ss.getId());
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return true;
  } catch(err) {
    console.error('No se pudo habilitar descarga pública:', err);
    return false;
  }
}

function writeConfigValues_(ss,form){const sh=ss.getSheetByName(CFG.SHEET_CONFIG);if(!sh) return;const informeSheet=ss.getSheetByName(CFG.SHEET_INFORME);const informeGid=informeSheet?informeSheet.getSheetId():0;const exportXlsx=ss.getUrl().replace(/edit$/,'')+'export?format=xlsx';const exportPdf=ss.getUrl().replace(/edit$/,'')+'export?format=pdf&gid='+informeGid+'&portrait=true&size=A4&fitw=true&sheetnames=false&printtitle=false&pagenumbers=false&gridlines=false&fzr=false';const values={'Institucion':CFG.SCHOOL_NAME,'Sedes':CFG.SEDES.join(' | '),'Spreadsheet_ID':ss.getId(),'Spreadsheet_URL':ss.getUrl(),'Form_ID':form.getId(),'Form_Edit_URL':form.getEditUrl(),'Form_Published_URL':form.getPublishedUrl(),'Export_XLSX_URL':exportXlsx,'Export_PDF_URL':exportPdf,'Ultima_actualizacion':new Date()};const data=sh.getDataRange().getValues();for(let i=1;i<data.length;i++){const key=String(data[i][0]).trim();if(values.hasOwnProperty(key)){sh.getRange(i+1,2).setValue(values[key]);}}}
function refreshComparativos_(){const ss=SpreadsheetApp.getActiveSpreadsheet();const sh=ss.getSheetByName(CFG.SHEET_COMPARATIVOS);if(!sh) return;prepareComparativosSheet_(sh);const registros=getRegistrosObjects_();if(!registros.length) return;const output=[];['Fecha','SemanaISO','MesClave','Ano'].forEach(tipo=>{const grouped=groupBy_(registros,r=>String(r[tipo]||''));Object.keys(grouped).forEach(clave=>{const items=grouped[clave];const sedeGrouped=groupBy_(items,r=>String(r.Sede||''));Object.keys(sedeGrouped).forEach(sede=>{const arr=sedeGrouped[sede];const suma=arr.reduce((a,b)=>a+Number(b.Precipitacion_mm||0),0);const max=arr.reduce((a,b)=>Math.max(a,Number(b.Precipitacion_mm||0)),0);const avg=arr.length?(suma/arr.length):0;output.push([tipo,clave,sede,arr.length,round1_(suma),round1_(avg),round1_(max)]);});});});const porSede=groupBy_(registros,r=>String(r.Sede||''));Object.keys(porSede).forEach(sede=>{const arr=porSede[sede];const suma=arr.reduce((a,b)=>a+Number(b.Precipitacion_mm||0),0);const max=arr.reduce((a,b)=>Math.max(a,Number(b.Precipitacion_mm||0)),0);const avg=arr.length?(suma/arr.length):0;output.push(['Sede',sede,sede,arr.length,round1_(suma),round1_(avg),round1_(max)]);});if(output.length){sh.getRange(2,1,output.length,output[0].length).setValues(output);}sh.autoResizeColumns(1,7);}
function doGet(e){const action=String((e&&e.parameter&&e.parameter.action)||'bootstrap').trim();const callback=e&&e.parameter?e.parameter.callback:'';let payload={};switch(action){case 'ping':payload={ok:true,action:'ping',message:'Backend activo',timestamp:new Date().toISOString()};break;case 'data':payload={ok:true,action:'data',data:filterRegistros_(getRegistrosObjects_(),(e&&e.parameter)||{})};payload.total=payload.data.length;break;case 'comparativos':payload={ok:true,action:'comparativos',data:getComparativosObjects_()};break;case 'bootstrap':default:payload=buildBootstrapPayload_((e&&e.parameter)||{});break;}if(callback){return ContentService.createTextOutput(`${callback}(${JSON.stringify(payload)})`).setMimeType(ContentService.MimeType.JAVASCRIPT);}return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);}
function buildBootstrapPayload_(params){const registros=filterRegistros_(getRegistrosObjects_(),params);const comparativos=getComparativosObjects_();const config=getConfigObject_();const total=registros.length;const lluviaAcumulada=registros.reduce((a,b)=>a+Number(b.Precipitacion_mm||0),0);const maximoRegistro=registros.reduce((a,b)=>Math.max(a,Number(b.Precipitacion_mm||0)),0);const resumenPorSede=Object.keys(groupBy_(registros,r=>String(r.Sede||''))).map(sede=>{const arr=registros.filter(r=>String(r.Sede||'')===sede);return {sede,totalRegistros:arr.length,lluviaAcumulada:round1_(arr.reduce((a,b)=>a+Number(b.Precipitacion_mm||0),0))};});return {ok:true,action:'bootstrap',updatedAt:new Date().toISOString(),config,kpis:{totalRegistros:total,lluviaAcumulada:round1_(lluviaAcumulada),maximoRegistro:round1_(maximoRegistro)},resumenPorSede,registros:sortDesc_(registros).slice(0,300),comparativos};}
function getRegistrosObjects_(){const sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CFG.SHEET_REGISTROS);if(!sh) return [];const values=sh.getDataRange().getValues();if(values.length<2) return [];const headers=values[0];return values.slice(1).filter(r=>r.some(c=>String(c).trim()!=='' )).map(r=>rowToObject_(headers,r));}
function getComparativosObjects_(){const sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CFG.SHEET_COMPARATIVOS);if(!sh) return [];const values=sh.getDataRange().getValues();if(values.length<2) return [];const headers=values[0];return values.slice(1).filter(r=>r.some(c=>String(c).trim()!=='' )).map(r=>rowToObject_(headers,r));}
function getConfigObject_(){const sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CFG.SHEET_CONFIG);if(!sh) return {};const values=sh.getDataRange().getValues();const obj={};for(let i=1;i<values.length;i++) obj[String(values[i][0]).trim()]=values[i][1];return obj;}
function filterRegistros_(rows,params){let out=rows.slice();if(params.sede) out=out.filter(r=>String(r.Sede||'').trim()===String(params.sede).trim());if(params.year) out=out.filter(r=>String(r.Ano)===String(params.year));if(params.month) out=out.filter(r=>String(r.Mes)===String(params.month));if(params.week) out=out.filter(r=>String(r.SemanaISO)===String(params.week));if(params.date) out=out.filter(r=>sameDateText_(r.Fecha,params.date));return out;}
function rowToObject_(headers,row){const obj={};headers.forEach((h,i)=>obj[String(h).trim()]=row[i]);return obj;}
function arrayToMap_(arr){const out={};arr.forEach((v,i)=>out[String(v).trim()]=i);return out;}
function safeCell_(row,idx){if(idx===undefined||idx===null||idx<0) return ''; return row[idx];}
function firstValue_(arr){if(!arr||!arr.length) return ''; return arr[0];}
function toNumber_(v){const n=Number(String(v||'').replace(',','.')); return isNaN(n)?0:n;}
function classifyIntensity_(mm){const n=Number(mm||0); if(n<=5) return 'Ligera'; if(n<=20) return 'Moderada'; return 'Fuerte';}
function normalizeDate_(value){if(!value) return null; if(Object.prototype.toString.call(value)==='[object Date]'&&!isNaN(value.getTime())) return value; const d=new Date(value); return isNaN(d.getTime())?null:d;}
function normalizeHoraText_(value){if(!value) return ''; if(Object.prototype.toString.call(value)==='[object Date]'&&!isNaN(value.getTime())) return Utilities.formatDate(value,CFG.TZ,'HH:mm'); const text=String(value).trim(); const match=text.match(/^(\d{1,2}):(\d{2})/); if(match) return pad2_(match[1])+':'+match[2]; return text;}
function getISOWeek_(date){const tmp=new Date(Date.UTC(date.getFullYear(),date.getMonth(),date.getDate())); const dayNum=tmp.getUTCDay()||7; tmp.setUTCDate(tmp.getUTCDate()+4-dayNum); const yearStart=new Date(Date.UTC(tmp.getUTCFullYear(),0,1)); return Math.ceil((((tmp-yearStart)/86400000)+1)/7);}
function pad2_(n){return ('0'+n).slice(-2);}
function round1_(n){return Math.round(Number(n||0)*10)/10;}
function groupBy_(arr,keyFn){return arr.reduce((acc,item)=>{const key=keyFn(item); if(!acc[key]) acc[key]=[]; acc[key].push(item); return acc;},{});}
function sortDesc_(rows){return rows.sort((a,b)=>{const da=String(a.Fecha||'')+' '+String(a.Hora||''); const db=String(b.Fecha||'')+' '+String(b.Hora||''); return db.localeCompare(da);});}
function sameDateText_(sheetDateValue,paramDate){const d=normalizeDate_(sheetDateValue); if(!d) return false; const text=Utilities.formatDate(d,CFG.TZ,'yyyy-MM-dd'); return text===String(paramDate).trim();}
function normalizeHeader_(h){const txt=String(h||'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''); if(txt==='marca temporal') return 'timestamp'; if(txt==='timestamp') return 'timestamp'; if(txt==='sede') return 'sede'; if(txt==='fecha') return 'fecha'; if(txt==='hora') return 'hora'; if(txt==='institucion') return 'institucion'; if(txt==='instit') return 'instit'; if(txt==='observador') return 'observador'; if(txt==='precipitacion_mm') return 'precipitacion_mm'; if(txt==='condicion') return 'condicion'; if(txt==='observaciones') return 'observaciones'; return txt;}
function normalizeNamedValues_(namedValues){const out={}; Object.keys(namedValues).forEach(key=>out[normalizeHeader_(key)]=namedValues[key]); return out;}
function probarPing_(){SpreadsheetApp.getUi().alert('El backend está cargado. Publica la Web App y prueba con ?action=ping');}


function habilitarDescargasPublicas(){
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ok = ensurePublicDownloads_(ss);
  writeConfigValues_(ss, getOrCreateForm_());
  SpreadsheetApp.getUi().alert(ok
    ? 'Descargas públicas habilitadas: cualquier persona con el enlace podrá descargar Excel/PDF.'
    : 'No se pudieron habilitar las descargas públicas. Revise permisos de Drive.');
}
