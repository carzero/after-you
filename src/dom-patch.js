// Preserve mounted sprites between simulation frames; replacing innerHTML can blank SVG images.
function key(node){if(node.nodeType!==1)return null;return node.id||node.getAttribute('data-actor')||(node.hasAttribute('data-row')?`${node.getAttribute('data-row')}:${node.getAttribute('data-side')}`:null);}
function compatible(a,b){return a&&a.nodeType===b.nodeType&&(a.nodeType!==1||(a.localName===b.localName&&a.namespaceURI===b.namespaceURI));}
function update(target,source){
 if(source.nodeType!==1){if(target.nodeValue!==source.nodeValue)target.nodeValue=source.nodeValue;return;}
 for(const attr of [...target.attributes])if(!source.hasAttributeNS(attr.namespaceURI,attr.localName))target.removeAttributeNS(attr.namespaceURI,attr.localName);
 for(const attr of source.attributes)if(target.getAttributeNS(attr.namespaceURI,attr.localName)!==attr.value)target.setAttributeNS(attr.namespaceURI,attr.name,attr.value);
 children(target,source);
}
function children(target,source){
 let at=target.firstChild;
 for(const desired of [...source.childNodes]){
  const wanted=key(desired);
  let current=wanted?[...target.childNodes].find(node=>key(node)===wanted&&compatible(node,desired)):at;
  if(!compatible(current,desired)||(!wanted&&key(current))){current=desired.cloneNode(true);target.insertBefore(current,at);}
  else {if(current!==at)target.insertBefore(current,at);update(current,desired);}
  at=current.nextSibling;
 }
 while(at){const next=at.nextSibling;at.remove();at=next;}
}
export function patchMarkup(target,markup){const template=document.createElement('template');template.innerHTML=markup;children(target,template.content);}
