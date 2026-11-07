import {preparePrintEmphasis} from './print-emphasis.js';
import {applyCharacterPaperVersion} from './character-paper-version.js';
import {characterPaperLayout} from './paper-layout.js';
import {applyCharacterBackground} from './character-backgrounds.js';
import {attachAbilitySummaries} from './ability-summaries.js';
import {fitCharacterText} from './text-fitting.js';
import {applyCharacterLanguage,fitCharacterLabels} from './character-labels.js';
import {selectedFeatureText,backFeatureText,featureListHtml} from './feature-selection.js';
import {extractCharacterFields,characterSheetHtml} from './character-sheet.js';
import {preparationLimit} from './preparation.js';
import {getDocument,GlobalWorkerOptions} from './vendor/pdf.mjs';
import {extractPdfSpells} from './pdf-spell-parser.js';
import {findSummary,uniqueSpellsByName,renderSlotBoxes,spellIndicators} from './pdf-library.js';
import {escape as e} from './core.js';
GlobalWorkerOptions.workerSrc=new URL('./vendor/pdf.worker.mjs',import.meta.url).href;
const form=document.querySelector('#upload-form'), button=form.querySelector('button'), status=document.querySelector('#status'), output=document.querySelector('#output');
const printTools=document.querySelector('.sheet-tools'),emptyState=document.querySelector('#empty-state');
document.querySelector('#print-sheet').addEventListener('click',()=>window.print());
const languageSelect=document.querySelector('#summary-language');
const backgroundSelect=document.querySelector('#character-background');
backgroundSelect.addEventListener('change',()=>applyCharacterBackground(output,backgroundSelect.value));
const borderlessSelect=document.querySelector('#borderless-print');
const paperSizeSelect=document.querySelector('#paper-size');
const fontSizeSelect=document.querySelector('#spell-font-size');
function applyFontSize() {
  const size=Number(fontSizeSelect.value);
  if(Number.isInteger(size) && size>=8 && size<=16){document.documentElement.style.setProperty('--spell-font-size',`${size}pt`);checkCharacterOverflow();}
}
fontSizeSelect.addEventListener('change',applyFontSize);
applyFontSize();
const emphasisSelect=document.querySelector('#emphasis-color');
const emphasisColors={red:['#b6272e','#8d1c24','#e04a4f'],blue:['#245c9c','#194371','#70a8e6'],green:['#2e6946','#214d33','#70b88b'],purple:['#714494','#51316b','#bc8cdf'],teal:['#176b70','#104d51','#66bac0'],charcoal:['#444950','#292d33','#b7bdc6']};
function applyEmphasisColor() {
 const [accent,dark,light]=emphasisColors[emphasisSelect.value] || emphasisColors.purple;
 const style=document.documentElement.style;
 for(const [key,value] of Object.entries({'--red':accent,'--red-dark':dark,'--accent-light':light,'--accent-tint':accent+'0d','--accent-border':accent+'40'}))style.setProperty(key,value);
}
emphasisSelect.addEventListener('change',applyEmphasisColor);
applyEmphasisColor();
const orientationSelect=document.querySelector('#print-orientation');
borderlessSelect.addEventListener('change',()=>{applyOrientation();requestAnimationFrame(checkCharacterOverflow);});
paperSizeSelect.addEventListener('change',()=>{applyOrientation();requestAnimationFrame(checkCharacterOverflow);});
const pageStyle=document.createElement('style');
pageStyle.id='print-page-size';
document.head.append(pageStyle);
function applyOrientation() {
  const orientation=document.body.dataset.sheetMode==='character'?'portrait':orientationSelect.value==='landscape'?'landscape':'portrait';
  document.body.dataset.borderless=String(borderlessSelect.checked);
  const margin=document.body.dataset.sheetMode==='character' && borderlessSelect.checked?'0':'10mm';
  const paper=paperSizeSelect.value==='letter'?'Letter':'A4';
  pageStyle.textContent=`@page { size: ${paper} ${orientation}; margin: ${margin}; }`;
  const layout=characterPaperLayout(paperSizeSelect.value,borderlessSelect.checked);
  const style=document.documentElement.style;
  for(const [key,value] of Object.entries({'--character-page-ratio':`${layout.pageWidth}/${layout.pageHeight}`,'--character-print-width':layout.pageWidth+'mm','--character-print-height':layout.pageHeight+'mm','--character-content-left':layout.left+'%','--character-content-top':layout.top+'%','--character-content-width':layout.contentWidthPercent+'%','--character-content-height':layout.contentHeightPercent+'%'}))style.setProperty(key,value);
  document.documentElement.dataset.orientation=orientation;
  applyCharacterPaperVersion(output,paperSizeSelect.value);
}
orientationSelect.addEventListener('change',applyOrientation);
applyOrientation();

let abilityPromise;
async function abilityLibrary(){
 return abilityPromise ||= fetch('./abilities.json').then(async r=>{if(!r.ok)throw new Error('Could not load ability summaries.');const d=await r.json();if(d.schema_version!==1 || !Array.isArray(d.abilities))throw new Error('Invalid ability library.');return d;}).catch(e=>{abilityPromise=null;throw e;});
}
let libraryPromise,lastCharacter;
const translationPromises={};
let sheetMode="spells";
function englishLibrary() {
  return libraryPromise ||= fetch('./spells.json').then(async response=>{if(!response.ok)throw new Error('Could not load the spell library.');const data=await response.json();if(data.schema_version!==1 || !data.spells)throw new Error('Invalid spell library.');return data;}).catch(error=>{libraryPromise=null;throw error;});
}
async function library(language='en') {
  const data=await englishLibrary();
  if(['es','fr','de','it','pt-BR'].includes(language)) {
    translationPromises[language] ||= fetch('./spells.'+language+'.json').then(async response=>{
      if(!response.ok)throw new Error('Could not load '+language+' summaries.');
      const translations=await response.json();
      if(translations.schema_version!==1 || translations.language!==language || !translations.summaries)throw new Error('Invalid translated summaries.');
      return translations;
    }).catch(error=>{delete translationPromises[language];throw error;});
    data.translations ||= {};
    data.translations[language]=await translationPromises[language];
  }
  return data;
}
languageSelect.addEventListener('change',async()=>{
  if(!lastCharacter)return;
  if(sheetMode==='character'){applyCharacterLanguage(output,languageSelect.value);output.querySelector('.feature-list').innerHTML=featureListHtml(lastCharacter.details.featureEntries,languageSelect.value);updateFeaturePlacement();return;}
  languageSelect.disabled=true;
  try { status.textContent=render(lastCharacter,await library(languageSelect.value));status.className=''; }
  catch(error) { languageSelect.value='en';status.textContent=render(lastCharacter,await englishLibrary())+' '+error.message+' Showing English.';status.className='error'; }
  finally { languageSelect.disabled=false; }
});
function render(character,library) {
 document.body.dataset.sheetMode=sheetMode;applyOrientation();
 document.querySelector('#character-actions').hidden=sheetMode!=='character';document.querySelector('#character-hint').hidden=sheetMode!=='character';
 if(sheetMode==='character') {output.innerHTML=characterSheetHtml(character.details,languageSelect.value);applyCharacterBackground(output,backgroundSelect.value);applyCharacterPaperVersion(output,paperSizeSelect.value);requestAnimationFrame(checkCharacterOverflow);document.querySelector('.sheet-tools h2').textContent='Your character sheet';return `Character sheet generated. ${character.details.featureEntries.filter(e=>e.summarySource).length}/${character.details.featureEntries.length} features matched to SRD summaries. Choose placement and Full text / Summary; review matches below. `+(character.details.summaryWarning||'');}
 document.querySelector('.sheet-tools h2').textContent='Your spell sheet';

  character={...character,spells:uniqueSpellsByName(character.spells)};
  const rows=[];let matched=0,ambiguous=0;
  const levels=[...new Set(character.spells.map(s=>s.level))].sort((a,b)=>(a ?? 99)-(b ?? 99));
  for(const level of levels) {
    const spells=character.spells.filter(s=>s.level===level), roman=['','I','II','III','IV','V','VI','VII','VIII','IX'][level] || level;
    rows.push(`<tr class="level-band"><td colspan="3">${level===null?'LEVEL UNKNOWN':level===0?'CANTRIPS':`LEVEL ${roman}`}</td><td colspan="3" class="level-meta">${renderSlotBoxes(level,character.spellSlots)}</td></tr>`);
    for(const spell of spells) {
      const result=findSummary(spell,library,languageSelect.value);if(result.summary)matched++;if(result.status==='ambiguous')ambiguous++;
      const flags=[spell.alwaysPrepared?'Always prepared':''].filter(Boolean);
      const mechanics=[spell.saveAttack && spell.saveAttack!=='--'?spell.saveAttack:''].filter(Boolean);
      const time={'1A':'Action','1BA':'Bonus action','1R':'Reaction','10m':'10 min','1m':'1 min','1h':'1 hr'}[spell.castingTime] || spell.castingTime;
      const indicators=spellIndicators(spell,library);
      const components=[spell.components,spell.ritual?'[R]':'',indicators.concentration?'[C]':'',indicators.higher?'[H]':''].filter(Boolean).join(' · ');
      rows.push(`<tr class="spell-row"><td><span class="checkbox"></span></td><td>${e(spell.name)}${flags.length?`<div class="spell-flags">${e(flags.join(' · '))}</div>`:''}</td><td>${result.summary?e(result.summary):'<span class="missing-summary">'+(result.status==='ambiguous'?'Summary unavailable: source match is ambiguous.':'Not included in the spell library.')+'</span>'}${mechanics.length?` <span class="mechanics">(${e(mechanics.join(' · '))})</span>`:''}</td><td>${e(time)}${components?`<div class="components">${e(components)}</div>`:''}</td><td>${e(spell.range)}</td><td>${e(spell.duration.replace(/Instantaneous/gi,'Instant').replace('Concentration, up to ','C, ').replace(/\bminutes?\b/g,'min').replace(/\bhours?\b/g,'hr'))}</td></tr>`);
    }
  }
  const classes=[...new Map(character.spellcasting.map(c=>[`${c.class}|${c.saveDc}|${c.attackBonus}`,c])).values()];
  const stats=classes.map(c=>`<div class="casting-group"><span class="casting-class">${e(c.class)}</span><div class="combat"><p>ATTACK<strong>${e(c.attackBonus || '____')}</strong></p><p>SAVE DC<strong>${e(c.saveDc || '____')}</strong></p><p title="2024 base class limit; always-prepared and bonus spells are excluded">PREPARED MAX<strong>${e(preparationLimit(c.class,character.classLevels) ?? '—')}</strong></p></div></div>`).join('');
  output.innerHTML=`<header class="sheet-header"><h1>Spells of ${e(character.name)}</h1><div>${stats}</div></header><p class="indicator-key">[R] Ritual · [C] Concentration · [H] Higher-level spell slot option</p><main class="table-scroll"><table class="spell-table"><colgroup><col class="check"><col class="name"><col class="description"><col class="time"><col class="range"><col class="duration"></colgroup><thead><tr><th aria-label="Spell checkbox"></th><th>Spell</th><th>Description</th><th>Time</th><th>Range</th><th>Duration</th></tr></thead><tbody>${rows.join('')}</tbody></table></main>`;
  return `${character.spells.length} spell entries extracted. ${matched} summaries matched; ${character.spells.length-matched} are outside the spell library${ambiguous?` (${ambiguous} ambiguous matches)`:''}. Duplicate spell names are combined; descriptions use non-Legacy library entries. Print with Ctrl+P / ⌘P.`;
}
form.addEventListener('submit',async event=>{
  event.preventDefault();sheetMode=event.submitter?.dataset.mode || "spells";lastCharacter=null;output.replaceChildren();printTools.hidden=true;emptyState.hidden=false;status.className='';
  const file=document.querySelector('#character-file').files[0];if(!file)return;
  if(file.size>25*1024*1024){status.className='error';status.textContent='Choose a PDF smaller than 25 MB.';return;}
  form.querySelectorAll('button').forEach(b=>b.disabled=true);languageSelect.disabled=true;status.textContent='Reading the PDF locally…';let task;
  try {
    const bytes=new Uint8Array(await file.arrayBuffer());
    if(!new TextDecoder().decode(bytes.slice(0,1024)).includes('%PDF-'))throw new Error('This file does not appear to be a PDF.');
    task=getDocument({data:bytes,isEvalSupported:false,standardFontDataUrl:new URL('./vendor/standard_fonts/',import.meta.url).href});
    const pdf=await task.promise;
    if(pdf.numPages>100)throw new Error('Choose a character sheet with fewer than 100 pages.');
    let character;
    if(sheetMode==='character'){
     character={details:await extractCharacterFields(pdf)};
     try{attachAbilitySummaries(character.details.featureEntries,await abilityLibrary(),character.details);}
     catch(error){character.details.summaryWarning=error.message+' Showing full PDF text.';}
    }else character=await extractPdfSpells(pdf);
    const spellLibrary=sheetMode==='character'?{}:await library(languageSelect.value);lastCharacter=character;status.textContent=render(character,spellLibrary);printTools.hidden=false;emptyState.hidden=true;
  }catch(error){status.className='error';status.textContent=error.name==='PasswordException'?'This PDF is password-protected. Upload an unprotected character export.':error.message || 'Could not read this PDF.';}
  finally{if(task)await task.destroy().catch(()=>{});form.querySelectorAll('button').forEach(b=>b.disabled=false);languageSelect.disabled=false;}
});

let portraitUrl;
document.querySelector('#character-portrait').addEventListener('change',event=>{
 const file=event.target.files[0],img=output.querySelector('.character-portrait');if(!img)return;
 if(portraitUrl)URL.revokeObjectURL(portraitUrl);
 if(!file){img.hidden=true;return;}if(!['image/png','image/jpeg','image/webp'].includes(file.type)){status.textContent='Choose a PNG, JPEG, or WebP portrait.';return;}
 portraitUrl=URL.createObjectURL(file);img.src=portraitUrl;img.hidden=false;
});

function checkCharacterOverflow(){
 fitCharacterLabels(output);
 fitCharacterText(output,Number(fontSizeSelect.value),characterPaperLayout(paperSizeSelect.value,borderlessSelect.checked).contentWidth);
 const notice=output.querySelector('#character-overflow');if(!notice)return;
 const overflowing=[...output.querySelectorAll('.character-value')].filter(f=>f.value && f.scrollHeight>f.clientHeight+2).map(f=>f.getAttribute('aria-label'));
 notice.textContent=overflowing.length?'Text exceeds the printable area: '+overflowing.join(', ')+'. Move features to the other page or edit the text before printing.':'';
}
function updateFeaturePlacement(){
 const c=lastCharacter.details,entries=c.featureEntries;
 output.querySelector('[aria-label="Habilidades especiales"]').value=selectedFeatureText(entries,languageSelect.value);
 output.querySelector('[aria-label="Notas"]').value=[backFeatureText(entries,languageSelect.value),c.notes].filter(Boolean).join('\n\n');checkCharacterOverflow();
}
output.addEventListener('change',event=>{
 const placement=event.target.dataset?.featureDestination,mode=event.target.dataset?.featureMode,id=placement??mode;
 if(id==null || !lastCharacter?.details?.featureEntries)return;
 const entry=lastCharacter.details.featureEntries.find(e=>e.id===id);if(!entry)return;
 if(placement!=null){entry.destination=event.target.value;entry.selected=entry.destination!=='exclude';}
 else entry.textMode=event.target.value;
 updateFeaturePlacement();
});
output.addEventListener('input',event=>{
 if(!lastCharacter?.details)return;
 requestAnimationFrame(checkCharacterOverflow);
 const c=lastCharacter.details,id=event.target.dataset?.featureText,summaryId=event.target.dataset?.featureSummary;
 if(summaryId!=null){const entry=c.featureEntries.find(e=>e.id===summaryId);if(entry){entry.summaries ||= {};entry.summaries[languageSelect.value]=event.target.value;entry.summaryEdits ||= {};entry.summaryEdits[languageSelect.value]=true;const source=event.target.closest('.feature-entry').querySelector('.feature-source');source.textContent='Custom / edited summary — review against the full PDF text.';const select=event.target.closest('.feature-entry').querySelector('[data-feature-mode]');select.querySelector('[value="summary"]').disabled=!event.target.value.trim();select.querySelector('[value="summary"]').textContent=event.target.value.trim()?'Summary':'Summary unavailable';if(!event.target.value.trim()){entry.textMode='full';select.value='full';}updateFeaturePlacement();}}
 if(id!=null){const entry=c.featureEntries.find(e=>e.id===id);if(entry){entry.text=event.target.innerText;updateFeaturePlacement();}}
 if(event.target.getAttribute('aria-label')==='Notas'){
  const prefix=backFeatureText(c.featureEntries,languageSelect.value);c.notes=prefix && event.target.value.startsWith(prefix)?event.target.value.slice(prefix.length).replace(/^\n\n/,''):event.target.value;
 }
});

window.addEventListener("resize",()=>{if(sheetMode==='character')requestAnimationFrame(checkCharacterOverflow);});
window.addEventListener("beforeprint",()=>{if(sheetMode==='character'){checkCharacterOverflow();preparePrintEmphasis(output);}});
window.addEventListener("afterprint",()=>{output.querySelectorAll('.character-print-text').forEach(el=>el.remove());if(sheetMode==='character')requestAnimationFrame(checkCharacterOverflow);});
