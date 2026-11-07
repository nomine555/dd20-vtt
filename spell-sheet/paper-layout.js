export function characterPaperLayout(paper='a4',borderless=false){
 const [width,height]=paper==='letter'?[215.9,279.4]:[210,297];
 const margin=borderless?0:10;
 const pageWidth=width-2*margin,pageHeight=height-2*margin;
 const inset=borderless?.02:0;
 // Each paper uses its own template proportions; background fills remaining paper.
 const ratio=paper==='letter'?1447/1880:190/269;
 const contentWidth=Math.min(pageWidth*(1-2*inset),pageHeight*(1-2*inset)*ratio);
 const contentHeight=contentWidth/ratio;
 return {width,height,margin,pageWidth,pageHeight,contentWidth,contentHeight,
  left:(pageWidth-contentWidth)/2/pageWidth*100,top:(pageHeight-contentHeight)/2/pageHeight*100,
  contentWidthPercent:contentWidth/pageWidth*100,contentHeightPercent:contentHeight/pageHeight*100};
}
