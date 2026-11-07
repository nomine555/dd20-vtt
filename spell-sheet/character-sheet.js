import {characterPaperLayers} from './character-backgrounds.js';
import {characterLabels} from './character-labels.js';
import {parseFeatureEntries,selectedFeatureText,featureListHtml,backFeatureText} from './feature-selection.js';
import {escape as esc} from './core.js';
export function parseCharacterFields(pages) {
 const f={};for(const p of pages)for(const a of p.annotations){const key=String(a.fieldName ?? a.name ?? '').trim().replace(/\s+/g,' '),v=String(a.fieldValue ?? a.value ?? '').trim();if(v && !f[key])f[key]=v;}
 const get=(...keys)=>keys.map(k=>f[k]).find(Boolean)||'';
 const cl=get('CLASS LEVEL'),classLevels=Object.fromEntries([...cl.matchAll(/\b(Barbarian|Bard|Cleric|Druid|Fighter|Monk|Paladin|Ranger|Rogue|Sorcerer|Warlock|Wizard)\s+(\d+)/gi)].map(m=>[m[1].toLowerCase(),Number(m[2])])),levels=[...cl.matchAll(/\b(\d+)\b/g)].map(x=>Number(x[1]));
 const skills=['Acrobatics','Athletics','Stealth','SleightofHand','Medicine','Survival','Animal','Arcana','History','Nature','Religion','Investigation','Perception','Insight','Deception','Intimidation','Performance','Persuasion'];
 const abilities=['STR','DEX','CON','INT','WIS','CHA'].map((key,i)=>({score:get(key),mod:get(key+'mod',key==='CHA'?'CHamod':''),save:get('ST '+['Strength','Dexterity','Constitution','Intelligence','Wisdom','Charisma'][i])}));
 const attacks=Array.from({length:4},(_,i)=>({name:get(i?'Wpn Name '+(i+1):'Wpn Name'),hit:get('Wpn'+(i+1)+' AtkBonus'),damage:get('Wpn'+(i+1)+' Damage')}));
 const features=Object.keys(f).filter(k=>/^FeaturesTraits\d+$/.test(k)).sort((a,b)=>a.localeCompare(b,undefined,{numeric:true})).map(k=>f[k]).join('\n\n');
 const equipment=Object.keys(f).filter(k=>/^Eq Name\d+$/.test(k)).sort((a,b)=>a.localeCompare(b,undefined,{numeric:true})).map(k=>{const id=k.match(/\d+$/)[0];return `${get('Eq Qty'+id)} × ${f[k]}`;}).join('\n');
 const prof=get('ProficienciesLang'),languages=prof.match(/=== LANGUAGES ===\s*([\s\S]*?)(?====|$)/i)?.[1]?.trim()||'';
 const featureEntries=parseFeatureEntries(features);
 const competencies=[...prof.matchAll(/===\s*(ARMOR|WEAPONS?)\s*===\s*([\s\S]*?)(?====|$)/gi)].map(m=>m[1]+': '+m[2].trim()).filter(Boolean).join('\n');
 if(competencies)featureEntries.push({id:String(featureEntries.length),name:'ARMOR AND WEAPON COMPETENCIES',text:'• ARMOR AND WEAPON COMPETENCIES\n'+competencies,destination:'back',selected:true,textMode:'full'});
 return {name:get('CharacterName'),race:get('RACE'),classLevels,className:cl.replace(/\s+\d+\b/g,''),level:levels.length?String(levels.reduce((a,b)=>a+b,0)):'',alignment:get('ALIGNMENT','Alignment'),hp:get('HPCurrent','CurrentHP'),maxHp:get('MaxHP'),ac:get('AC'),speed:get('Speed').replace(/\s*\(Walking\)/gi,'').trim(),initiative:get('Init'),inspiration:get('Inspiration')==='Yes'?'✓':'',abilities,skills:skills.map(k=>get(k)),attacks,features,featureEntries,equipment,background:[get('BACKGROUND'),get('Backstory'),get('PersonalityTraits'),get('Ideals'),get('Bonds'),get('Flaws')].filter(Boolean).join('\n\n'),notes:[get('AdditionalNotes1'),get('AdditionalNotes2')].filter(Boolean).join('\n\n'),languages,defenses:get('Defenses'),proficiencies:prof};
}
export async function extractCharacterFields(pdf){const pages=[];for(let i=1;i<=pdf.numPages;i++){const p=await pdf.getPage(i);pages.push({annotations:await p.getAnnotations()});}return parseCharacterFields(pages);}
const shortDamageTypes={slashing:'Slash',piercing:'Pierce',bludgeoning:'Bludgeon',lightning:'Lightn.',thunder:'Thund.',necrotic:'Necro.',radiant:'Rad.',psychic:'Psych.'};
function shortDamageText(text){return String(text||'').replace(/\b(slashing|piercing|bludgeoning|lightning|thunder|necrotic|radiant|psychic)\b/gi,type=>shortDamageTypes[type.toLowerCase()]);}
export function characterSheetHtml(c,language='en') {
 let fields='';
 const field=(label,value,x,y,w,h,size=32,align='center',prose=false)=>{fields+=`<textarea class="character-value${prose?' character-prose':''}" aria-label="${esc(label)}" spellcheck="false" style="left:${x/1447*100}%;top:${y/2048*100}%;width:${w/1447*100}%;height:${h/2048*100}%;font-size:${size/1447*100}cqw;text-align:${align}">${esc(value)}</textarea>`;};
 field('Nombre',c.name,58,78,465,55,36,'left');field('Raza',c.race,550,82,265,55,30,'left');field('Clase',c.className,840,82,330,55,30,'left');field('Alineamiento',c.alignment,1200,67,96,52,20);field('Nivel',c.level,1315,65,85,55,36);
 field('Puntos de vida actuales',c.hp,78,260,130,74,48);field('PG máximos',c.maxHp,108,355,72,43,30);field('Clase de armadura',c.ac,390,275,90,64,44);field('Movimiento',c.speed,732,271,122,59,42);field('Iniciativa',c.initiative,975,271,120,59,42);field('Inspiración',c.inspiration,1225,271,120,59,40);
 const xs=[108,326,554,782,997,1206];c.abilities.forEach((a,i)=>{field('Característica '+i,a.score,xs[i],607,140,65,44);field('Modificador '+i,a.mod,xs[i]+30,538,76,43,36);field('Salvación '+i,a.save,xs[i]+32,691,76,39,28);});
 c.attacks.forEach((a,i)=>{const y=875+i*75;field('Arma '+(i+1),a.name,72,y+6,425,47,26,'left');field('Ataque '+(i+1),a.hit,526,y-1,77,45,30);field('Daño '+(i+1),shortDamageText(a.damage),637,y+6,167,46,23);});
 c.skills.forEach((s,i)=>field('Habilidad '+(i+1),s,921,808+i*34.2+([11,12,13].includes(i)?3:0),72,29,24));
 const entries=c.featureEntries || parseFeatureEntries(c.features);
 field('Habilidades especiales',selectedFeatureText(entries,language),58,1268,735,650,25,'left',true);field('Idiomas',c.languages,226,1964,591,38,25,'left');
 const backField=(label,text,x,y,w,h)=>`<textarea class="character-value character-prose" aria-label="${esc(label)}" spellcheck="false" style="left:${x/2480*100}%;top:${y/3508*100}%;width:${w/2480*100}%;height:${h/3508*100}%;font-size:1.6cqw;text-align:left">${esc(text || '')}</textarea>`;
 const back=`<section class="character-paper character-back">${characterPaperLayers(true)}${characterLabels(true,language)}${backField('Trasfondo',c.background,120,205,1220,900)}${backField('Equipo',c.equipment,1515,220,850,880)}${backField('Notas',[backFeatureText(entries,language),c.notes].filter(Boolean).join('\n\n'),120,1370,2240,1940)}</div></section>`;
 return `<section class="character-paper">${characterPaperLayers(false)}${characterLabels(false,language)}${fields}<img class="character-portrait" hidden alt="Retrato del personaje"></div></section>${back}<p id="character-overflow" class="character-hint" role="status"></p><section class="character-appendix"><h2>${esc(c.name)} — Detalles</h2><h3>Rasgos y habilidades (texto del PDF)</h3><p class="feature-help">Choose Front, Back, or Exclude, then Full text or Summary. Summaries are brief 2014/2024 reminders; check the full rules for exceptions. Only the two sheet pages print.</p><div class="feature-list">${featureListHtml(entries,language)}</div><p class="feature-attribution">Ability summaries adapted from SRD 5.1 / 5.2 by Wizards of the Coast LLC, via 5e-bits, under <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC BY 4.0</a>.</p></section>`;
}
