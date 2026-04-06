import{initializeApp as e}from"https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";import{collection as t,deleteDoc as n,doc as r,getDoc as i,getDocs as a,getFirestore as o,onSnapshot as s,setDoc as c,updateDoc as l}from"https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";var u=(e,t)=>()=>(e&&(t=e(e=0)),t),d=(e,t)=>()=>(t||e((t={exports:{}}).exports,t),t.exports);(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();function f(e){_=e}function p(e){v=e}function m(e){y=e}var h,g,_,v,y,b=u((()=>{h=[`Elecnor`,`Sertori`,`Sirti`],g={Stefano:{hash:`6cf6ea93e6f6aea4b693ef7fb643686b01bbf00e6d38bab620008e074a895349`,role:`admin`},Piero:{hash:`83e3b78f14e08cc5e0bf037b1668b27bcde446cb05f04f86845deaf7812be71d`,role:`viewer`}},_=null,v=h[0],y=`live`}));function x(e){return e==null?``:String(e).replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`).replace(/'/g,`&#39;`)}function S(e){if(!e||e===`—`)return!1;try{let t=e.split(` `);if(t.length<2)return!1;let n=t[1],r=new Date;return n===String(r.getDate()).padStart(2,`0`)+`/`+String(r.getMonth()+1).padStart(2,`0`)+`/`+r.getFullYear()}catch{return!1}}function ee(e){if(!e||e===`—`)return null;try{let[t,n]=e.split(` `),[r,i]=t.split(`:`),[a,o,s]=n.split(`/`);return new Date(s,o-1,a,r,i)}catch{return null}}function C(e){if(!e||e===`—`)return`—`;try{let[t,n]=e.split(` `),[r,i]=t.split(`:`),[a,o,s]=n.split(`/`),c=new Date(s,o-1,a,r,i),l=(Date.now()-c.getTime())/1e3/60,u=[`Dom`,`Lun`,`Mar`,`Mer`,`Gio`,`Ven`,`Sab`][c.getDay()];return l<2?`adesso`:l<60?`${Math.round(l)} min fa`:l<1440?`${Math.round(l/60)} ore fa`:l<1440*7?`${u} ${a}/${o}`:`tempo fa`}catch{return e}}function w(e){if(!e||e===`—`)return`status-red status-circle`;try{let[t,n]=e.split(` `),[r,i]=t.split(`:`),[a,o,s]=n.split(`/`),c=new Date(s,o-1,a,r,i),l=(Date.now()-c.getTime())/1e3/3600;return l<4?`status-green status-circle`:l<24?`status-yellow status-circle`:`status-red status-circle`}catch{return`status-red status-circle`}}function T(e){if(e===`live`)return`📡 Oggi (live)`;let[t,n,r]=e.split(`-`);return`${[`Dom`,`Lun`,`Mar`,`Mer`,`Gio`,`Ven`,`Sab`][new Date(t,n-1,r).getDay()]} ${r}/${n}/${t}`}function E(e,t=`info`,n=3500){let r={success:`✅`,error:`❌`,info:`ℹ️`,warning:`⚠️`},i=document.getElementById(`toast-container`),a=document.createElement(`div`);a.className=`toast toast-${t}`,a.innerHTML=`<span class="toast-icon">${r[t]||`ℹ️`}</span><span class="toast-msg">${x(e)}</span>`,a.addEventListener(`click`,()=>D(a)),i.appendChild(a),a._timer=setTimeout(()=>D(a),n)}function D(e){clearTimeout(e._timer),e.classList.add(`hide`),e.addEventListener(`animationend`,()=>e.remove(),{once:!0})}function O(e){let t=()=>e.querySelectorAll(`button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])`),n=n=>{if(n.key!==`Tab`)return;let r=Array.from(t());if(r.length===0)return;let i=r[0],a=r[r.length-1];n.shiftKey?(document.activeElement===i||!e.contains(document.activeElement))&&(n.preventDefault(),a.focus()):(document.activeElement===a||!e.contains(document.activeElement))&&(n.preventDefault(),i.focus())};return e.addEventListener(`keydown`,n),()=>e.removeEventListener(`keydown`,n)}function k({title:e,msg:t,icon:n=`⚠️`,okLabel:r=`Conferma`,okAccent:i=!1}={}){return new Promise(a=>{document.getElementById(`confirm-icon`).textContent=n,document.getElementById(`confirm-title`).textContent=e||``,document.getElementById(`confirm-msg`).textContent=t||``;let o=document.getElementById(`confirm-ok`);o.textContent=r,o.className=`confirm-btn-ok`+(i?` btn-accent`:``);let s=document.getElementById(`confirm-overlay`);s.classList.add(`show`);let c=O(s.querySelector(`.confirm-box`)),l=e=>{s.classList.remove(`show`),c(),o.replaceWith(o.cloneNode(!0)),document.getElementById(`confirm-cancel`).replaceWith(document.getElementById(`confirm-cancel`).cloneNode(!0)),a(e)};document.getElementById(`confirm-ok`).addEventListener(`click`,()=>l(!0),{once:!0}),document.getElementById(`confirm-cancel`).addEventListener(`click`,()=>l(!1),{once:!0}),s.addEventListener(`click`,e=>{e.target===s&&l(!1)},{once:!0})})}function te({title:e,defaultValue:t=``,icon:n=`✏️`}={}){return new Promise(r=>{document.getElementById(`rename-icon`).textContent=n,document.getElementById(`rename-title`).textContent=e||``;let i=document.getElementById(`rename-input`);i.value=t;let a=document.getElementById(`rename-overlay`);a.classList.add(`show`),requestAnimationFrame(()=>{i.focus(),i.select()});let o=O(a.querySelector(`.confirm-box`)),s=e=>{a.classList.remove(`show`),o(),document.getElementById(`rename-ok`).replaceWith(document.getElementById(`rename-ok`).cloneNode(!0)),document.getElementById(`rename-cancel`).replaceWith(document.getElementById(`rename-cancel`).cloneNode(!0)),i.removeEventListener(`keydown`,c),r(e)},c=e=>{e.key===`Enter`&&(e.preventDefault(),s(i.value.trim()||null)),e.key===`Escape`&&(e.preventDefault(),s(null))};i.addEventListener(`keydown`,c),document.getElementById(`rename-ok`).addEventListener(`click`,()=>s(i.value.trim()||null),{once:!0}),document.getElementById(`rename-cancel`).addEventListener(`click`,()=>s(null),{once:!0}),a.addEventListener(`click`,e=>{e.target===a&&s(null)},{once:!0})})}var A=u((()=>{})),ne,j,M=u((()=>{ne=e({apiKey:`AIzaSyAF6vv0cHkzNaheOsNG52fGI9kLeuV4UJg`,authDomain:`technicalwork-cloud.firebaseapp.com`,projectId:`technicalwork-cloud`,storageBucket:`technicalwork-cloud.firebasestorage.app`,messagingSenderId:`882243863479`,appId:`1:882243863479:web:2d57dbc9741e45e8cb1e32`}),j=o(ne)}));async function re(e,t,n){let r=document.querySelector(`.btn-export`),i=r?r.innerHTML:null;r&&(r.disabled=!0,r.innerHTML=`<span class="btn-spinner"></span> Generazione…`);try{typeof ExcelJS>`u`&&await new Promise((e,t)=>{let n=document.createElement(`script`);n.src=`https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.3.0/exceljs.min.js`,n.onload=e,n.onerror=()=>t(Error(`Impossibile caricare ExcelJS. Controlla la connessione.`)),document.head.appendChild(n)});let r=new Date().toLocaleDateString(`it-IT`),i=n.filter(e=>!/^::.*::$/.test(e.trim())&&!/^;;.*;;$/.test(e.trim())),a=new ExcelJS.Workbook;a.creator=`TechnicalWork`;let o=a.addWorksheet(e),s=t.length+2,c=`Segoe UI`,l=`FF1A2B3C`,u=`FFFFFFFF`,d=`FF212529`,f=`FF0D6EFD`,p=`FFE7F1FF`,m={top:{style:`thin`,color:{argb:`FFDEE2E6`}},bottom:{style:`thin`,color:{argb:`FFDEE2E6`}},left:{style:`thin`,color:{argb:`FFDEE2E6`}},right:{style:`thin`,color:{argb:`FFDEE2E6`}}},h={top:{style:`thin`,color:{argb:`FFDEE2E6`}},bottom:{style:`thin`,color:{argb:`FFDEE2E6`}}};o.getColumn(1).width=40;for(let e=2;e<=t.length+1;e++)o.getColumn(e).width=14;o.getColumn(t.length+2).width=11;let g=o.addRow([`TECHNICALWORK — LISTA MODEM`]);o.mergeCells(1,1,1,s),g.height=30;let _=g.getCell(1);_.font={name:c,size:13,bold:!0,color:{argb:u}},_.fill={type:`pattern`,pattern:`solid`,fgColor:{argb:l}},_.alignment={horizontal:`center`,vertical:`middle`};let v=o.addRow([`${e.toUpperCase()}   ·   ${r}`]);o.mergeCells(2,1,2,s),v.height=22;let y=v.getCell(1);y.font={name:c,size:10,bold:!1,color:{argb:`FFAABCCC`}},y.fill={type:`pattern`,pattern:`solid`,fgColor:{argb:l}},y.alignment={horizontal:`center`,vertical:`middle`};let b=o.addRow([]);o.mergeCells(3,1,3,s),b.height=8,b.getCell(1).fill={type:`pattern`,pattern:`solid`,fgColor:{argb:u}};let x=[`MATERIALE`,...t.map(e=>(e.tecnico||e.id).toUpperCase()),`TOT`],S=o.addRow(x);S.height=22,S.eachCell((e,t)=>{let n=t===s;e.font={name:c,size:9,bold:!0,color:{argb:n?f:u}},e.fill={type:`pattern`,pattern:`solid`,fgColor:{argb:n?p:`FF2C3E50`}},e.alignment={horizontal:t===1?`left`:`center`,vertical:`middle`},e.border={bottom:{style:`medium`,color:{argb:n?f:`FF4A6278`}}}}),i.forEach((e,n)=>{let r=n%2==1?`FFF8F9FA`:u,i=[e,...t.map(t=>{let n=t.materiali&&t.materiali[e]||``;return n===`0`||n===0?``:n}),``],a=o.addRow(i);a.height=20,a.eachCell({includeEmpty:!0},(e,t)=>{let n=t===s,i=e.value?String(e.value).trim():``,a=i===``||i===`0`;e.fill={type:`pattern`,pattern:`solid`,fgColor:{argb:r}},e.alignment={horizontal:t===1?`left`:`center`,vertical:`middle`},e.border=h,t===1?(e.font={name:c,size:9,bold:!0,color:{argb:d}},e.border=m):n?(e.font={name:c,size:9,bold:!0,color:{argb:f}},e.fill={type:`pattern`,pattern:`solid`,fgColor:{argb:p}},e.border=m):(e.font={name:c,size:9,bold:!a,color:{argb:a?`FFADB5BD`:d}},e.border=m)})});let ee=await a.xlsx.writeBuffer(),C=new Blob([ee],{type:`application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`}),w=URL.createObjectURL(C),T=document.createElement(`a`);T.href=w,T.download=`${e}_${r.replace(/\//g,`-`)}.xlsx`,T.click(),URL.revokeObjectURL(w),E(`File "${e}_${r.replace(/\//g,`-`)}.xlsx" scaricato.`,`success`)}catch(e){E(`Errore durante l'esportazione: `+e.message,`error`,5e3),console.error(e)}finally{r&&i&&(r.disabled=!1,r.innerHTML=i)}}function ie(e,t,n){let r=new Date().toLocaleDateString(`it-IT`),i=n.filter(e=>!/^::.*::$/.test(e.trim())&&!/^;;.*;;$/.test(e.trim())),a=``;i.forEach((e,n)=>{let r=n%2==1?`#F8F9FA`:`#FFFFFF`,i=`<td style="padding:4px 6px;font-weight:600;font-size:10px;border:1px solid #DEE2E6;background:${r};white-space:nowrap">${e}</td>`;t.forEach(t=>{let n=t.materiali&&t.materiali[e]||``,a=n===`0`||n===0?``:n,o=a===``;i+=`<td style="padding:4px 6px;text-align:center;font-size:10px;border:1px solid #DEE2E6;background:${r};color:${o?`#ADB5BD`:`#212529`};font-weight:${o?`normal`:`600`};white-space:nowrap">${a||`·`}</td>`}),i+=`<td style="padding:4px 6px;text-align:center;border:1px solid #DEE2E6;background:#E7F1FF;min-width:35px"></td>`,a+=`<tr>${i}</tr>`});let o=`<th style="padding:6px 6px;text-align:left;background:#2C3E50;color:white;font-size:10px;border:1px solid #4A6278">MATERIALE</th>`;t.forEach(e=>{o+=`<th style="padding:6px 6px;text-align:center;background:#2C3E50;color:white;font-size:10px;border:1px solid #4A6278;white-space:nowrap">${(e.tecnico||e.id).toUpperCase()}</th>`}),o+=`<th style="padding:6px 6px;text-align:center;background:#E7F1FF;color:#0D6EFD;font-size:10px;border:1px solid #B6D4FE">TOT</th>`;let s=`
    <!DOCTYPE html><html><head><meta charset="UTF-8">
    <title>TechnicalWork — ${e}</title>
    <style>
      @page { size: A4 landscape; margin: 0 !important; }
      * { box-sizing: border-box; }
      html, body {
        margin: 0; padding: 0;
        width: 297mm; height: 210mm;
        overflow: hidden;
        font-family: 'Segoe UI', sans-serif;
        -webkit-print-color-adjust: exact; print-color-adjust: exact;
      }
      #hint { background: #FFF3CD; color: #856404; text-align: center; padding: 6px; font-size: 11px; font-weight: 600; }
      #print-content { padding: 6mm; }
      table { border-collapse: collapse; }
      @media print { #hint { display: none !important; } }
    </style>
    </head><body>
    <div id="hint">⚠ La tabella verrà scalata automaticamente per entrare in un foglio A4.</div>
    <div id="print-content">
      <div style="background:#1A2B3C;color:white;padding:4px 12px;text-align:center;font-size:11px;font-weight:700;margin-bottom:0">
        TECHNICALWORK — LISTA MODEM
      </div>
      <div style="background:#2C3E50;color:#AABCCC;padding:3px 12px;text-align:center;font-size:9px;margin-bottom:4px">
        ${e.toUpperCase()}   ·   ${r}
      </div>
      <table style="font-size:9px;width:100%">
        <thead><tr>${o}</tr></thead>
        <tbody>${a}</tbody>
      </table>
    </div>
    <script>
      window.onload = function() {
        var el = document.getElementById('print-content');
        var contentW = el.scrollWidth;
        var contentH = el.scrollHeight;
        var mm = 96 / 25.4;
        var pageW = 285 * mm;
        var pageH = 198 * mm;
        var z = Math.min(pageW / contentW, pageH / contentH) * 0.96;
        el.style.zoom = z;
        setTimeout(function() {
          var newH = el.offsetHeight;
          var bodyH = document.body.clientHeight;
          if (newH > bodyH) {
            var fix = (bodyH / newH) * 0.96;
            el.style.zoom = z * fix;
          }
          setTimeout(function(){ window.print(); }, 300);
          window.onafterprint = function(){ window.close(); };
        }, 100);
      };
    <\/script>
    </body></html>`,c=window.open(``,`_blank`,`width=1100,height=700`);c.document.write(s),c.document.close()}var ae=u((()=>{A()}));async function N(){if(B!==null)return B;try{let e=await i(r(j,`settings`,`hidden_tecnici`));B=e.exists()&&e.data().hidden||[]}catch{B=[]}return B}async function P(e){B=e;try{await c(r(j,`settings`,`hidden_tecnici`),{hidden:e})}catch(e){console.error(`Errore salvataggio nascosti`,e)}}function oe(){return V}async function F(){for(let e of h)V[e]||(V[e]=s(t(j,e),async t=>{let n=await N(),r=t.docs.filter(e=>{if(/_\d{4}-\d{2}-\d{2}$/.test(e.id))return!1;let t=e.data();if(n.includes(t.tecnico||e.id)||!S(t.ultimo_aggiornamento))return!1;let r=t.materiali;return r?Object.values(r).some(e=>e!==``&&e!==`0`&&e!==0):!1}),i=document.getElementById(`cnt-`+e);i&&(i.textContent=r.length,r.length>0?i.style.color=`var(--accent)`:i.style.color=``)}))}function se(e){window.location.hash=`#/appalti/${v}/${e}`}function I(){document.querySelectorAll(`.snapshot-dropdown.open`).forEach(e=>{e.classList.remove(`open`);let t=e.querySelector(`.snapshot-trigger`);t&&t.setAttribute(`aria-expanded`,`false`)})}function ce(e){e.stopPropagation();let t=e.currentTarget.closest(`.snapshot-dropdown`);if(!t)return;let n=t.classList.contains(`open`);if(I(),!n){t.classList.add(`open`),e.currentTarget.setAttribute(`aria-expanded`,`true`);let n=t.querySelector(`.snapshot-option.active`),r=t.querySelector(`.snapshot-option`),i=n||r;i&&i.focus()}}function le(e){I(),se(e)}function ue(e,t){document.querySelectorAll(`.sidebar-item`).forEach(e=>e.classList.remove(`active`)),t.classList.add(`active`),p(e),m(`live`),B=null,document.getElementById(`tb-appalto`).textContent=e,R(e,`live`),L()}function de(){let e=document.querySelector(`.sidebar`),t=document.getElementById(`sidebar-overlay`);e.classList.contains(`open`)?L():(e.classList.add(`open`),t.classList.add(`show`))}function L(){let e=document.querySelector(`.sidebar`),t=document.getElementById(`sidebar-overlay`);e&&e.classList.remove(`open`),t&&t.classList.remove(`show`)}async function fe(e){if(H[e])return H[e];let t=[`:: MATERIALE ACCESSORIO ::`,`PTE / MU`,`ROE / ROEL`,`CAVO DROP (MT)`,`MINIPRESA / BORCHIA`,`MODEM / ONT`,`:: ALTRO ::`,`RIFLETTORE`,`SISTEMAZIONE LOCALI`];try{let n=`https://raw.githubusercontent.com/gmaclol/Technicalwork-Materiali/master/lists/${e}.txt`,r=await fetch(n);if(r.ok||(n=`https://raw.githubusercontent.com/gmaclol/Technicalwork-Materiali/master/lists/lista.txt`,r=await fetch(n)),!r.ok)return t;let i=(await r.text()).split(/\r?\n/).map(e=>e.trim()).filter(e=>e!==``);return H[e]=i.length>0?i:t,H[e]}catch(e){return console.error(`Fetch raw list error:`,e),t}}async function pe(e,t,n,r){e.preventDefault();let i=document.getElementById(`loc-`+t);if(!i||i.dataset.loaded){window.open(i.href,`_blank`);return}i.textContent=`⊙ caricamento...`;let a=`${n}_${r}`;try{let e=``;if(U[a])e=U[a];else{let t=await(await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${n}&lon=${r}&format=json`)).json(),i=t.address;e=i.road?`${i.road}${i.house_number?` `+i.house_number:``}, ${i.city||i.town||i.village||``}`:t.display_name.split(`,`).slice(0,2).join(`,`),U[a]=e}i.textContent=`⊙ `+e.trim(),i.dataset.loaded=`1`}catch{i.textContent=`⊙ ${Number(n).toFixed(4)}, ${Number(r).toFixed(4)}`,i.dataset.loaded=`1`}}function me(e){let t=e&&e.closest?e.closest(`.table-scroll`):null;if(!t){e.scrollIntoView({inline:`center`,behavior:`smooth`,block:`nearest`});return}let n=e.getBoundingClientRect(),r=t.getBoundingClientRect(),i=t.scrollLeft+(n.left-r.left+n.width/2)-r.width/2;t.scrollTo({left:Math.max(0,i),behavior:`smooth`})}function he(e,t){let n=e&&e.closest?e.closest(`th`):null;if(!n)return;let r=n.parentElement;if(!r||!r.children)return;let i=Array.from(r.children).filter(e=>e.tagName===`TH`),a=i[i.indexOf(n)+t];a&&me(a)}function ge(e){let t=e.trim().toLowerCase(),n=document.querySelectorAll(`tbody tr`),r=null,i=!1;n.forEach(e=>{if(e.classList.contains(`separator-row`))r&&(r.style.display=i?``:`none`),r=e,i=!1;else{let n=e.dataset.material||``,r=t===``||n.includes(t);e.style.display=r?``:`none`,r&&(i=!0)}}),r&&(r.style.display=i?``:`none`)}function _e(e){let t=0;e.forEach(e=>{e.materiali&&Object.values(e.materiali).forEach(e=>{let n=parseInt(e);!isNaN(n)&&n>0&&(t+=n)})});let n=null,r=`—`;e.forEach(e=>{let t=ee(e.ultimo_aggiornamento);t&&(!n||t>n)&&(n=t,r=e.ultimo_aggiornamento)});let i=document.getElementById(`kpi-total`),a=document.getElementById(`kpi-tecnici`),o=document.getElementById(`kpi-sync`);i&&(i.textContent=t.toLocaleString(`it-IT`)),a&&(a.textContent=e.length),o&&(o.textContent=C(r))}async function R(e,n=`live`){B=null;let r=document.getElementById(`content`);r.innerHTML=`
    <div class="state-box">
      <div class="loader-spinner"></div>
      <p>Recupero dati ${e}…</p>
    </div>`,q&&=(q(),null),W=null;try{if(n===`live`)q=s(t(j,e),async t=>{let i=[];t.forEach(e=>i.push({id:e.id,...e.data()}));let a=await N(),o=i.filter(e=>!/_\d{4}-\d{2}-\d{2}$/.test(e.id)).filter(e=>!a.includes(e.tecnico||e.id)).filter(e=>S(e.ultimo_aggiornamento)).filter(e=>{let t=e.materiali;return t?Object.values(t).some(e=>e!==``&&e!==`0`&&e!==0):!1}),s=document.getElementById(`cnt-`+e);s&&(s.textContent=o.length,o.length>0?s.style.color=`var(--accent)`:s.style.color=``);let c=await fe(e);if(o.length===0){if(c.length===0){r.innerHTML=`
              <div class="state-box fade-in">
                <h2>Nessun dato</h2>
                <p>Nessun tecnico ha ancora sincronizzato per <strong>${e}</strong>.</p>
              </div>`;return}W=null,z(e,[],r,n,i,c);return}z(e,o,r,n,i,c)},e=>{console.error(e),r.innerHTML=`<div class="state-box fade-in"><p>Errore connessione Live.</p></div>`});else{let i=await a(t(j,e)),o=[];i.forEach(e=>o.push({id:e.id,...e.data()}));let s=o.filter(e=>e.id.endsWith(`_`+n)),c=await N(),l=s.map(e=>({...e,id:e.id.replace(`_`+n,``),tecnico:e.tecnico||e.id.replace(`_`+n,``)})).filter(e=>!c.includes(e.tecnico||e.id)),u=await fe(e);if(l.length===0){z(e,[],r,n,o,u);return}z(e,l,r,n,o,u)}}catch(e){r.innerHTML=`
      <div class="state-box fade-in">
        <h2 style="color:var(--red)">Errore</h2>
        <p>Impossibile caricare i dati. Controlla la connessione.</p>
      </div>`,console.error(e)}}function z(e,t,n,r=`live`,i=[],a=[]){let o=a&&a.length>0?a:t.find(e=>e.ordine&&e.ordine.length>0)?.ordine||[],s=new Set(o),c=[],l=new Set,u=new Map;t.forEach(e=>{e.materiali&&Object.keys(e.materiali).forEach(t=>{s.has(t)||(l.has(t)||(l.add(t),c.push(t)),u.has(t)||u.set(t,new Set),u.get(t).add(e.tecnico||e.id))})});let d=[...c,...o];d=d.filter(e=>!/^::.*::$/.test(e.trim())&&!/^;;.*;;$/.test(e.trim()));let f=new Set(c);if(t.length===0&&a&&a.length>0&&(d=a),d.length===0){n.innerHTML=`
      <div class="state-box fade-in">
        <h2>Nessun materiale</h2>
        <p>I dati non contengono materiali.</p>
      </div>`;return}let p=`${e}:${r}`,m=t.map(e=>e.tecnico||e.id);if(W===p&&m.length===G.length&&m.every((e,t)=>e===G[t])&&n.querySelector(`table`)&&window._lastMaterials&&window._lastMaterials.length===d.length){t.forEach((e,t)=>{let r=e.tecnico||e.id;d.forEach(i=>{if(/^::.*::$/.test(i.trim())||/^;;.*;;$/.test(i.trim()))return;let a=e.materiali&&e.materiali[i]||``,o=a===`0`||a===0?``:String(a),s=`${r}:${i}`;if(K.get(s)!==o){let e=n.querySelector(`tr[data-material="${CSS.escape(i.toLowerCase())}"]`);if(e){let n=e.children[t+1];if(n){let e=o===``?`empty`:`has-value`,t=o===``?`·`:o;n.className=`td-value ${e}`,n.textContent=t}}K.set(s,o)}});let i=e.ultimo_aggiornamento||`—`,a=n.querySelectorAll(`.tech-time`)[t];a&&(a.textContent=C(i),a.title=i);let o=n.querySelectorAll(`.tech-name`)[t];if(o){let e=o.querySelector(`.status-circle`);e&&(e.className=w(i))}});let e=n.querySelector(`.content-subtitle`);if(e){let n=r!==`live`;e.innerHTML=`${t.length} tecnici · ${d.length} materiali${n?` · <span style="color:var(--yellow)">snapshot</span>`:``}`}_&&_.role===`admin`&&_e(t),window._lastTecnici=t,window._lastMaterials=d;return}let h=document.getElementById(`material-search`)?.value||``,g=new Date().getFullYear()+`-`+String(new Date().getMonth()+1).padStart(2,`0`)+`-`+String(new Date().getDate()).padStart(2,`0`),v=i.map(e=>e.id),y=[...new Set(v.map(e=>{let t=e.match(/_(\d{4}-\d{2}-\d{2})$/);return t?t[1]:null}).filter(e=>!!e&&e!==g))].sort().reverse().slice(0,7),b=[{value:`live`,label:`📡 Oggi (live)`}];y.forEach(e=>{b.push({value:e,label:T(e)})});let S=b.find(e=>e.value===r)||b[0],E=b.map(e=>`
    <button type="button" class="snapshot-option ${e.value===r?`active`:``}"
      role="option" aria-selected="${e.value===r?`true`:`false`}"
      data-value="${e.value}" onclick="pickSnapshotDate('${e.value}')"
    >${x(e.label)}</button>
  `).join(``),D=r!==`live`,O=_&&_.role===`admin`,k=`
    <div class="content-header fade-in">
      <div>
        <div class="content-title">${e}</div>
        <div class="content-subtitle">${t.length} tecnici · ${d.length} materiali${D?` · <span style="color:var(--yellow)">snapshot</span>`:``}</div>
      </div>
      <div class="content-actions">
        <div class="snapshot-dropdown" id="snapshot-dropdown">
          <button type="button" class="snapshot-trigger" onclick="toggleSnapshotDropdown(event)"
            aria-haspopup="listbox" aria-expanded="false">
            <span class="snapshot-label">${x(S.label)}</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
          </button>
          <div class="snapshot-menu" role="listbox" aria-label="Seleziona snapshot">
            ${E}
          </div>
        </div>
        <button class="btn-icon-text btn-export" onclick="exportToExcel('${e}', window._lastTecnici, window._lastMaterials)" ${t.length===0?`disabled`:``}>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Esporta
        </button>
        <button class="btn-icon-text" onclick="printTable('${e}', window._lastTecnici, window._lastMaterials)" ${t.length===0?`disabled`:``}>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
          Stampa
        </button>
      </div>
    </div>`;if(O&&t.length>0){let e=0;t.forEach(t=>{t.materiali&&Object.values(t.materiali).forEach(t=>{let n=parseInt(t);!isNaN(n)&&n>0&&(e+=n)})});let n=null,r=`—`;t.forEach(e=>{let t=ee(e.ultimo_aggiornamento);t&&(!n||t>n)&&(n=t,r=e.ultimo_aggiornamento)}),k+=`
    <div class="kpi-grid fade-in">
      <div class="kpi-card">
        <div class="kpi-icon">📦</div>
        <div class="kpi-value" id="kpi-total">${e.toLocaleString(`it-IT`)}</div>
        <div class="kpi-label">Materiali totali</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon">👷</div>
        <div class="kpi-value" id="kpi-tecnici">${t.length}</div>
        <div class="kpi-label">Tecnici attivi</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon">🔄</div>
        <div class="kpi-value" id="kpi-sync">${C(r)}</div>
        <div class="kpi-label">Ultimo sync</div>
      </div>
    </div>`}if(t.length>0&&(k+=`
    <div class="search-wrap">
      <input class="search-input" type="search" placeholder="Cerca materiale…"
        oninput="filterMaterials(this.value)" id="material-search" aria-label="Filtra materiali">
    </div>`),k+=`<div class="table-scroll fade-in">`,t.length===0?k+=`
      <div class="state-box" style="background: rgba(255,255,255,0.03); margin-top: 20px; border: 1px dashed rgba(255,255,255,0.1);">
        <p>Nessun tecnico ha sincronizzato dati per questa selezione.</p>
      </div>`:(k+=`
      <table>
        <thead>
          <tr>
            <th><div class="th-inner th-material">Materiale</div></th>`,t.forEach(e=>{let t=e.tecnico||e.id,n=e.ultimo_aggiornamento||`—`,r=e.lat&&e.lng,i=`<span class="${w(n)}"></span>`,a=C(n),o=``;O&&r&&(o=`<a class="tech-location" href="${`https://www.google.com/maps?q=${e.lat},${e.lng}`}" target="_blank" id="loc-${e.id}" onclick="loadGeo(event,'${e.id}',${e.lat},${e.lng})">⊙ mostra posizione</a>`),k+=`
            <th onclick="if(window.innerWidth <= 900) scrollCellIntoViewCenter(this)" style="cursor: pointer;">
              <div class="th-inner th-tech">
                <span class="tech-name">
                  <button type="button" class="tech-nav-left" aria-label="Sposta a sinistra" onclick="event.stopPropagation(); scrollTechHeaderNeighbor(this, -1)">◀</button>
                  ${i}${t}
                </span>
                <span class="tech-time" title="${n}">${a}</span>
                ${o}
              </div>
            </th>`}),k+=`
          </tr>
        </thead>
        <tbody>`,d.forEach(e=>{let n=/^::.*::$/.test(e.trim())||/^;;.*;;$/.test(e.trim());if(n){let n=e.replace(/^[:;]+|[:;]+$/g,``).trim();k+=`
          <tr class="separator-row" data-sep="${x(n)}">
            <td colspan="${t.length+1}">${n}</td>
          </tr>`;return}let r=f.has(e)&&!n,i=r?` class="extra-row"`:``,a=``;r&&u.has(e)&&(a=` title="Inserito da: ${x(Array.from(u.get(e)).join(`, `))}"`),k+=`<tr data-material="${x(e.toLowerCase())}"${i}><td class="td-material"${a}>${e}</td>`,t.forEach(t=>{let n=t.materiali&&t.materiali[e]||``,r=n===`0`||n===0?``:n;k+=`<td class="td-value ${r===``?`empty`:`has-value`}">${r===``?`·`:r}</td>`}),k+=`</tr>`}),k+=`</tbody></table>`),k+=`</div>`,n.innerHTML=k,window._lastTecnici=t,window._lastMaterials=d,W=p,G=[...m],K=new Map,t.forEach(e=>{let t=e.tecnico||e.id;d.forEach(n=>{if(/^::.*::$/.test(n.trim())||/^;;.*;;$/.test(n.trim()))return;let r=e.materiali&&e.materiali[n]||``,i=r===`0`||r===0?``:String(r);K.set(`${t}:${n}`,i)})}),h){let e=document.getElementById(`material-search`);e&&(e.value=h,ge(h))}}var B,V,H,U,W,G,K,q,J=u((()=>{M(),b(),A(),B=null,V={},H={},U={},W=null,G=[],K=new Map,q=null}));async function ve(e){let t=await crypto.subtle.digest(`SHA-256`,new TextEncoder().encode(e));return Array.from(new Uint8Array(t)).map(e=>e.toString(16).padStart(2,`0`)).join(``)}async function ye(){let e=document.getElementById(`inp-user`).value.trim(),t=document.getElementById(`inp-pass`).value,n=document.getElementById(`login-error`),r=await ve(t);g[e]&&g[e].hash===r?(f({name:e,role:g[e].role}),localStorage.setItem(`tw_session`,JSON.stringify({name:e,role:g[e].role})),be()):(n.style.display=`block`,setTimeout(()=>n.style.display=`none`,3e3))}function be(){document.getElementById(`login-screen`).style.display=`none`;let e=document.getElementById(`app`);e.style.display=`flex`,document.getElementById(`tb-user`).textContent=_.name+` — Esci`;let t=document.getElementById(`nav-tecnici-wrapper`);_.role===`admin`?t.style.display=`block`:t.style.display=`none`,F(),!window.location.hash||window.location.hash===`#/`?window.location.hash=`#/appalti/${h[0]}/live`:window.dispatchEvent(new HashChangeEvent(`hashchange`))}function xe(){k({title:`Disconnessione`,msg:`Sei sicuro di voler uscire dalla dashboard?`,icon:`👋`,okLabel:`Esci`,okAccent:!0}).then(e=>{e&&(f(null),localStorage.removeItem(`tw_session`),document.getElementById(`login-screen`).style.display=`flex`,document.getElementById(`app`).style.display=`none`,document.getElementById(`inp-pass`).value=``)})}function Se(){try{let e=localStorage.getItem(`tw_session`);if(e){let t=JSON.parse(e);t&&g[t.name]&&t.role===g[t.name].role&&(f(t),window.addEventListener(`load`,be))}}catch{localStorage.removeItem(`tw_session`)}}var Ce=u((()=>{b(),A(),J()}));async function we(e){if(Q[e])return Q[e];try{let t=await fetch(ke+Z[e]+`.md`);if(!t.ok)return Q[e]=new Map,Q[e];let n=await t.text(),r=new Map,i=n.split(/[·\n]/);for(let e of i){let t=e.split(/[：:]/);if(t.length<2)continue;let n=t[0],i=t.slice(1).join(`:`).trim().replace(/\s+(Global|China|Japan.*|US.*|Canada|South Korea|India.*)$/i,``).trim(),a=/`([^`]+)`/g,o,s=!1;for(;(o=a.exec(n))!==null;)s=!0,r.set(o[1].trim().toUpperCase(),i);if(!s){let e=n.match(/([A-Za-z0-9\-_]+)\s*$/);e&&r.set(e[1].trim().toUpperCase(),i)}}return Q[e]=r,r}catch{return Q[e]=new Map,Q[e]}}async function Te(e){if(!e||e===`—`)return e;let t=e.trim().split(/\s+/),n=t[0].toLowerCase(),r=t.slice(1).join(` `).toUpperCase(),i=Object.keys(Z).find(e=>n.includes(e));if(!i)return e;let a=(await we(i)).get(r);return a?`${t[0]} ${a}`:e}function Y(){let e=oe();for(let t in e)e[t]&&e[t](),delete e[t]}async function X(){document.querySelectorAll(`.sidebar-item`).forEach(e=>e.classList.remove(`active`));let e=document.getElementById(`nav-Tecnici`);e&&e.classList.add(`active`);let n=document.getElementById(`content`);if(_.role!==`admin`){n.innerHTML=`<div class="state-box fade-in"><h2>Accesso Negato</h2><p>Non hai i permessi per visualizzare questa pagina.</p></div>`;return}n.innerHTML=`<div class="state-box"><div class="loader-spinner"></div><p>Caricamento tecnici…</p></div>`;try{let e=new Map;for(let n of h)(await a(t(j,n))).docs.filter(e=>!/_\d{4}-\d{2}-\d{2}$/.test(e.id)).forEach(t=>{let r=t.data(),i=r.tecnico||t.id;e.has(i)||e.set(i,{docIds:{},dispositivo:r.dispositivo||`—`,versione:r.versione_app||``,appalti:[],ultimo:r.ultimo_aggiornamento||`—`}),e.get(i).appalti.push(n),e.get(i).docIds[n]=t.id});if(e.size===0){n.innerHTML=`<div class="state-box fade-in"><p>Nessun tecnico trovato.</p></div>`;return}let r=``,i=await N();for(let[t,n]of e){let e=!i.includes(t),a=await Te(n.dispositivo),o=n.versione?` · <span style="color:var(--accent)">${n.versione}</span>`:``,s=t.replace(/'/g,`\\'`),c=JSON.stringify(n.docIds).replace(/'/g,`&#39;`).replace(/"/g,`&quot;`);r+=`<div class="toggle-wrap">
        <div class="toggle-info">
          <span class="toggle-name">${t}</span>
          <span class="toggle-device">📱 ${a}${o} · ${n.appalti.join(`, `)} · ${n.ultimo}</span>
        </div>
        <div class="tecnici-actions">
          <button class="btn-tecnico-action btn-rename" onclick="renameTecnico('${s}', '${c}')" title="Rinomina">✏️ Rinomina</button>
          <button class="btn-tecnico-action btn-delete" onclick="deleteTecnico('${s}', '${c}')" title="Elimina definitivamente">🗑️ Elimina</button>
          <label class="toggle">
            <input type="checkbox" ${e?`checked`:``} onchange="toggleTecnico('${s}', this.checked)">
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>`}n.innerHTML=`<div class="tecnici-panel fade-in">
      <div class="tecnici-header">
        <div class="content-title">Tecnici</div>
        <div class="tecnici-note">⚠ I tecnici disattivati vengono nascosti dalla tabella e dai conteggi. Il loro sync continua normalmente.</div>
      </div>${r}</div>`}catch(e){n.innerHTML=`<div class="state-box fade-in"><p>Errore caricamento tecnici.</p></div>`,console.error(e)}}async function Ee(e,i){if(await k({title:`Eliminare "${e}"?`,msg:`Verranno cancellati TUTTI i dati di questo tecnico (inclusi gli snapshot) da tutti gli appalti. Questa azione è irreversibile.`,icon:`🗑️`,okLabel:`Elimina definitivamente`}))try{let o=JSON.parse(i.replace(/&#39;/g,`'`).replace(/&quot;/g,`"`));for(let[e,i]of Object.entries(o)){await n(r(j,e,i));let o=(await a(t(j,e))).docs.filter(e=>e.id.startsWith(i+`_`)&&/_\d{4}-\d{2}-\d{2}$/.test(e.id));for(let t of o)await n(r(j,e,t.id))}let s=await N();s=s.filter(t=>t!==e),await P(s),Y(),F(),E(`Tecnico "${e}" eliminato.`,`success`),X()}catch(e){E(`Errore durante l'eliminazione: `+e.message,`error`,5e3),console.error(e)}}async function De(e,n){let i=await te({title:`Rinomina tecnico`,defaultValue:e,icon:`✏️`});if(!i||i===e)return;let o=i;try{let i=JSON.parse(n.replace(/&#39;/g,`'`).replace(/&quot;/g,`"`));if(Object.keys(i).length>0){let e=Object.values(i)[0];try{await c(r(j,`settings`,`devices_names`),{[e]:o},{merge:!0})}catch{}}for(let[e,n]of Object.entries(i)){await l(r(j,e,n),{tecnico:o});let i=(await a(t(j,e))).docs.filter(e=>e.id.startsWith(n+`_`)&&/_\d{4}-\d{2}-\d{2}$/.test(e.id));for(let t of i)await l(r(j,e,t.id),{tecnico:o})}let s=await N();s.includes(e)&&(s=s.map(t=>t===e?o:t),await P(s)),Y(),F(),X()}catch(e){E(`Errore durante la rinomina: `+e.message,`error`,5e3),console.error(e)}}async function Oe(e,t){let n=await N();t?n=n.filter(t=>t!==e):n.includes(e)||n.push(e),await P(n),Y(),F(),X()}var Z,ke,Q,Ae=u((()=>{M(),b(),A(),J(),Z={samsung:`samsung_global_en`,xiaomi:`xiaomi`,redmi:`xiaomi`,poco:`xiaomi`,huawei:`huawei_global_en`,honor:`honor_global_en`,oneplus:`oneplus_en`,oppo:`oppo_global_en`,realme:`realme_global_en`,vivo:`vivo_global_en`,motorola:`motorola_global_en`,nokia:`nokia_global_en`,sony:`sony_global_en`,apple:`apple_all_en`,iphone:`apple_all_en`,google:`google_en`,asus:`asus_global_en`,lg:`lg_global_en`},ke=`https://raw.githubusercontent.com/KHwang9883/MobileModels/master/brands/`,Q={}}));async function $(){document.querySelectorAll(`.sidebar-item`).forEach(e=>e.classList.remove(`active`));let e=document.getElementById(`nav-pfs`);e&&e.classList.add(`active`);let n=document.getElementById(`content`);if(_.role!==`admin`){n.innerHTML=`<div class="state-box fade-in"><h2>Accesso Negato</h2><p>Non hai i permessi per visualizzare questa pagina.</p></div>`;return}n.innerHTML=`<div class="state-box"><div class="loader-spinner"></div><p>Caricamento dati PFS…</p></div>`;try{let e=await a(t(j,`pfs_segnalati`)),r=await a(t(j,`pfs_logs`)),i=e.docs.map(e=>({id:e.id,...e.data()})).sort((e,t)=>(t.orario||``).localeCompare(e.orario||``)),o=r.docs.map(e=>({id:e.id,...e.data()})).sort((e,t)=>(t.orario||``).localeCompare(e.orario||``)),s=`<div class="tecnici-panel fade-in">
      <div class="content-header" style="padding:0; margin-bottom: 32px; background:transparent; border:none">
        <div>
          <div class="content-title">Gestione PFS</div>
          <div class="content-subtitle">Elimina o gestisci segnalazioni ed accessi</div>
        </div>
      </div>
      <div id="pfs-delete-toolbar" class="delete-toolbar">
        <span id="pfs-delete-count" style="font-size:14px; font-weight:600; color:var(--red)">0 selezionati</span>
        <button class="btn-bulk-delete" onclick="deleteSelectedPfs()">Elimina Selezionati</button>
      </div>`;s+=`<div style="margin-bottom:48px">
      <h3 style="margin-bottom:16px; color:var(--red); font-size:18px; display:flex; align-items:center; gap:10px">
        <span style="width:8px; height:8px; border-radius:50%; background:var(--red)"></span>
        Nuovi Indirizzi
      </h3>
      <div class="table-scroll" style="padding:0; margin-top:0">
        <table style="font-size:13px">
          <thead>
            <tr>
              <th style="width:50px; padding:12px">
                <label class="pfs-check-wrapper">
                  <input type="checkbox" onclick="toggleAllPfs('sig', this.checked)">
                  <span class="pfs-check-custom"></span>
                </label>
              </th>
              <th class="th-inner">PFS / Indirizzo</th>
              <th class="th-inner">Tecnico</th>
              <th class="th-inner">Orario</th>
              <th class="th-inner" style="text-align:right">Azioni</th>
            </tr>
          </thead>
          <tbody id="pfs-sig-body">`,i.length===0?s+=`<tr><td colspan="5" style="text-align:center; padding:40px; color:var(--text-muted)">Nessuna segnalazione.</td></tr>`:i.forEach(e=>{let t=e.lat&&e.lng?`https://www.google.com/maps?q=${e.lat},${e.lng}`:null;s+=`<tr data-id="${x(e.id)}" data-coll="pfs_segnalati">
          <td style="padding:12px">
            <label class="pfs-check-wrapper">
              <input type="checkbox" class="sig-check" onclick="updatePfsToolbar()">
              <span class="pfs-check-custom"></span>
            </label>
          </td>
          <td class="td-material">
            <div style="font-weight:700">${x(e.nome_pfs)}</div>
            <div style="font-size:11px; opacity:0.7; font-weight:400">${x(e.nuovo_indirizzo)}</div>
          </td>
          <td>${x(e.tecnico)}</td>
          <td style="font-family:var(--font-mono); font-size:11px">${x(e.orario)}</td>
          <td style="text-align:right">
            <div style="display:flex; justify-content:flex-end; gap:8px">
              ${t?`<a href="${t}" target="_blank" rel="noopener noreferrer" class="tech-location" title="Mappa" style="background:var(--accent-glow)">📍</a>`:``}
              <button class="btn-delete-row" onclick="deletePfsItem('${x(e.id)}', 'pfs_segnalati')" title="Elimina">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
              </button>
            </div>
          </td>
        </tr>`}),s+=`</tbody></table></div></div>`,s+=`<div>
      <h3 style="margin-bottom:16px; color:var(--accent); font-size:18px; display:flex; align-items:center; gap:10px">
        <span style="width:8px; height:8px; border-radius:50%; background:var(--accent)"></span>
        Log Accessi (Accuracy)
      </h3>
      <div class="table-scroll" style="padding:0; margin-top:0">
        <table style="font-size:12px">
          <thead>
            <tr>
              <th style="width:50px; padding:12px">
                <label class="pfs-check-wrapper">
                  <input type="checkbox" onclick="toggleAllPfs('log', this.checked)">
                  <span class="pfs-check-custom"></span>
                </label>
              </th>
              <th class="th-inner">Log PFS</th>
              <th class="th-inner">Posizione Rilevata</th>
              <th class="th-inner">Tecnico / Orario</th>
              <th class="th-inner" style="text-align:right">Azioni</th>
            </tr>
          </thead>
          <tbody id="pfs-log-body">`,o.length===0?s+=`<tr><td colspan="5" style="text-align:center; padding:40px; color:var(--text-muted)">Nessun log.</td></tr>`:o.slice(0,100).forEach(e=>{let t=`https://www.google.com/maps?q=${e.lat},${e.lng}`;s+=`<tr data-id="${x(e.id)}" data-coll="pfs_logs">
          <td style="padding:12px">
            <label class="pfs-check-wrapper">
              <input type="checkbox" class="log-check" onclick="updatePfsToolbar()">
              <span class="pfs-check-custom"></span>
            </label>
          </td>
          <td class="td-material">
            <div style="font-weight:700">${x(e.nome_pfs)}</div>
            <div style="font-size:10px; opacity:0.6">${x(e.indirizzo_pfs||``)}</div>
          </td>
          <td style="color:var(--text-muted)">${e.lat.toFixed(5)}, ${e.lng.toFixed(5)}</td>
          <td>
            <div style="font-weight:600">${x(e.tecnico)}</div>
            <div style="font-size:10px; opacity:0.6">${x(e.orario)}</div>
          </td>
          <td style="text-align:right">
             <div style="display:flex; justify-content:flex-end; gap:8px">
              <a href="${t}" target="_blank" rel="noopener noreferrer" class="tech-location" style="background:var(--accent-glow)" title="Controlla">📍</a>
              <button class="btn-delete-row" onclick="deletePfsItem('${x(e.id)}', 'pfs_logs')" title="Elimina">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
              </button>
            </div>
          </td>
        </tr>`}),s+=`</tbody></table></div></div></div>`,n.innerHTML=s}catch(e){n.innerHTML=`<div class="state-box fade-in"><p>Errore caricamento dati PFS.</p></div>`,console.error(e)}}function je(e,t){document.querySelectorAll(`.`+e+`-check`).forEach(e=>e.checked=t),Me()}function Me(){let e=document.querySelectorAll(`.sig-check:checked, .log-check:checked`),t=document.getElementById(`pfs-delete-toolbar`),n=document.getElementById(`pfs-delete-count`);e.length>0?(t.style.display=`flex`,n.textContent=`${e.length} elementi selezionati`):t.style.display=`none`}async function Ne(e,t){if(await k({title:`Eliminare elemento?`,msg:`L'operazione è irreversibile.`,icon:`🗑️`,okLabel:`Elimina`}))try{await n(r(j,t,e)),E(`Elemento eliminato.`,`success`),$()}catch(e){E(`Errore: `+e.message,`error`,5e3)}}async function Pe(){let e=document.querySelectorAll(`.sig-check:checked, .log-check:checked`),t=e.length;if(!await k({title:`Eliminare ${t} element${t===1?`o`:`i`}?`,msg:`L'operazione è irreversibile e coinvolge tutti gli elementi selezionati.`,icon:`🗑️`,okLabel:`Elimina ${t} element${t===1?`o`:`i`}`}))return;let i=document.querySelector(`.btn-bulk-delete`);i&&(i.innerHTML=`<span class="btn-spinner" style="border-color:rgba(255,255,255,0.3);border-top-color:white"></span> Eliminazione…`,i.disabled=!0);try{let i=[];e.forEach(e=>{let t=e.closest(`tr`),a=t.dataset.id,o=t.dataset.coll;i.push(n(r(j,o,a)))}),await Promise.all(i),E(`${t} element${t===1?`o eliminato`:`i eliminati`}.`,`success`),$()}catch(e){E(`Errore durante la cancellazione multipla: `+e.message,`error`,5e3),i&&(i.textContent=`Elimina Selezionati`,i.disabled=!1)}}var Fe=u((()=>{M(),A(),b()}));d((()=>{b(),A(),Ce(),J(),Ae(),Fe(),ae();function e(e){document.documentElement.setAttribute(`data-theme`,e);let t=document.getElementById(`btn-theme`);t&&(t.textContent=e===`dark`?`🌙`:`☀️`);let n=document.querySelector(`meta[name="theme-color"]`);n&&(n.content=e===`dark`?`#020617`:`#f1f5f9`),localStorage.setItem(`tw_theme`,e)}function t(){e((document.documentElement.getAttribute(`data-theme`)||`dark`)===`dark`?`light`:`dark`)}e(localStorage.getItem(`tw_theme`)||`dark`);function n(){let e=document.getElementById(`offline-banner`);e&&(navigator.onLine?e.classList.remove(`show`):e.classList.add(`show`))}window.addEventListener(`online`,n),window.addEventListener(`offline`,n),document.addEventListener(`DOMContentLoaded`,()=>{let e=document.getElementById(`sidebar-appalti`);e&&(e.innerHTML=h.map((e,t)=>`
      <a href="#/appalti/${e}/live" class="sidebar-item" id="nav-${e}" role="button" tabindex="0" onclick="closeDrawer()">
        <div class="sidebar-item-left">
          <div class="dot-indicator"></div>
          ${e}
        </div>
        <span class="sidebar-count" id="cnt-${e}">—</span>
      </a>
    `).join(``))});function r(){let e=document.getElementById(`login-screen`);if(e&&e.style.display!==`none`)return;let t=window.location.hash.slice(1);if(!t||t===`/`){window.location.hash=`#/appalti/${h[0]}/live`;return}let n=t.split(`/`).filter(Boolean),r=n[0];if(r===`admin`){let e=n[1];e===`tecnici`?X():e===`pfs`&&$()}else if(r===`appalti`){let e=n[1]||h[0],t=n[2]||`live`;document.querySelectorAll(`.sidebar-item`).forEach(e=>e.classList.remove(`active`));let r=document.getElementById(`nav-`+e);r&&r.classList.add(`active`),p(e),m(t),document.getElementById(`tb-appalto`).textContent=e,R(e,t)}}window.addEventListener(`hashchange`,r),document.addEventListener(`keydown`,e=>{if(e.key!==`Enter`)return;let t=document.getElementById(`login-screen`).style.display!==`none`,n=document.getElementById(`confirm-overlay`).classList.contains(`show`)||document.getElementById(`rename-overlay`).classList.contains(`show`);t&&!n&&ye()}),document.addEventListener(`keydown`,e=>{let t=document.querySelector(`.snapshot-dropdown.open`);if(!t)return;let n=Array.from(t.querySelectorAll(`.snapshot-option`));if(!n.length)return;let r=n.findIndex(e=>e===document.activeElement);if(e.key===`ArrowDown`)e.preventDefault(),n[(r+1+n.length)%n.length].focus();else if(e.key===`ArrowUp`)e.preventDefault(),n[(r-1+n.length)%n.length].focus();else if(e.key===`Enter`&&r>=0){e.preventDefault();let t=n[r].getAttribute(`data-value`);t&&le(t)}else e.key===`Escape`&&I()}),document.addEventListener(`click`,I),document.addEventListener(`keydown`,e=>{e.key===`Escape`&&I()}),Se(),window.doLogin=ye,window.doLogout=xe,window.toggleTheme=t,window.toggleDrawer=de,window.closeDrawer=L,window.selectAppalto=ue,window.loadAppalto=R,window.refreshData=()=>R(v,y),window.onDateChange=se,window.toggleSnapshotDropdown=ce,window.pickSnapshotDate=le,window.closeSnapshotDropdown=I,window.filterMaterials=ge,window.scrollCellIntoViewCenter=me,window.scrollTechHeaderNeighbor=he,window.loadGeo=pe,window.exportToExcel=re,window.printTable=ie,window.showTecnici=X,window.deleteTecnico=Ee,window.renameTecnico=De,window.toggleTecnico=Oe,window.showPfsDashboard=$,window.toggleAllPfs=je,window.updatePfsToolbar=Me,window.deletePfsItem=Ne,window.deleteSelectedPfs=Pe,window.showToast=E}))();