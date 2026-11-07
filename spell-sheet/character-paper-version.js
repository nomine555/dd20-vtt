// A dedicated Letter template. Keep the same editable nodes while moving them
// between pages so paper switches preserve text, feature choices and portrait.
export function applyCharacterPaperVersion(root,paper='a4'){
 const pages=[...root.querySelectorAll('.character-paper')];
 if(pages.length!==2)return;
 const [front,back]=pages.map(p=>p.querySelector('.character-content'));
 const equipment=root.querySelector('[aria-label="Equipo"]');
 const equipmentLabel=root.querySelector('[data-character-label="equipment"]');
 const portrait=root.querySelector('.character-portrait');
 for(const el of root.querySelectorAll('.character-value,.character-label,.character-portrait')){
  if(el.dataset.a4Style===undefined)el.dataset.a4Style=el.getAttribute('style')||'';
  el.setAttribute('style',el.dataset.a4Style);
 }
 back.append(equipmentLabel,equipment);front.append(portrait);
 pages.forEach((page,i)=>{page.querySelector('.character-background').src=`assets/character-boxes-${paper==='letter'?'letter-':''}${i?'back':'front'}.${paper==='letter'?'svg':'png'}`;});
 if(paper!=='letter')return;
 // Letter removes 168 template units from the bottom; the upper statistics,
 // attacks and skills retain their original positions and proportions.
 for(const el of root.querySelectorAll('.character-value,.character-label')){
  el.style.top=parseFloat(el.style.top)*2048/1880+'%';
  el.style.height=parseFloat(el.style.height)*2048/1880+'%';
 }
 const position=(el,x,y,w,h)=>{Object.assign(el.style,{left:x/1447*100+'%',top:y/1880*100+'%',width:w/1447*100+'%',height:h/1880*100+'%'});};
 const features=root.querySelector('[aria-label="Habilidades especiales"]');
 position(features,58,1268,735,484);
 position(root.querySelector('[data-character-label="languages"]'),68,1802,125,30);
 position(root.querySelector('[aria-label="Idiomas"]'),226,1796,591,38);
 front.append(equipmentLabel,equipment);
 position(equipmentLabel,890,1490,470,40);
 position(equipment,895,1540,470,275);
 const notes=root.querySelector('[aria-label="Notas"]');
 notes.style.height=(1940/3508*2048-168)/1880*100+'%';
 back.append(portrait);
 position(portrait,850,40,560,625);
}
