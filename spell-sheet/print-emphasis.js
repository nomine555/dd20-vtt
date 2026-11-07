import {escape as escapeHtml} from './core.js';
// Only single asterisk pairs on one line; no Markdown or HTML interpretation.
export function printEmphasis(text){
 return escapeHtml(String(text)).replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g,'<strong>$1</strong>');
}
export function preparePrintEmphasis(root){
 root.querySelectorAll('.character-print-text').forEach(el=>el.remove());
 for(const field of root.querySelectorAll('textarea.character-value')){
  const mirror=document.createElement('div');
  mirror.className='character-value character-print-text';
  mirror.setAttribute('style',field.getAttribute('style')||'');
  mirror.innerHTML=printEmphasis(field.value);
  field.after(mirror);
 }
}
