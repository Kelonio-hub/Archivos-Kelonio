(() => {
  'use strict';
  function init(){
    const sidebar=document.getElementById('guideSidebar');
    const toggle=document.getElementById('mobileSidebarToggle');
    const main=document.getElementById('mainHub');
    if(!sidebar||!toggle)return;
    const set=(open)=>{
      sidebar.classList.toggle('mobile-open',open);
      sidebar.classList.toggle('mobile-hidden',!open && window.innerWidth<=760);
      toggle.setAttribute('aria-expanded',String(open));
    };
    toggle.addEventListener('click',()=>set(!sidebar.classList.contains('mobile-open')));
    const sync=()=>{ if(window.innerWidth>760){sidebar.classList.remove('mobile-hidden','mobile-open')} else if(!sidebar.classList.contains('mobile-open')) sidebar.classList.add('mobile-hidden'); };
    sync(); window.addEventListener('resize',sync,{passive:true});
    main?.addEventListener('click',e=>{const a=e.target.closest?.('.sidebar-link'); if(a&&window.innerWidth<=760)set(false);});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
