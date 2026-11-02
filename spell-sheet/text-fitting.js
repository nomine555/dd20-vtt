// Container-relative sizing keeps the same proportions on screen and paper.
export function fitCharacterText(root,proseFontPt=12,contentWidthMm=190) {
 const requested=Number(proseFontPt),size=Number.isFinite(requested) && requested>=8 && requested<=16?requested:10;
 // Convert points using the printable content width in the selected print mode.
 // so the responsive preview and printed sheet have the same text proportions.
 const proseSize=size*25.4/(72*contentWidthMm)*100;
 for(const field of root.querySelectorAll('.character-value')) {
  if(!field.clientWidth || !field.clientHeight)continue;
  if(field.classList.contains('character-prose')){field.style.fontSize=proseSize.toFixed(6)+'cqw';continue;}
  if(!field.dataset.preferredSize)field.dataset.preferredSize=String(parseFloat(field.style.fontSize)||2);
  const max=Number(field.dataset.preferredSize),min=Math.max(.8,max*.65);
  field.style.fontSize=min+'cqw';
  if(field.value) {
   let lo=min,hi=max;
   for(let i=0;i<9;i++){
    const mid=(lo+hi)/2;field.style.fontSize=mid+'cqw';
    if(field.scrollHeight<=field.clientHeight+1 && field.scrollWidth<=field.clientWidth+1)lo=mid;else hi=mid;
   }
   field.style.fontSize=lo.toFixed(3)+'cqw';
  }else field.style.fontSize=max+'cqw';
 }
}
