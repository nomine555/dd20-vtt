export const characterBackgrounds={
 original:{label:'Original',src:'assets/character-art-original.jpg'},
 winter:{label:'Winter landscape',src:'assets/character-art-winter.png'},
 parchment:{label:'Arcane parchment',src:'assets/character-art-parchment.png'},
 city:{label:'Shadowed city',src:'assets/character-art-city.png'},
 forest:{label:'Verdant forest',src:'assets/character-art-forest.png'},
 dungeon:{label:"Witch's dungeon",src:'assets/character-art-dungeon.png'}
};
export function characterPaperLayers(back=false){
 const art=characterBackgrounds.city.src;
 return `<img class="character-artwork" data-character-art src="${art}" alt="" aria-hidden="true"><div class="character-content"><img class="character-background" src="assets/character-boxes-${back?'back':'front'}.png" alt="${back?'Reverso de ficha de personaje':'Plantilla de ficha de personaje'}"><img class="character-artwork character-artwork-glaze" data-character-art src="${art}" alt="" aria-hidden="true">`;
}
export function applyCharacterBackground(root,key='city'){
 const selected=Object.hasOwn(characterBackgrounds,key)?key:'city';
 root.querySelectorAll('[data-character-art]').forEach(img=>{img.src=characterBackgrounds[selected].src;});
 root.querySelectorAll('.character-paper').forEach(paper=>{paper.dataset.background=selected;});
}
