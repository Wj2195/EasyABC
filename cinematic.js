/* EasyABC Motion Studio: progressive visual effects only.
   All payment, cart, account, Supabase and admin actions remain in index.html. */
(function(){
  'use strict';
  const reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let lastSignature='';
  let revealObserver=null;

  function safeText(value){return typeof esc==='function'?esc(value):String(value||'').replace(/[&<>"']/g,'');}
  function truncate(text,count){
    const s=String(text||'').replace(/\s+/g,' ').trim();
    return s.length>count?s.slice(0,count-1).trimEnd()+'…':s||'Explore the details, previews and features of this EasyABC digital product.';
  }
  function selectedStories(){
    if(typeof products==='undefined'||!Array.isArray(products))return [];
    const withCovers=products.filter(p=>typeof coverForProduct==='function'&&coverForProduct(p));
    const ordered=[...withCovers,...products.filter(p=>!withCovers.includes(p))];
    const chosen=[],categoriesSeen=new Set();
    // Give the editorial layout more variety when products span multiple categories.
    for(const p of ordered){
      const k=String(p.category_id||'misc');
      if(!categoriesSeen.has(k)&&chosen.length<3){chosen.push(p);categoriesSeen.add(k);}
    }
    for(const p of ordered){
      if(chosen.length>=3)break;
      if(!chosen.includes(p))chosen.push(p);
    }
    return chosen;
  }
  function renderStories(){
    const holder=document.getElementById('cinemaStoryGrid');
    const stat=document.getElementById('cinemaToolCount');
    const total=typeof products!=='undefined'&&Array.isArray(products)?products.length:0;
    if(stat)stat.textContent=String(total).padStart(2,'0');
    if(!holder)return;
    const chosen=selectedStories();
    const signature=chosen.map(p=>{
      const cover=typeof coverForProduct==='function'?coverForProduct(p):null;
      return [p.id,p.n,p.p,p.category_id,cover?.storage_path||''].join(':');
    }).join('|');
    if(lastSignature===signature&&holder.dataset.loaded==='yes')return;
    lastSignature=signature;
    if(!chosen.length){
      holder.innerHTML='<div class="cinema-story-empty">Our featured tools are loading. Explore the live catalog below.</div>';
      return;
    }
    holder.dataset.loaded='yes';
    holder.innerHTML=chosen.map((p,index)=>{
      const cover=typeof coverForProduct==='function'?coverForProduct(p):null;
      const url=cover&&typeof mediaUrl==='function'?mediaUrl(cover.storage_path):'';
      const media=url?'<img src="'+safeText(url)+'" alt="Preview of '+safeText(p.n)+'" loading="lazy" decoding="async">':'<div class="story-placeholder" aria-hidden="true">'+safeText(p.e||'✦')+'</div>';
      const category=(typeof categoryName==='function'?categoryName(p.category_id):'')||'Digital product';
      return '<article class="cinema-story-card" data-product-id="'+Number(p.id)+'" data-variation="'+index+'" role="button" tabindex="0" aria-label="View '+safeText(p.n)+' details">'+
        '<span class="story-cover">'+media+'</span>'+
        '<span class="story-index">THE COLLECTION / 0'+(index+1)+'</span>'+
        '<span class="story-pill">EXPLORE ↗</span>'+
        '<div class="story-copy"><div class="story-category">'+safeText(category)+'</div>'+
        '<h3>'+safeText(p.n)+'</h3>'+
        '<p class="story-summary">'+safeText(truncate(p.d,110))+'</p>'+
        '<div class="story-bottom"><span class="story-price">'+(typeof M==='function'?M(p.p):'')+'</span><span class="story-arrow" aria-hidden="true">↗</span></div></div></article>';
    }).join('');
    observeReveals(holder);
  }
  function observeReveals(root){
    if(reduce||!('IntersectionObserver' in window))return;
    if(!revealObserver){
      revealObserver=new IntersectionObserver(entries=>{
        for(const entry of entries){
          if(entry.isIntersecting){
            entry.target.classList.remove('studio-before');
            entry.target.classList.add('studio-visible');
            revealObserver.unobserve(entry.target);
          }
        }
      },{threshold:.07,rootMargin:'0px 0px -25px 0px'});
    }
    (root||document).querySelectorAll('[data-studio-reveal]:not(.studio-visible)').forEach(el=>{
      if(!el.classList.contains('studio-before'))el.classList.add('studio-before');
      revealObserver.observe(el);
    });
  }
  function initListeners(){
    document.addEventListener('click',event=>{
      const card=event.target.closest('.cinema-story-card[data-product-id]');
      if(card){
        const id=Number(card.dataset.productId);
        if(Number.isFinite(id)&&typeof openProduct==='function')openProduct(id);
      }
    });
    document.addEventListener('keydown',event=>{
      if(event.key!=='Enter'&&event.key!==' ')return;
      const card=event.target.closest('.cinema-story-card[data-product-id]');
      if(card){
        event.preventDefault();
        const id=Number(card.dataset.productId);
        if(Number.isFinite(id)&&typeof openProduct==='function')openProduct(id);
      }
    });
    if(!reduce&&window.matchMedia('(hover:hover) and (pointer:fine)').matches){
      let frame=null;
      document.addEventListener('pointermove',event=>{
        if(frame)return;
        const x=event.clientX,y=event.clientY;
        frame=requestAnimationFrame(()=>{
          frame=null;
          const hero=document.querySelector('.cinema-hero');
          if(hero){
            const r=hero.getBoundingClientRect();
            if(y>=r.top&&y<=r.bottom&&x>=r.left&&x<=r.right){
              hero.style.setProperty('--hero-mouse-x',((x-r.left)/r.width*100).toFixed(1)+'%');
              hero.style.setProperty('--hero-mouse-y',((y-r.top)/r.height*100).toFixed(1)+'%');
            }
          }
        });
      },{passive:true});
      document.addEventListener('pointermove',event=>{
        const card=event.target.closest('#home .card');
        if(!card)return;
        const r=card.getBoundingClientRect();
        card.style.setProperty('--px',((event.clientX-r.left)/r.width*100).toFixed(1)+'%');
        card.style.setProperty('--py',((event.clientY-r.top)/r.height*100).toFixed(1)+'%');
      },{passive:true});
    }
  }
  window.EasyABCCinema={renderStories,observeReveals};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{
    initListeners();renderStories();observeReveals(document);
  },{once:true});
  else{initListeners();renderStories();observeReveals(document);}
})();
