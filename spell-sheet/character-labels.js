import {characterLocales} from './character-locales.js';
const words={
 name:['NOMBRE','NAME'],race:['ESPECIE','SPECIES'],class:['CLASE','CLASS'],alignment:['ALINEAMIENTO','ALIGNMENT'],level:['NIVEL','LEVEL'],hp:['PUNTOS\nDE GOLPE','HIT\nPOINTS'],max:['MÁXIMO','MAXIMUM'],ac:['CLASE\nDE ARMADURA','ARMOR\nCLASS'],speed:['VELOCIDAD','SPEED'],init:['INICIATIVA','INITIATIVE'],inspiration:['INSPIRACIÓN','INSPIRATION'],mod:['MODIFIC.','MODIFIER'],save:['SALVACIÓN','SAVING THROW'],weapon:['ARMA','WEAPON'],hit:['ATAQUE','TO HIT'],damage:['DAÑO','DAMAGE'],features:['RASGOS Y HABILIDADES','FEATURES & TRAITS'],languages:['IDIOMAS:','LANGUAGES:'],background:['TRASFONDO','BACKGROUND'],equipment:['EQUIPO','EQUIPMENT'],notes:['NOTAS','NOTES']};
const abilities=[['FUERZA','STRENGTH'],['DESTREZA','DEXTERITY'],['CONSTITUCIÓN','CONSTITUTION'],['INTELIGENCIA','INTELLIGENCE'],['SABIDURÍA','WISDOM'],['CARISMA','CHARISMA']];
const skills=[['Acrobacias (DES)','Acrobatics (DEX)'],['Atletismo (FUE)','Athletics (STR)'],['Sigilo (DES)','Stealth (DEX)'],['Juego de Manos (DES)','Sleight of Hand (DEX)'],['Medicina (SAB)','Medicine (WIS)'],['Supervivencia (SAB)','Survival (WIS)'],['Trato con Animales (SAB)','Animal Handling (WIS)'],['Arcanos (INT)','Arcana (INT)'],['Historia (INT)','History (INT)'],['Naturaleza (INT)','Nature (INT)'],['Religión (INT)','Religion (INT)'],['Investigación (INT)','Investigation (INT)'],['Percepción (SAB)','Perception (WIS)'],['Perspicacia (SAB)','Insight (WIS)'],['Engaño (CAR)','Deception (CHA)'],['Intimidación (CAR)','Intimidation (CHA)'],['Interpretación (CAR)','Performance (CHA)'],['Persuasión (CAR)','Persuasion (CHA)']];
export function labelText(key,language='en'){const locale=characterLocales[language];if(locale)return key.startsWith('ability-')?locale.abilities[Number(key.slice(8))]||'':key.startsWith('skill-')?locale.skills[Number(key.slice(6))]||'':locale.words[key]||'';const index=language==='es'?0:1;return (key.startsWith('ability-')?abilities[Number(key.slice(8))]:key.startsWith('skill-')?skills[Number(key.slice(6))]:words[key])?.[index] || '';}
export function characterLabels(back=false,language='en') {
 const label=(key,x,y,w,h,size=25,align='left')=>`<span class="character-label" data-character-label="${key}" style="left:${x/1447*100}%;top:${y/2048*100}%;width:${w/1447*100}%;height:${h/2048*100}%;font-size:${size/1447*100}cqw;text-align:${align}">${labelText(key,language)}</span>`;
 if(back)return label('background',85,70,670,50,25)+label('equipment',890,70,400,50,25)+label('notes',85,740,1200,50,25);
 let s=label('name',70,130,470,40)+label('race',558,130,260,40)+label('class',843,130,330,40)+label('alignment',1198,130,102,20,12,'center')+label('level',1310,126,97,30,18,'center')+label('hp',226,288,142,85,27)+label('max',108,404,85,20,12,'center')+label('ac',503,288,186,85,27)+label('speed',693,387,205,40,25,'center')+label('init',956,387,180,40,25,'center')+label('inspiration',1189,387,208,40,25,'center');
 const xs=[108,326,554,782,997,1206];xs.forEach((x,i)=>{s+=label('ability-'+i,x-33,491,220,40,24,'center')+label('mod',x+26,581,86,18,11,'center')+label('save',x+12,742,120,18,11,'center');});
 s+=label('weapon',65,811,420,40)+label('hit',490,811,150,40)+label('damage',690,811,125,40)+label('features',68,1224,720,45)+label('languages',68,1970,125,30,19);
 skills.forEach((_,i)=>s+=label('skill-'+i,1025,816+i*34.2,365,32,23));return s;
}
export function applyCharacterLanguage(root,language){root.querySelectorAll('[data-character-label]').forEach(el=>el.textContent=labelText(el.dataset.characterLabel,language));}
export function fitCharacterLabels(root){
 for(const el of root.querySelectorAll('[data-character-label]')){
  const preferred=Number(el.dataset.labelFontSize ||= parseFloat(el.style.fontSize));
  el.style.fontSize=preferred+'cqw';
  if(el.clientWidth && el.scrollWidth>el.clientWidth+1)el.style.fontSize=(preferred*Math.max(.7,el.clientWidth/el.scrollWidth*.98)).toFixed(4)+'cqw';
 }
}
