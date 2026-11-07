// SRD 5.1 / 5.2 summaries are loaded once; original PDF text always remains available.
export function normalizeAbilityName(value) {
 return String(value||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[’‘]/g,"'").replace(/^\s*[•*]\s*/,'').replace(/\s*[•|].*$/,'').replace(/\s*\((?:\d+[^)]*|2024|legacy)\)\s*$/i,'').replace(/[^a-z0-9]/gi,'').toLowerCase();
}
export function detectAbilityRules(entry) {
 const heading=String(entry.name||'')+' '+String(entry.text||'').split('\n')[0];
 if(/\b(?:PHB|BR|SRD)\s*['’]?\s*(?:2024|24)\b|SRD\s*5\.2/i.test(heading))return '2024';
 if(/\blegacy\b|\b(?:PHB|BR|SRD)\s*['’]?\s*(?:2014|14)\b|SRD\s*5\.1|\b(?:PHB|BR)\b/i.test(heading))return '2014';
 return null;
}
export function inferCharacterRules(entries) {
 const versions=new Set(entries.map(detectAbilityRules).filter(Boolean));
 return versions.size===1?[...versions][0]:null;
}
export function matchAbility(entry,library,character={}) {
 const rules=detectAbilityRules(entry)||character.rulesEdition||null;
 const sectionClass=String(entry.section||'').match(/^(Barbarian|Bard|Cleric|Druid|Fighter|Monk|Paladin|Ranger|Rogue|Sorcerer|Warlock|Wizard) FEATURES$/i)?.[1];
 const classes=String(sectionClass||character.className||'').toLowerCase(),name=normalizeAbilityName(entry.name);
 const scope=library.abilities.filter(a=>(!rules || a.rules===rules) && (!a.class_name || !classes || classes.includes(a.class_name.toLowerCase())));
 let candidates=scope.filter(a=>[a.name,...a.aliases||[]].some(n=>normalizeAbilityName(n)===name));
 // A named sub-option can be matched through an explicit DDB parent-category prefix.
 if(!candidates.length && /^(?:Channel Divinity|Fighting Style|Giant Ancestry|Metamagic|Eldritch Invocations?)\s*:/i.test(entry.name)){
  const option=normalizeAbilityName(entry.name.slice(entry.name.indexOf(':')+1));candidates=scope.filter(a=>[a.name,...a.aliases||[]].some(n=>normalizeAbilityName(n)===option));
 }
 if(candidates.length===1)return candidates[0];
 if(candidates.length>1 && candidates.every(a=>JSON.stringify(a.summaries)===JSON.stringify(candidates[0].summaries)))return candidates[0];
 // Without a known edition, never choose between different rules for the same name.
 if(new Set(candidates.map(a=>a.rules)).size>1)return null;
 const classNames=classes.match(/barbarian|bard|cleric|druid|fighter|monk|paladin|ranger|rogue|sorcerer|warlock|wizard/g)||[];
 const classKey=sectionClass?.toLowerCase() || (classNames.length===1?classNames[0]:null);
 const level=classKey?(character.classLevels?.[classKey] || (classNames.length===1?Number(character.level):0)):0;
 if(candidates.length>1 && level){
  const eligible=candidates.filter(a=>a.level && a.level<=level).sort((a,b)=>b.level-a.level);
  if(eligible.length && (eligible.length===1 || eligible[0].level!==eligible[1].level))return eligible[0];
 }
 return null;
}
export function attachAbilitySummaries(entries,library,character={}) {
 const context={...character,rulesEdition:character.rulesEdition||inferCharacterRules(entries)};
 for(const entry of entries){
  const match=matchAbility(entry,library,context);
  entry.summaries=match?{...match.summaries}:{};entry.summarySource=match?.id || null;entry.summaryRules=match?.rules || null;
  const rules=detectAbilityRules(entry)||context.rulesEdition;
  entry.summaryReason=match?'Matched: '+match.name:'No clear '+(rules?rules+' ':'')+'SRD match — full PDF text kept. You can write a summary below.';
  entry.textMode=match?'summary':'full';
  const excluded=/\b(?:fighting\s+style|oath\s+spells|languages?|feats?|skills?|creature\s+type|size|speed|ability\s+score\s+increases?|ability\s+score\s+improvements?|bonus\s+proficienc(?:y|ies)|spellcasting|proficiencies|hit\s+points?)\b/i.test(entry.name);
  if(excluded || match){entry.destination=excluded?'exclude':'back';entry.selected=!excluded;}
 }
 return entries;
}
export function pdfUsageNote(text,language='en') {
 // Preserve character-specific usage counters, not generic rulebook pool sizes.
 const notes=[...String(text).matchAll(/(?:^|\n)[ \t]*(?:[|•*-][ \t]*)?([^\n]*\b\d+\s*\/\s*(?:Short|Long)\s+Rest[^\n]*)/gi)].map(m=>m[1].trim());
 const value=[...new Set(notes)].join('; ');
 const rest={es:['descanso corto','descanso largo'],fr:['repos court','repos long'],de:['kurze Rast','lange Rast'],it:['riposo breve','riposo lungo'],'pt-BR':['descanso curto','descanso longo']}[language];
 return rest?value.replace(/Short Rest/gi,rest[0]).replace(/Long Rest/gi,rest[1]):value;
}
export function featureSummaryText(entry,language='en') {
 const summary=entry.summaries?.[language];if(!summary)return '';
 const usage=pdfUsageNote(entry.text,language);
 return `• ${entry.name} — ${summary}${usage?' ['+usage+']':''}`;
}
