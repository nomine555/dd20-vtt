export function parseSpellFields(pages) {
 let level=null,name='Character';const spells=[],spellcasting=[],warnings=[],spellSlots={};
 for(const page of pages){
  const fields=new Map(page.annotations.map(a=>[a.name ?? a.fieldName,a]));
  const value=k=>String(fields.get(k)?.value ?? fields.get(k)?.fieldValue ?? '').trim();
  if(value('CharacterName'))name=value('CharacterName');
  if(value('spellCastingClass0'))spellcasting.push({class:value('spellCastingClass0'),ability:value('spellCastingAbility0'),saveDc:value('spellSaveDC0'),attackBonus:value('spellAtkBonus0'),page:page.number});
  const rows=page.annotations.filter(a=>/^spell(Name|Header)\d+$/.test(a.name ?? a.fieldName)).sort((a,b)=>b.rect[3]-a.rect[3]);
  for(const row of rows){
   const field=row.name ?? row.fieldName,text=String(row.value ?? row.fieldValue ?? '').trim();if(!text)continue;
   if(field.startsWith('spellHeader')){const m=text.match(/(\d+)(?:st|nd|rd|th)?\s+LEVEL/i);if(m) {
     level=Number(m[1]);
     const suffix=field.match(/\d+$/)[0],slotText=value('spellSlotHeader'+suffix);
     const count=slotText.match(/\b(\d+)\s+slots?\b/i);
     if(count && level>=1 && level<=9)spellSlots[level]=Math.max(spellSlots[level] ?? 0,Number(count[1]));
    }else if(/CANTRIP/i.test(text))level=0;continue;}
   const id=field.match(/\d+$/)[0],sourceRef=value('spellPage'+id),source=sourceRef.replace(/\s+\d+\s*$/,'').trim();
   const key=text.normalize('NFKC').replace(/[’‘]/g,"'").replace(/\s+/g,' ').toLowerCase()+'|'+(source.toLowerCase() || 'unknown');
   const entry={key,name:text,level,source,sourceRef,edition:source==='PHB-2024'?'2024':source==='PHB'?'2014':null,pdfPage:page.number};
   for(const [k,prefix] of Object.entries({sourceClass:'spellSource',prepMarker:'spellPrepared',saveAttack:'spellSaveHit',castingTime:'spellCastingTime',range:'spellRange',components:'spellComponents',duration:'spellDuration',notes:'spellNotes'}))entry[k]=value(prefix+id);
   entry.alwaysPrepared=/Always Prepared/i.test(entry.sourceClass);if(level===null)warnings.push('Unknown level: '+text);spells.push(entry);
  }
 }
 if(!spells.length)throw new Error('No editable D&D Beyond spell fields found. Flattened or scanned PDFs need text/OCR parsing.');
 return {name,spellcasting,spells,spellSlots,warnings};
}
export async function extractPdfSpells(pdf){const pages=[];for(let n=1;n<=pdf.numPages;n++){const p=await pdf.getPage(n);pages.push({number:n,annotations:await p.getAnnotations()});}return parseSpellFields(pages);}
