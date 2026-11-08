import {escape as escapeHtml} from './core.js';
// Only inline bold/italic; other Markdown and HTML remain literal.
export function printEmphasis(text,names=[]) {
 const lines=String(text).split('\n').map(line=>{
  for(const name of names){
   const prefix=line.match(/^\s*(?:[•*]\s+)?/)?.[0]||'';
   const rest=line.slice(prefix.length);
   if(rest.startsWith(name) && /^(?:\s*[—•|]|\s*$)/.test(rest.slice(name.length)))return prefix+'**'+name+'**'+rest.slice(name.length);
  }
  return line;
 });
 return escapeHtml(lines.join('\n')).replace(/\*\*([^*\n]+)\*\*|(?<!\*)\*([^*\n]+)\*(?!\*)/g,(_,bold,italic)=>bold?'<strong>'+bold+'</strong>':'<em>'+italic+'</em>');
}
export function preparePrintEmphasis(root,names=[]){
 root.querySelectorAll('.character-print-text').forEach(el=>el.remove());
 for(const field of root.querySelectorAll('textarea.character-value')){
  const mirror=document.createElement('div');
  mirror.className='character-value character-print-text';
  mirror.setAttribute('style',field.getAttribute('style')||'');
  mirror.innerHTML=printEmphasis(field.value,names);
  field.after(mirror);
 }
}
