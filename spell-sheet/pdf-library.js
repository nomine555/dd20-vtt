export const cleanSpellName = name => String(name).replace(/\s*\[R\]/gi,'').trim();
export const normalizeName = name => cleanSpellName(name).normalize('NFKC').replace(/[’‘]/g,"'").replace(/\s*\(legacy\)\s*$/i,'').replace(/\s+/g,' ').trim().toLowerCase();
export function findSummary(spell,library) {
  // Deliberately use the current library version regardless of the PDF's book/edition.
  const entries=Object.values(library.spells || {}).filter(entry=>
    normalizeName(entry.name)===normalizeName(spell.name) &&
    (entry.legacy===false || (entry.legacy==null && entry.definition?.isLegacy===false)));
  const withSummary=entries.filter(entry=>typeof entry.summary==='string' && entry.summary.trim());
  if(withSummary.length)return {summary:withSummary[0].summary,status:'matched'};
  const withDescription=entries.find(entry=>typeof entry.description==='string' && entry.description.trim());
  if(withDescription)return {summary:withDescription.description,status:'description'};
  return {summary:null,status:'missing'};
}
export function uniqueSpellsByName(spells) {
  const unique=new Map();
  for(const spell of spells) {
    const key=normalizeName(spell.name), old=unique.get(key);
    // Prefer revised PDF mechanics when both rows are present; do not invent missing values.
    const preferred=!old || (spell.edition==='2024' && old.edition!=='2024')?spell:old;
    unique.set(key,{...preferred,name:cleanSpellName(preferred.name),ritual:!!(old?.ritual || spell.ritual || /\[R\]/i.test(old?.name || '') || /\[R\]/i.test(spell.name)),legacy:false,alwaysPrepared:!!(old?.alwaysPrepared || spell.alwaysPrepared)});
  }
  return [...unique.values()];
}
