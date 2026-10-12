// 2024 base class preparation limits; bonus/always-prepared spells are excluded.
// Source: https://www.dndbeyond.com/sources/dnd/br-2024/character-classes
const full=[4,5,6,7,9,10,11,12,14,15,16,16,17,17,18,18,19,20,21,22];
const half=[2,3,4,5,6,6,7,7,9,9,10,10,11,11,12,12,14,14,15,15];
const tables={bard:full,cleric:full,druid:full,paladin:half,ranger:half,
 sorcerer:[2,4,6,7,9,10,11,12,14,15,16,16,17,17,18,18,19,20,21,22],
 warlock:[2,3,4,5,6,7,8,9,10,10,11,11,12,12,13,13,14,14,15,15],
 wizard:[4,5,6,7,9,10,11,12,14,15,16,16,17,18,19,21,22,23,24,25]};
export function extractClassLevels(text) {
 const levels={};
 for(const match of String(text).matchAll(/\b(Barbarian|Bard|Cleric|Druid|Fighter|Monk|Paladin|Ranger|Rogue|Sorcerer|Warlock|Wizard|Artificer)\b\s*(?:\([^)]*\)\s*)?(\d{1,2})\b/gi)) {
  const level=Number(match[2]);if(level>=1 && level<=20)levels[match[1].toLowerCase()]=level;
 }
 return levels;
}
export function preparationLimit(className,classLevels={}) {
 const matches=String(className).toLowerCase().match(/\b(bard|cleric|druid|paladin|ranger|sorcerer|warlock|wizard)\b/g) || [];
 if(matches.length!==1)return null;
 const name=matches[0],level=classLevels[name];
 return Number.isInteger(level) && level>=1 && level<=20 ? tables[name][level-1] : null;
}
