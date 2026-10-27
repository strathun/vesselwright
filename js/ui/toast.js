import { $ } from '../util.js';

export function toast(html){const d=document.createElement('div');d.className='toast';d.innerHTML=html;$('#toasts').appendChild(d);
  setTimeout(()=>d.remove(),3600);const all=$('#toasts').children;while(all.length>5)all[0].remove();}
