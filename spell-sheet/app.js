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
let libraryPromise,spanishPromise,lastCharacter;
function englishLibrary() {
  return libraryPromise ||= fetch('./spells.json').then(async response=>{if(!response.ok)throw new Error('Could not load the spell library.');const data=await response.json();if(data.schema_version!==1 || !data.spells)throw new Error('Invalid spell library.');return data;}).catch(error=>{libraryPromise=null;throw error;});
}
async function library(language='en') {
  const data=await englishLibrary();
  if(language==='es') {
    spanishPromise ||= fetch('./spells.es.json').then(async response=>{
      if(!response.ok)throw new Error('Could not load Spanish summaries.');
      const translations=await response.json();
      if(translations.schema_version!==1 || translations.language!=='es' || !translations.summaries)throw new Error('Invalid Spanish summaries.');
      return translations;
    }).catch(error=>{spanishPromise=null;throw error;});
    data.translations={es:await spanishPromise};
  }
  return data;
}
languageSelect.addEventListener('change',async()=>{
  if(!lastCharacter)return;
  languageSelect.disabled=true;
  try { status.textContent=render(lastCharacter,await library(languageSelect.value));status.className=''; }
  catch(error) { languageSelect.value='en';status.textContent=render(lastCharacter,await englishLibrary())+' '+error.message+' Showing English.';status.className='error'; }
  finally { languageSelect.disabled=false; }
});
function render(character,library) {
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
      rows.push(`<tr class="spell-row"><td><span class="checkbox"></span></td><td>${e(spell.name)}${flags.length?`<div class="spell-flags">${e(flags.join(' · '))}</div>`:''}</td><td>${result.summary?e(result.summary):'<span class="missing-summary">'+(result.status==='ambiguous'?'Summary unavailable: source match is ambiguous.':'Not included in the spell library.')+'</span>'}${mechanics.length?` <span class="mechanics">(${e(mechanics.join(' · '))})</span>`:''}</td><td>${e(time)}${components?`<div class="components">${e(components)}</div>`:''}</td><td>${e(spell.range)}</td><td>${e(spell.duration.replace('Concentration, up to ','C, ').replace(/\bminutes?\b/g,'min').replace(/\bhours?\b/g,'hr'))}</td></tr>`);
    }
  }
  const classes=[...new Map(character.spellcasting.map(c=>[`${c.class}|${c.saveDc}|${c.attackBonus}`,c])).values()];
  const stats=classes.map(c=>`<div class="casting-group"><span class="casting-class">${e(c.class)}</span><div class="combat"><p>ATTACK<strong>${e(c.attackBonus || '____')}</strong></p><p>SAVE DC<strong>${e(c.saveDc || '____')}</strong></p><p title="2024 base class limit; always-prepared and bonus spells are excluded">PREPARED MAX<strong>${e(preparationLimit(c.class,character.classLevels) ?? '—')}</strong></p></div></div>`).join('');
  output.innerHTML=`<header class="sheet-header"><h1>Spells of ${e(character.name)}</h1><div>${stats}</div></header><p class="indicator-key">[R] Ritual · [C] Concentration · [H] Higher-level spell slot option</p><main class="table-scroll"><table class="spell-table"><colgroup><col class="check"><col class="name"><col class="description"><col class="time"><col class="range"><col class="duration"></colgroup><thead><tr><th aria-label="Spell checkbox"></th><th>Spell</th><th>Description</th><th>Time</th><th>Range</th><th>Duration</th></tr></thead><tbody>${rows.join('')}</tbody></table></main>`;
  return `${character.spells.length} spell entries extracted. ${matched} summaries matched; ${character.spells.length-matched} are outside the spell library${ambiguous?` (${ambiguous} ambiguous matches)`:''}. Duplicate spell names are combined; descriptions use non-Legacy library entries. Print with Ctrl+P / ⌘P.`;
}
form.addEventListener('submit',async event=>{
  event.preventDefault();lastCharacter=null;output.replaceChildren();printTools.hidden=true;emptyState.hidden=false;status.className='';
  const file=document.querySelector('#character-file').files[0];if(!file)return;
  if(file.size>25*1024*1024){status.className='error';status.textContent='Choose a PDF smaller than 25 MB.';return;}
  button.disabled=true;languageSelect.disabled=true;status.textContent='Reading the PDF locally…';let task;
  try {
    const bytes=new Uint8Array(await file.arrayBuffer());
    if(!new TextDecoder().decode(bytes.slice(0,1024)).includes('%PDF-'))throw new Error('This file does not appear to be a PDF.');
    task=getDocument({data:bytes,isEvalSupported:false,standardFontDataUrl:new URL('./vendor/standard_fonts/',import.meta.url).href});
    const pdf=await task.promise;
    if(pdf.numPages>100)throw new Error('Choose a character sheet with fewer than 100 pages.');
    const character=await extractPdfSpells(pdf);
    const spellLibrary=await library(languageSelect.value);lastCharacter=character;status.textContent=render(character,spellLibrary);printTools.hidden=false;emptyState.hidden=true;
  }catch(error){status.className='error';status.textContent=error.name==='PasswordException'?'This PDF is password-protected. Upload an unprotected character export.':error.message || 'Could not read this PDF.';}
  finally{if(task)await task.destroy().catch(()=>{});button.disabled=false;languageSelect.disabled=false;}
});
