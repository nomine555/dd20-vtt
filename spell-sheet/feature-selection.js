import {featureSummaryText} from './ability-summaries.js';
import {escape as esc} from './core.js';
export function cleanFeatureText(text) {
 return String(text || '').replace(/^[ \t]*\|[ \t]*/gm,'  - ').replace(/^[ \t]*\*[ \t]+/gm,'• ').replace(/\n[ \t]*\n(?:[ \t]*\n)+/g,'\n\n').trim();
}
export function parseFeatureEntries(text) {
 const entries=[],lines=String(text || '').replace(/\r\n?/g,'\n').split('\n');let current,section='';
 for(const line of lines){
  const sectionMatch=line.match(/^\s*===\s*(.*?)\s*===\s*$/);if(sectionMatch){section=sectionMatch[1];current=null;continue;}
  // DDB choices may have an indented pipe header; ordinary bullets and usage counters are not headers.
  const main=line.match(/^\s*\*\s+(.+)/),nested=line.match(/^\s*[|•]\s+(.+?\s+•\s+(?:PHB|BR|SRD|XGE|TCE|MPMM|FToD|SotDQ)\b.*)$/i);
  const inline=current && /^Channel Divinity(?:\s*:|$)/i.test(current.name) && line.match(/^\s*(Sacred Weapon|Turn the Unholy|Turn Undead|Preserve Life)\s+[-–—]\s+(.+)/i);
  if(inline){const source=current.sourceCaption||'';current={id:String(entries.length),name:'Channel Divinity: '+inline[1],text:'* Channel Divinity: '+inline[1]+(source?' • '+source:'')+'\n'+inline[2],section,sourceCaption:source};entries.push(current);continue;}
  const m=main||nested;
  const heading=m && (/\s+•\s+\S/.test(m[1]) || (m[1].length<100 && !/[.!?]\s*$/.test(m[1])));
  if(heading){current={id:String(entries.length),name:m[1].replace(/\s*[•|].*$/,'').trim(),text:'* '+m[1].trim(),section,sourceCaption:m[1].split(/\s+•\s+/).slice(1).join(' • ')};entries.push(current);}
  else if(current)current.text+='\n'+line;
 }
 const seen=new Set();
 return entries.map(e=>({...e,text:cleanFeatureText(e.text)})).filter(e=>{const key=e.name+'\n'+e.text;if(seen.has(key))return false;seen.add(key);return true;}).map((e,i)=>({...e,id:String(i),selected:defaultFeatureSelection(e),destination:defaultFeatureSelection(e)?'front':'exclude'}));
}
export function defaultFeatureSelection(entry) {
 // Rest limits can occur deep inside an active feature; passive exclusions apply to its title.
 const excluded=/\b(spells?|spellcasting|cantrips?|hit points?|skills?|speed|size|creature type|proficienc(?:y|ies)|languages?)\b|\b(?:armor|weapon) training\b/i.test(entry.name);
 const grantsSpell=/\b(?:cast|casting)\b[\s\S]{0,100}\b(?:spell|cantrip)\b|\b(?:spell|cantrip)\b[\s\S]{0,80}\b(?:cast|casting)\b/i.test(entry.text);
 const oneRest=/(?:\b1\s*\/\s*(?:short|long)\s+rest\b|\bonce\s+per\s+(?:short|long)\s+rest\b|\bonce\b[\s\S]{0,120}\b(?:finish|finishing)\s+(?:a\s+)?(?:short|long)\s+rest\b)/i.test(entry.text);
 return !excluded && !grantsSpell && oneRest;
}
export function entrySheetText(entry,language='en') {return entry.textMode==='summary'?(featureSummaryText(entry,language)||cleanFeatureText(entry.text)):cleanFeatureText(entry.text);}
export function selectedFeatureText(entries,language='en') {
 return entries.filter(e=>e.destination?e.destination==='front':e.selected).map(e=>entrySheetText(e,language)).join('\n\n');
}
export function backFeatureText(entries,language='en') {return entries.filter(e=>e.destination==='back').map(e=>entrySheetText(e,language)).join('\n\n');}
export function featureListHtml(entries,language='en') {
 return entries.length?entries.map(e=>{
 const summary=e.summaries?.[language]||'',mode=summary&&e.textMode==='summary'?'summary':'full';
 return `<article class="feature-entry" data-feature-id="${e.id}"><div class="feature-choice"><strong>${esc(e.name)}</strong><div class="feature-selectors"><label>Placement<select aria-label="Placement: ${esc(e.name)}" data-feature-destination="${e.id}">${[['exclude','Exclude'],['front','Front'],['back','Back']].map(([v,t])=>`<option value="${v}" ${(e.destination || (e.selected?'front':'exclude'))===v?'selected':''}>${t}</option>`).join('')}</select></label><label>Text<select aria-label="Text: ${esc(e.name)}" data-feature-mode="${e.id}"><option value="full" ${mode==='full'?'selected':''}>Full text</option><option value="summary" ${mode==='summary'?'selected':''} ${summary?'':'disabled'}>Summary${summary?'':' unavailable'}</option></select></label></div></div><details class="feature-original" ${mode==='full'?'open':''}><summary>Full PDF text (editable)</summary><div class="feature-full-text" contenteditable="true" data-feature-text="${e.id}">${esc(cleanFeatureText(e.text))}</div></details><label class="feature-summary-label">${({es:'Resumen breve (editable)',fr:'Résumé court (modifiable)',de:'Kurzfassung (bearbeitbar)',it:'Riassunto breve (modificabile)','pt-BR':'Resumo curto (editável)'})[language]||'Short summary (editable)'}<textarea class="feature-summary-edit" rows="2" data-feature-summary="${e.id}" aria-label="Summary: ${esc(e.name)}" placeholder="${summary?'':'No matching SRD summary. Write your own or use full text.'}">${esc(summary)}</textarea></label><p class="feature-source">${e.summaryEdits?.[language]?'Custom / edited summary — review against the full PDF text.':e.summarySource?'SRD '+(e.summaryRules==='2014'?'5.1 / 2014':'5.2 / 2024')+' · '+esc(e.summarySource):esc(e.summaryReason||'No unambiguous SRD match — full text kept.')}</p></article>`;
 }).join(''):'<p>No feature entries found in the PDF.</p>';
}
