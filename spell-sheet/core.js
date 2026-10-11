export function characterId(value) {
  const url = new URL(value);
  const match = url.pathname.match(/^\/characters\/(\d+)\/?$/);
  if (!['https:', 'http:'].includes(url.protocol) || !['dndbeyond.com', 'www.dndbeyond.com'].includes(url.hostname) || !match) throw new Error('Enter a valid D&D Beyond character URL.');
  return match[1];
}
export function collect(data) {
  const list = [...(data.classSpells || []).flatMap(g => g.spells || []), ...Object.values(data.spells || {}).flatMap(s => s || [])];
  const unique = new Map();
  for (const spell of list) {
    const d = spell.definition;
    if (!d?.name) continue;
    const key = d.definitionKey || `${d.id}:${d.name}:${d.level}:${!!d.isLegacy}`;
    const old = unique.get(key);
    unique.set(key, old ? {...old, prepared: old.prepared || spell.prepared, alwaysPrepared: old.alwaysPrepared || spell.alwaysPrepared} : {...spell});
  }
  return [...unique.values()].sort((a,b) => (a.definition.level || 0) - (b.definition.level || 0) || a.definition.name.localeCompare(b.definition.name));
}
export const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function range(spell) {
  const r = spell.range || spell.definition.range || {};
  let text = r.origin === 'Ranged' && r.rangeValue != null ? `${r.rangeValue} ft` : r.origin || '—';
  if (r.aoeValue != null) text += `; ${r.aoeValue} ft ${r.aoeType || 'area'}`;
  return text;
}
export function duration(d) {
  const v = d.duration || {};
  const text = v.durationInterval != null ? `${v.durationInterval} ${(v.durationUnit || '').toLowerCase()}` : v.durationType || '—';
  return (d.concentration ? 'Conc., up to ' : '') + text;
}
export function casting(spell) {
  const a = spell.activation || spell.definition.activation || {};
  const label = {1:'Action',3:'Bonus action',4:'Reaction',6:'Minute',7:'Hour',8:'Special'}[a.activationType] || 'Special';
  return a.activationTime && (a.activationTime !== 1 || ['Minute','Hour'].includes(label)) ? `${a.activationTime} ${label.toLowerCase()}` : label;
}

export function characterData(payload) {
  if(!payload || typeof payload!=='object' || Array.isArray(payload) || payload.success===false)throw new Error('Character unavailable. Check the public-sharing setting and download link.');
  const data=payload.data ?? payload;
  if(!data || typeof data!=='object' || typeof data.name!=='string' || (!data.spells && !data.classSpells))throw new Error('This JSON is not a D&D Beyond character response.');
  return data;
}
