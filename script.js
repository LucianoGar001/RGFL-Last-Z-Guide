const grid=document.getElementById('guideGrid');
const search=document.getElementById('search');
const filters=document.getElementById('filters');
const viewer=document.getElementById('viewer');
const viewerImage=document.getElementById('viewerImage');
const viewerTitle=document.getElementById('viewerTitle');
const closeViewer=document.getElementById('closeViewer');
const emptyState=document.getElementById('emptyState');
const viewerBody=document.querySelector('.viewer-body');

let activeFilter='All';
let guides=[];

const galleryBar=document.createElement('div');
galleryBar.style.cssText='display:none;position:sticky;top:0;z-index:1;background:#0c1117;border-bottom:1px solid #27313a;padding:12px 14px;';
viewerBody.insertBefore(galleryBar,viewerImage);

function esc(s){
  return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
}

function guideImages(g){
  if(Array.isArray(g.images)&&g.images.length)return g.images;
  return [{file:`${g.id}.webp`,title:g.title,description:g.subtitle||''}];
}

function setupFilters(){
  const existing=new Set([...filters.querySelectorAll('[data-filter]')].map(b=>b.dataset.filter));
  [...new Set(guides.map(g=>g.category))].forEach(category=>{
    if(existing.has(category))return;
    const button=document.createElement('button');
    button.className='filter';
    button.type='button';
    button.dataset.filter=category;
    button.textContent=category;
    filters.appendChild(button);
  });
}

function render(){
  const q=search.value.trim().toLowerCase();
  const filtered=guides.filter(g=>{
    const inFilter=activeFilter==='All'||g.category===activeFilter;
    const imageText=guideImages(g).flatMap(i=>[i.title||'',i.description||'']);
    const haystack=[g.title,g.subtitle||'',g.category,...(g.tags||[]),...(g.key||[]),...imageText].join(' ').toLowerCase();
    return inFilter&&(!q||haystack.includes(q));
  });

  grid.innerHTML=filtered.map(g=>{
    const images=guideImages(g);
    const preview=images[0].file;
    const buttonText=images.length>1?`View ${images.length} guides`:'View full guide';
    return `<article class="guide-card">
      <div class="guide-visual">
        <img src="assets/web/${esc(preview)}" alt="${esc(g.title)} infographic preview" loading="lazy">
        <button class="open-guide" type="button" data-guide="${esc(g.id)}">${buttonText}</button>
      </div>
      <div class="card-body">
        <div class="card-top">
          <div><h3>${esc(g.title)}</h3><p class="subtitle">${esc(g.subtitle||'')}</p></div>
          <span class="badge">${esc(g.category)}</span>
        </div>
        <div class="key-title">KEY INFORMATION</div>
        <ul class="key-list">${(g.key||[]).map(item=>`<li>${esc(item)}</li>`).join('')}</ul>
        ${images.length>1?`<div class="key-title">INCLUDED GUIDES</div><ul class="key-list">${images.map(i=>`<li><strong>${esc(i.title)}</strong> — ${esc(i.description||'')}</li>`).join('')}</ul>`:''}
        <div class="tags">${(g.tags||[]).map(t=>`<span class="tag">${esc(t)}</span>`).join('')}</div>
      </div>
    </article>`;
  }).join('');

  emptyState.hidden=filtered.length!==0;
}

function showGalleryImage(g,index){
  const images=guideImages(g);
  const item=images[index];
  viewerImage.src=`assets/web/${item.file}`;
  viewerImage.alt=`${g.title} — ${item.title} infographic`;

  if(images.length<=1){
    galleryBar.style.display='none';
    return;
  }

  galleryBar.style.display='block';
  galleryBar.innerHTML=`
    <div style="font-weight:800;color:#f3f0e8;margin-bottom:4px">${esc(item.title)}</div>
    <div style="font-size:.82rem;color:#aab2bb;line-height:1.4;margin-bottom:10px">${esc(item.description||'')}</div>
    <div style="display:flex;gap:7px;overflow-x:auto;padding-bottom:2px">
      ${images.map((img,i)=>`<button type="button" class="filter ${i===index?'active':''}" data-gallery-index="${i}" style="white-space:nowrap">${i+1}. ${esc(img.title)}</button>`).join('')}
    </div>`;

  galleryBar.querySelectorAll('[data-gallery-index]').forEach(btn=>{
    btn.addEventListener('click',()=>showGalleryImage(g,Number(btn.dataset.galleryIndex)));
  });
}

function openGuide(id){
  const g=guides.find(x=>x.id===id);
  if(!g)return;
  viewerTitle.textContent=g.title;
  showGalleryImage(g,0);
  viewerBody.scrollTop=0;
  if(typeof viewer.showModal==='function')viewer.showModal();
  else viewer.setAttribute('open','');
}

grid.addEventListener('click',e=>{
  const btn=e.target.closest('[data-guide]');
  if(btn)openGuide(btn.dataset.guide);
});

filters.addEventListener('click',e=>{
  const btn=e.target.closest('[data-filter]');
  if(!btn)return;
  activeFilter=btn.dataset.filter;
  filters.querySelectorAll('.filter').forEach(b=>b.classList.toggle('active',b===btn));
  render();
});

search.addEventListener('input',render);
closeViewer.addEventListener('click',()=>viewer.close());
viewer.addEventListener('click',e=>{if(e.target===viewer)viewer.close();});
document.getElementById('printBtn').addEventListener('click',()=>window.print());

fetch('guides.json')
  .then(r=>r.json())
  .then(data=>{guides=data;setupFilters();render();})
  .catch(()=>{grid.innerHTML='<div class="empty">Could not load guide data.</div>';});
