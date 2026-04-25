import{initializeApp as e}from"https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";import{collection as t,deleteDoc as n,deleteField as r,doc as i,getDoc as a,getDocs as o,getFirestore as s,onSnapshot as c,setDoc as l,updateDoc as u}from"https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var d=[`Elecnor`,`Sertori`,`Sirti`],f={Stefano:{hash:`6cf6ea93e6f6aea4b693ef7fb643686b01bbf00e6d38bab620008e074a895349`,role:`admin`},Piero:{hash:`83e3b78f14e08cc5e0bf037b1668b27bcde446cb05f04f86845deaf7812be71d`,role:`viewer`}},p=null,m=d[0],h=`live`;function g(e){p=e}function _(e){m=e}function v(e){h=e}var y=`https://raw.githubusercontent.com/gmaclol/Technicalwork-Materiali/master/lists/config.json`,b=`tw_config`,x=`tw_config_time`;async function S(e=0){let t=localStorage.getItem(b),n=localStorage.getItem(x),r=Date.now(),i=!n||r-parseInt(n)>864e5;if(t&&!i&&!(parseInt(n||0)<e))try{let e=JSON.parse(t);if(e.companies&&e.companies.length>0)return d=e.companies,e}catch{}try{let e=await fetch(y);if(e.ok){let t=await e.text(),n=JSON.parse(t);if(n.companies&&n.companies.length>0)return d=n.companies,localStorage.setItem(b,t),localStorage.setItem(x,r.toString()),n}}catch{console.warn(`Config fetch fallito, uso cache/fallback`)}if(t)try{let e=JSON.parse(t);if(e.companies&&e.companies.length>0)return d=e.companies,e}catch{}return{companies:d,pfs_areas:[]}}function C(){localStorage.removeItem(b),localStorage.removeItem(x)}function w(e){return e==null?``:String(e).replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`).replace(/'/g,`&#39;`)}function T(e){if(!e||e===`—`)return!1;try{let t=e.split(` `);if(t.length<2)return!1;let n=t[1],r=new Date;return n===String(r.getDate()).padStart(2,`0`)+`/`+String(r.getMonth()+1).padStart(2,`0`)+`/`+r.getFullYear()}catch{return!1}}function E(e){if(!e||e===`—`)return null;try{let[t,n]=e.split(` `),[r,i]=t.split(`:`),[a,o,s]=n.split(`/`);return new Date(s,o-1,a,r,i)}catch{return null}}function D(e){if(!e||e===`—`)return`—`;try{let[t,n]=e.split(` `),[r,i]=t.split(`:`),[a,o,s]=n.split(`/`),c=new Date(s,o-1,a,r,i),l=(Date.now()-c.getTime())/1e3/60,u=[`Dom`,`Lun`,`Mar`,`Mer`,`Gio`,`Ven`,`Sab`][c.getDay()];return l<2?`adesso`:l<60?`${Math.round(l)} min fa`:l<1440?`${Math.round(l/60)} ore fa`:l<1440*7?`${u} ${a}/${o}`:`tempo fa`}catch{return e}}function ee(e){if(!e||e===`—`)return`status-red status-circle`;try{let[t,n]=e.split(` `),[r,i]=t.split(`:`),[a,o,s]=n.split(`/`),c=new Date(s,o-1,a,r,i),l=(Date.now()-c.getTime())/1e3/3600;return l<4?`status-green status-circle`:l<24?`status-yellow status-circle`:`status-red status-circle`}catch{return`status-red status-circle`}}function te(e){if(e===`live`)return`📡 Oggi (live)`;let[t,n,r]=e.split(`-`);return`${[`Dom`,`Lun`,`Mar`,`Mer`,`Gio`,`Ven`,`Sab`][new Date(t,n-1,r).getDay()]} ${r}/${n}/${t}`}function O(e,t=`info`,n=3500){let r={success:`✅`,error:`❌`,info:`ℹ️`,warning:`⚠️`},i=document.getElementById(`toast-container`),a=document.createElement(`div`);a.className=`toast toast-${t}`,a.innerHTML=`<span class="toast-icon">${r[t]||`ℹ️`}</span><span class="toast-msg">${w(e)}</span>`,a.addEventListener(`click`,()=>k(a)),i.appendChild(a),a._timer=setTimeout(()=>k(a),n)}function k(e){clearTimeout(e._timer),e.classList.add(`hide`),e.addEventListener(`animationend`,()=>e.remove(),{once:!0})}function A(e){let t=()=>e.querySelectorAll(`button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])`),n=n=>{if(n.key!==`Tab`)return;let r=Array.from(t());if(r.length===0)return;let i=r[0],a=r[r.length-1];n.shiftKey?(document.activeElement===i||!e.contains(document.activeElement))&&(n.preventDefault(),a.focus()):(document.activeElement===a||!e.contains(document.activeElement))&&(n.preventDefault(),i.focus())};return e.addEventListener(`keydown`,n),()=>e.removeEventListener(`keydown`,n)}function j({title:e,msg:t,icon:n=`⚠️`,okLabel:r=`Conferma`,okAccent:i=!1}={}){return new Promise(a=>{document.getElementById(`confirm-icon`).textContent=n,document.getElementById(`confirm-title`).textContent=e||``,document.getElementById(`confirm-msg`).textContent=t||``;let o=document.getElementById(`confirm-ok`);o.textContent=r,o.className=`confirm-btn-ok`+(i?` btn-accent`:``);let s=document.getElementById(`confirm-overlay`);s.classList.add(`show`);let c=A(s.querySelector(`.confirm-box`)),l=e=>{s.classList.remove(`show`),c(),o.replaceWith(o.cloneNode(!0)),document.getElementById(`confirm-cancel`).replaceWith(document.getElementById(`confirm-cancel`).cloneNode(!0)),a(e)};document.getElementById(`confirm-ok`).addEventListener(`click`,()=>l(!0),{once:!0}),document.getElementById(`confirm-cancel`).addEventListener(`click`,()=>l(!1),{once:!0}),s.addEventListener(`click`,e=>{e.target===s&&l(!1)},{once:!0})})}function ne({title:e,defaultValue:t=``,icon:n=`✏️`}={}){return new Promise(r=>{document.getElementById(`rename-icon`).textContent=n,document.getElementById(`rename-title`).textContent=e||``;let i=document.getElementById(`rename-input`);i.value=t;let a=document.getElementById(`rename-overlay`);a.classList.add(`show`),requestAnimationFrame(()=>{i.focus(),i.select()});let o=A(a.querySelector(`.confirm-box`)),s=e=>{a.classList.remove(`show`),o(),document.getElementById(`rename-ok`).replaceWith(document.getElementById(`rename-ok`).cloneNode(!0)),document.getElementById(`rename-cancel`).replaceWith(document.getElementById(`rename-cancel`).cloneNode(!0)),i.removeEventListener(`keydown`,c),r(e)},c=e=>{e.key===`Enter`&&(e.preventDefault(),s(i.value.trim()||null)),e.key===`Escape`&&(e.preventDefault(),s(null))};i.addEventListener(`keydown`,c),document.getElementById(`rename-ok`).addEventListener(`click`,()=>s(i.value.trim()||null),{once:!0}),document.getElementById(`rename-cancel`).addEventListener(`click`,()=>s(null),{once:!0}),a.addEventListener(`click`,e=>{e.target===a&&s(null)},{once:!0})})}var M=s(e({apiKey:`AIzaSyAF6vv0cHkzNaheOsNG52fGI9kLeuV4UJg`,authDomain:`technicalwork-cloud.firebaseapp.com`,projectId:`technicalwork-cloud`,storageBucket:`technicalwork-cloud.firebasestorage.app`,messagingSenderId:`882243863479`,appId:`1:882243863479:web:2d57dbc9741e45e8cb1e32`}));async function re(e,t,n){let r=document.querySelector(`.btn-export`),i=r?r.innerHTML:null;r&&(r.disabled=!0,r.innerHTML=`<span class="btn-spinner"></span> Generazione…`);try{typeof ExcelJS>`u`&&await new Promise((e,t)=>{let n=document.createElement(`script`);n.src=`https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.3.0/exceljs.min.js`,n.onload=e,n.onerror=()=>t(Error(`Impossibile caricare ExcelJS. Controlla la connessione.`)),document.head.appendChild(n)});let r=new Date().toLocaleDateString(`it-IT`),i=n.filter(e=>!/^::.*::$/.test(e.trim())&&!/^;;.*;;$/.test(e.trim())),a=new ExcelJS.Workbook;a.creator=`TechnicalWork`;let o=a.addWorksheet(e),s=t.length+2,c=`Segoe UI`,l=`FF1A2B3C`,u=`FFFFFFFF`,d=`FF212529`,f=`FF0D6EFD`,p=`FFE7F1FF`,m={top:{style:`thin`,color:{argb:`FFDEE2E6`}},bottom:{style:`thin`,color:{argb:`FFDEE2E6`}},left:{style:`thin`,color:{argb:`FFDEE2E6`}},right:{style:`thin`,color:{argb:`FFDEE2E6`}}},h={top:{style:`thin`,color:{argb:`FFDEE2E6`}},bottom:{style:`thin`,color:{argb:`FFDEE2E6`}}};o.getColumn(1).width=40;for(let e=2;e<=t.length+1;e++)o.getColumn(e).width=14;o.getColumn(t.length+2).width=11;let g=o.addRow([`TECHNICALWORK — LISTA MODEM`]);o.mergeCells(1,1,1,s),g.height=30;let _=g.getCell(1);_.font={name:c,size:13,bold:!0,color:{argb:u}},_.fill={type:`pattern`,pattern:`solid`,fgColor:{argb:l}},_.alignment={horizontal:`center`,vertical:`middle`};let v=o.addRow([`${e.toUpperCase()}   ·   ${r}`]);o.mergeCells(2,1,2,s),v.height=22;let y=v.getCell(1);y.font={name:c,size:10,bold:!1,color:{argb:`FFAABCCC`}},y.fill={type:`pattern`,pattern:`solid`,fgColor:{argb:l}},y.alignment={horizontal:`center`,vertical:`middle`};let b=o.addRow([]);o.mergeCells(3,1,3,s),b.height=8,b.getCell(1).fill={type:`pattern`,pattern:`solid`,fgColor:{argb:u}};let x=[`MATERIALE`,...t.map(e=>(e.tecnico||e.id).toUpperCase()),`TOT`],S=o.addRow(x);S.height=22,S.eachCell((e,t)=>{let n=t===s;e.font={name:c,size:9,bold:!0,color:{argb:n?f:u}},e.fill={type:`pattern`,pattern:`solid`,fgColor:{argb:n?p:`FF2C3E50`}},e.alignment={horizontal:t===1?`left`:`center`,vertical:`middle`},e.border={bottom:{style:`medium`,color:{argb:n?f:`FF4A6278`}}}}),i.forEach((e,n)=>{let r=n%2==1?`FFF8F9FA`:u,i=[e,...t.map(t=>{let n=t.materiali&&t.materiali[e]||``;return n===`0`||n===0?``:n}),``],a=o.addRow(i);a.height=20,a.eachCell({includeEmpty:!0},(e,t)=>{let n=t===s,i=e.value?String(e.value).trim():``,a=i===``||i===`0`;e.fill={type:`pattern`,pattern:`solid`,fgColor:{argb:r}},e.alignment={horizontal:t===1?`left`:`center`,vertical:`middle`},e.border=h,t===1?(e.font={name:c,size:9,bold:!0,color:{argb:d}},e.border=m):n?(e.font={name:c,size:9,bold:!0,color:{argb:f}},e.fill={type:`pattern`,pattern:`solid`,fgColor:{argb:p}},e.border=m):(e.font={name:c,size:9,bold:!a,color:{argb:a?`FFADB5BD`:d}},e.border=m)})});let C=await a.xlsx.writeBuffer(),w=new Blob([C],{type:`application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`}),T=URL.createObjectURL(w),E=document.createElement(`a`);E.href=T,E.download=`${e}_${r.replace(/\//g,`-`)}.xlsx`,E.click(),URL.revokeObjectURL(T),O(`File "${e}_${r.replace(/\//g,`-`)}.xlsx" scaricato.`,`success`)}catch(e){O(`Errore durante l'esportazione: `+e.message,`error`,5e3),console.error(e)}finally{r&&i&&(r.disabled=!1,r.innerHTML=i)}}function ie(e,t,n){let r=new Date().toLocaleDateString(`it-IT`),i=n.filter(e=>!/^::.*::$/.test(e.trim())&&!/^;;.*;;$/.test(e.trim())),a=``;i.forEach((e,n)=>{let r=n%2==1?`#F8F9FA`:`#FFFFFF`,i=`<td style="padding:4px 6px;font-weight:600;font-size:10px;border:1px solid #DEE2E6;background:${r};white-space:nowrap">${e}</td>`;t.forEach(t=>{let n=t.materiali&&t.materiali[e]||``,a=n===`0`||n===0?``:n,o=a===``;i+=`<td style="padding:4px 6px;text-align:center;font-size:10px;border:1px solid #DEE2E6;background:${r};color:${o?`#ADB5BD`:`#212529`};font-weight:${o?`normal`:`600`};white-space:nowrap">${a||`·`}</td>`}),i+=`<td style="padding:4px 6px;text-align:center;border:1px solid #DEE2E6;background:#E7F1FF;min-width:35px"></td>`,a+=`<tr>${i}</tr>`});let o=`<th style="padding:6px 6px;text-align:left;background:#2C3E50;color:white;font-size:10px;border:1px solid #4A6278">MATERIALE</th>`;t.forEach(e=>{o+=`<th style="padding:6px 6px;text-align:center;background:#2C3E50;color:white;font-size:10px;border:1px solid #4A6278;white-space:nowrap">${(e.tecnico||e.id).toUpperCase()}</th>`}),o+=`<th style="padding:6px 6px;text-align:center;background:#E7F1FF;color:#0D6EFD;font-size:10px;border:1px solid #B6D4FE">TOT</th>`;let s=`
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
    </body></html>`,c=window.open(``,`_blank`,`width=1100,height=700`);c.document.write(s),c.document.close()}var ae=`modulepreload`,oe=function(e,t){return new URL(e,t).href},se={},ce=function(e,t,n){let r=Promise.resolve();if(t&&t.length>0){let e=document.getElementsByTagName(`link`),i=document.querySelector(`meta[property=csp-nonce]`),a=i?.nonce||i?.getAttribute(`nonce`);function o(e){return Promise.all(e.map(e=>Promise.resolve(e).then(e=>({status:`fulfilled`,value:e}),e=>({status:`rejected`,reason:e}))))}r=o(t.map(t=>{if(t=oe(t,n),t in se)return;se[t]=!0;let r=t.endsWith(`.css`),i=r?`[rel="stylesheet"]`:``;if(n)for(let n=e.length-1;n>=0;n--){let i=e[n];if(i.href===t&&(!r||i.rel===`stylesheet`))return}else if(document.querySelector(`link[href="${t}"]${i}`))return;let o=document.createElement(`link`);if(o.rel=r?`stylesheet`:ae,r||(o.as=`script`),o.crossOrigin=``,o.href=t,a&&o.setAttribute(`nonce`,a),document.head.appendChild(o),r)return new Promise((e,n)=>{o.addEventListener(`load`,e),o.addEventListener(`error`,()=>n(Error(`Unable to preload CSS for ${t}`)))})}))}function i(e){let t=new Event(`vite:preloadError`,{cancelable:!0});if(t.payload=e,window.dispatchEvent(t),!t.defaultPrevented)throw e}return r.then(t=>{for(let e of t||[])e.status===`rejected`&&i(e.reason);return e().catch(i)})};function le(e){let t=JSON.stringify(e,Object.keys(e).sort()),n=0;for(let e=0;e<t.length;e++)n=(n<<5)-n+t.charCodeAt(e)|0;return n.toString(36)}async function ue(e,t){let n=new Date().toISOString().slice(0,10),r=new Map;try{let o=i(M,`settings`,`stale_hashes`),s=await a(o),c=s.exists()?s.data():{},u=c[e]||{},d=!1;for(let e of t){let t=e.id,i=le(e.materiali||{}),a=u[t];a&&a.hash===i?a.stale_since&&a.stale_since!==n&&r.set(t,a.stale_since):(u[t]={hash:i,stale_since:n},d=!0)}d&&(c[e]=u,await l(o,c,{merge:!0}))}catch(e){console.warn(`Stale check error:`,e)}return r}var N=null;async function P(){if(N!==null)return N;try{let e=await a(i(M,`settings`,`hidden_tecnici`));N=e.exists()&&e.data().hidden||[]}catch{N=[]}return N}async function F(e){N=e;try{await l(i(M,`settings`,`hidden_tecnici`),{hidden:e})}catch(e){console.error(`Errore salvataggio nascosti`,e)}}var I={};function de(){return I}async function L(){for(let e of d)I[e]||(I[e]=c(t(M,e),async t=>{let n=await P(),r=t.docs.filter(e=>{if(/_\d{4}-\d{2}-\d{2}$/.test(e.id))return!1;let t=e.data();if(n.includes(t.tecnico||e.id)||!T(t.ultimo_aggiornamento))return!1;let r=t.materiali;return r?Object.values(r).some(e=>e!==``&&e!==`0`&&e!==0):!1}),i=document.getElementById(`cnt-`+e);i&&(i.textContent=r.length,r.length>0?i.style.color=`var(--accent)`:i.style.color=``)}))}function fe(e){window.location.hash=`#/appalti/${m}/${e}`}function R(){document.querySelectorAll(`.snapshot-dropdown.open`).forEach(e=>{e.classList.remove(`open`);let t=e.querySelector(`.snapshot-trigger`);t&&t.setAttribute(`aria-expanded`,`false`)})}function pe(e){e.stopPropagation();let t=e.currentTarget.closest(`.snapshot-dropdown`);if(!t)return;let n=t.classList.contains(`open`);if(R(),!n){t.classList.add(`open`),e.currentTarget.setAttribute(`aria-expanded`,`true`);let n=t.querySelector(`.snapshot-option.active`),r=t.querySelector(`.snapshot-option`),i=n||r;i&&i.focus()}}function me(e){R(),fe(e)}function he(e,t){document.querySelectorAll(`.sidebar-item`).forEach(e=>e.classList.remove(`active`)),t.classList.add(`active`),_(e),v(`live`),N=null,document.getElementById(`tb-appalto`).textContent=e,K(e,`live`),z()}function ge(){let e=document.querySelector(`.sidebar`),t=document.getElementById(`sidebar-overlay`);e.classList.contains(`open`)?z():(e.classList.add(`open`),t.classList.add(`show`))}function z(){let e=document.querySelector(`.sidebar`),t=document.getElementById(`sidebar-overlay`);e&&e.classList.remove(`open`),t&&t.classList.remove(`show`)}var B={};async function _e(){let e=[`lista`,`elecnor`,`sertori`,`sirti`].map(e=>e.toLowerCase());for(let t of e)localStorage.removeItem(`tw_list_${t}`),localStorage.removeItem(`tw_list_time_${t}`),delete B[t];try{let{doc:e,setDoc:t}=await ce(async()=>{let{doc:e,setDoc:t}=await import(`https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js`);return{doc:e,setDoc:t}},[],import.meta.url);await t(e(M,`settings`,`dashboard`),{forceListUpdate:Date.now()},{merge:!0})}catch{}}async function ve(e){let t=e.toLowerCase();if(B[t])return B[t];let n=`tw_list_${t}`,r=`tw_list_time_${t}`,o=localStorage.getItem(n),s=localStorage.getItem(r),c=Date.now(),l=0;try{let e=await a(i(M,`settings`,`dashboard`));e.exists()&&(l=e.data().forceListUpdate||0)}catch{}let u=!s||c-parseInt(s)>864e5;if(o&&!u&&!(parseInt(s||0)<l))try{return B[t]=JSON.parse(o),B[t]}catch{}let d=[`:: MATERIALE ACCESSORIO ::`,`PTE / MU`,`ROE / ROEL`,`CAVO DROP (MT)`,`MINIPRESA / BORCHIA`,`MODEM / ONT`,`:: ALTRO ::`,`RIFLETTORE`,`SISTEMAZIONE LOCALI`],f=null;try{let t=`https://raw.githubusercontent.com/gmaclol/Technicalwork-Materiali/master/lists/${e}.txt`,i=await fetch(t);if(i.status===404&&(t=`https://raw.githubusercontent.com/gmaclol/Technicalwork-Materiali/master/lists/lista.txt`,i=await fetch(t)),i.status===200){let e=(await i.text()).split(/\r?\n/).map(e=>e.trim()).filter(e=>e!==``);e.length>0&&(f=e,localStorage.setItem(n,JSON.stringify(e)),localStorage.setItem(r,c.toString()))}else console.warn(`GitHub risponde con errore`,i.status,`su`,e)}catch(e){console.error(`Errore di rete o CORS nel fetch della raw list:`,e)}if(!f&&o)try{f=JSON.parse(o),console.log(`Rete o GitHub bloccati, ripiego sulla cache locale di 24h.`)}catch{}return B[t]=f||d,B[t]}var V={};async function ye(e,t,n,r){e.preventDefault();let i=document.getElementById(`loc-`+t);if(!i||i.dataset.loaded){window.open(i.href,`_blank`);return}i.textContent=`⊙ caricamento...`;let a=`${n}_${r}`;try{let e=``;if(V[a])e=V[a];else{let t=await(await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${n}&lon=${r}&format=json`)).json(),i=t.address;e=i.road?`${i.road}${i.house_number?` `+i.house_number:``}, ${i.city||i.town||i.village||``}`:t.display_name.split(`,`).slice(0,2).join(`,`),V[a]=e}i.textContent=`⊙ `+e.trim(),i.dataset.loaded=`1`}catch{i.textContent=`⊙ ${Number(n).toFixed(4)}, ${Number(r).toFixed(4)}`,i.dataset.loaded=`1`}}function be(e){let t=e&&e.closest?e.closest(`.table-scroll`):null;if(!t){e.scrollIntoView({inline:`center`,behavior:`smooth`,block:`nearest`});return}let n=e.getBoundingClientRect(),r=t.getBoundingClientRect(),i=t.scrollLeft+(n.left-r.left+n.width/2)-r.width/2;t.scrollTo({left:Math.max(0,i),behavior:`smooth`})}function xe(e,t){let n=e&&e.closest?e.closest(`th`):null;if(!n)return;let r=n.parentElement;if(!r||!r.children)return;let i=Array.from(r.children).filter(e=>e.tagName===`TH`),a=i[i.indexOf(n)+t];a&&be(a)}function Se(e){let t=e.trim().toLowerCase(),n=document.querySelectorAll(`tbody tr`),r=null,i=!1;n.forEach(e=>{if(e.classList.contains(`separator-row`))r&&(r.style.display=i?``:`none`),r=e,i=!1;else{let n=e.dataset.material||``,r=t===``||n.includes(t);e.style.display=r?``:`none`,r&&(i=!0)}}),r&&(r.style.display=i?``:`none`)}var H=null,U=[],W=new Map;function Ce(e){let t=0;e.forEach(e=>{e.materiali&&Object.values(e.materiali).forEach(e=>{let n=parseInt(e);!isNaN(n)&&n>0&&(t+=n)})});let n=null,r=`—`;e.forEach(e=>{let t=E(e.ultimo_aggiornamento);t&&(!n||t>n)&&(n=t,r=e.ultimo_aggiornamento)});let i=document.getElementById(`kpi-total`),a=document.getElementById(`kpi-tecnici`),o=document.getElementById(`kpi-sync`);i&&(i.textContent=t.toLocaleString(`it-IT`)),a&&(a.textContent=e.length),o&&(o.textContent=D(r))}var G=null;async function K(e,n=`live`){N=null;let r=document.getElementById(`content`);r.innerHTML=`
    <div class="state-box">
      <div class="loader-spinner"></div>
      <p>Recupero dati ${e}…</p>
    </div>`,G&&=(G(),null),H=null;try{if(n===`live`)G=c(t(M,e),async t=>{let i=[];t.forEach(e=>i.push({id:e.id,...e.data()}));let a=await P(),o=i.filter(e=>!/_\d{4}-\d{2}-\d{2}$/.test(e.id)).filter(e=>!a.includes(e.tecnico||e.id)).filter(e=>T(e.ultimo_aggiornamento)).filter(e=>{let t=e.materiali;return t?Object.values(t).some(e=>e!==``&&e!==`0`&&e!==0):!1}),s=document.getElementById(`cnt-`+e);s&&(s.textContent=o.length,o.length>0?s.style.color=`var(--accent)`:s.style.color=``);let c=await ve(e);if(o.length===0){if(c.length===0){r.innerHTML=`
              <div class="state-box fade-in">
                <h2>Nessun dato</h2>
                <p>Nessun tecnico ha ancora sincronizzato per <strong>${e}</strong>.</p>
              </div>`;return}H=null,q(e,[],r,n,i,c,new Map);return}q(e,o,r,n,i,c,await ue(e,o))},e=>{console.error(e),r.innerHTML=`<div class="state-box fade-in"><p>Errore connessione Live.</p></div>`});else{let i=await o(t(M,e)),a=[];i.forEach(e=>a.push({id:e.id,...e.data()}));let s=a.filter(e=>e.id.endsWith(`_`+n)),c=await P(),l=s.map(e=>({...e,id:e.id.replace(`_`+n,``),tecnico:e.tecnico||e.id.replace(`_`+n,``)})).filter(e=>!c.includes(e.tecnico||e.id)),u=await ve(e);if(l.length===0){q(e,[],r,n,a,u,new Map);return}q(e,l,r,n,a,u,new Map)}}catch(e){r.innerHTML=`
      <div class="state-box fade-in">
        <h2 style="color:var(--red)">Errore</h2>
        <p>Impossibile caricare i dati. Controlla la connessione.</p>
      </div>`,console.error(e)}}function q(e,t,n,r=`live`,i=[],a=[],o=new Map){let s=a&&a.length>0?a:t.find(e=>e.ordine&&e.ordine.length>0)?.ordine||[],c=new Set(s),l=[],u=new Set,d=new Map;t.forEach(e=>{e.materiali&&Object.keys(e.materiali).forEach(t=>{let n=e.materiali[t];(n===`0`||n===0?``:String(n))!==``&&(c.has(t)||(u.has(t)||(u.add(t),l.push(t)),d.has(t)||d.set(t,new Set),d.get(t).add(e.tecnico||e.id)))})});let f=[...l,...s];f=f.filter(e=>!/^::.*::$/.test(e.trim())&&!/^;;.*;;$/.test(e.trim()));let m=new Set(l);if(t.length===0&&a&&a.length>0&&(f=a),f.length===0){n.innerHTML=`
      <div class="state-box fade-in">
        <h2>Nessun materiale</h2>
        <p>I dati non contengono materiali.</p>
      </div>`;return}let h=`${e}:${r}`,g=t.map(e=>e.tecnico||e.id);if(H===h&&g.length===U.length&&g.every((e,t)=>e===U[t])&&n.querySelector(`table`)&&window._lastMaterials&&window._lastMaterials.length===f.length){t.forEach((e,t)=>{let r=e.tecnico||e.id;f.forEach(i=>{if(/^::.*::$/.test(i.trim())||/^;;.*;;$/.test(i.trim()))return;let a=e.materiali&&e.materiali[i]||``,o=a===`0`||a===0?``:String(a),s=`${r}:${i}`;if(W.get(s)!==o){let e=n.querySelector(`tr[data-material="${CSS.escape(i.toLowerCase())}"]`);if(e){let n=e.children[t+1];if(n){let e=o===``?`empty`:`has-value`,t=o===``?`·`:o;n.className=`td-value ${e}`,n.textContent=t}}W.set(s,o)}});let i=e.ultimo_aggiornamento||`—`,a=n.querySelectorAll(`.tech-time`)[t];a&&(a.textContent=D(i),a.title=i);let o=n.querySelectorAll(`.tech-name`)[t];if(o){let e=o.querySelector(`.status-circle`);e&&(e.className=ee(i))}});let e=n.querySelector(`.content-subtitle`);if(e){let n=r!==`live`;e.innerHTML=`${t.length} tecnici · ${f.length} materiali${n?` · <span style="color:var(--yellow)">snapshot</span>`:``}`}p&&p.role===`admin`&&Ce(t),window._lastTecnici=t,window._lastMaterials=f;return}let _=document.getElementById(`material-search`)?.value||``,v=new Date().getFullYear()+`-`+String(new Date().getMonth()+1).padStart(2,`0`)+`-`+String(new Date().getDate()).padStart(2,`0`),y=i.map(e=>e.id),b=[...new Set(y.map(e=>{let t=e.match(/_(\d{4}-\d{2}-\d{2})$/);return t?t[1]:null}).filter(e=>!!e&&e!==v))].sort().reverse().slice(0,7),x=[{value:`live`,label:`📡 Oggi (live)`}];b.forEach(e=>{x.push({value:e,label:te(e)})});let S=x.find(e=>e.value===r)||x[0],C=x.map(e=>`
    <button type="button" class="snapshot-option ${e.value===r?`active`:``}"
      role="option" aria-selected="${e.value===r?`true`:`false`}"
      data-value="${e.value}" onclick="pickSnapshotDate('${e.value}')"
    >${w(e.label)}</button>
  `).join(``),T=r!==`live`,O=p&&p.role===`admin`,k=`
    <div class="content-header fade-in">
      <div>
        <div class="content-title">${e}</div>
        <div class="content-subtitle">${t.length} tecnici · ${f.length} materiali${T?` · <span style="color:var(--yellow)">snapshot</span>`:``}</div>
      </div>
      <div class="content-actions">
        <div class="snapshot-dropdown" id="snapshot-dropdown">
          <button type="button" class="snapshot-trigger" onclick="toggleSnapshotDropdown(event)"
            aria-haspopup="listbox" aria-expanded="false">
            <span class="snapshot-label">${w(S.label)}</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
          </button>
          <div class="snapshot-menu" role="listbox" aria-label="Seleziona snapshot">
            ${C}
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
    </div>`;if(O&&t.length>0){let e=0;t.forEach(t=>{t.materiali&&Object.values(t.materiali).forEach(t=>{let n=parseInt(t);!isNaN(n)&&n>0&&(e+=n)})});let n=null,r=`—`;t.forEach(e=>{let t=E(e.ultimo_aggiornamento);t&&(!n||t>n)&&(n=t,r=e.ultimo_aggiornamento)}),k+=`
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
        <div class="kpi-value" id="kpi-sync">${D(r)}</div>
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
            <th><div class="th-inner th-material">Materiale</div></th>`,t.forEach(e=>{let t=e.tecnico||e.id,n=e.ultimo_aggiornamento||`—`,r=e.lat&&e.lng,i=`<span class="${ee(n)}"></span>`,a=D(n),s=``;O&&r&&(s=`<a class="tech-location" href="${`https://www.google.com/maps?q=${e.lat},${e.lng}`}" target="_blank" id="loc-${e.id}" onclick="loadGeo(event,'${e.id}',${e.lat},${e.lng})">⊙ mostra posizione</a>`);let c=``,l=o.get(e.id);if(l){let[e,t,n]=l.split(`-`);c=`<span class="stale-badge" title="Lista materiali invariata dal ${n}/${t}/${e}">⚠ Invariata dal ${n}/${t}</span>`}k+=`
            <th onclick="if(window.innerWidth <= 900) scrollCellIntoViewCenter(this)" style="cursor: pointer;">
              <div class="th-inner th-tech">
                <span class="tech-name">
                  <button type="button" class="tech-nav-left" aria-label="Sposta a sinistra" onclick="event.stopPropagation(); scrollTechHeaderNeighbor(this, -1)">◀</button>
                  ${i}${t}
                </span>
                <span class="tech-time" title="${n}">${a}</span>
                ${c}
                ${s}
              </div>
            </th>`}),k+=`
          </tr>
        </thead>
        <tbody>`,f.forEach(e=>{let n=/^::.*::$/.test(e.trim())||/^;;.*;;$/.test(e.trim());if(n){let n=e.replace(/^[:;]+|[:;]+$/g,``).trim();k+=`
          <tr class="separator-row" data-sep="${w(n)}">
            <td colspan="${t.length+1}">${n}</td>
          </tr>`;return}let r=m.has(e)&&!n,i=r?` class="extra-row"`:``,a=``;r&&d.has(e)&&(a=` title="Inserito da: ${w(Array.from(d.get(e)).join(`, `))}"`),k+=`<tr data-material="${w(e.toLowerCase())}"${i}><td class="td-material"${a}>${e}</td>`,t.forEach(t=>{let n=t.materiali&&t.materiali[e]||``,r=n===`0`||n===0?``:n;k+=`<td class="td-value ${r===``?`empty`:`has-value`}">${r===``?`·`:r}</td>`}),k+=`</tr>`}),k+=`</tbody></table>`),k+=`</div>`,n.innerHTML=k,window._lastTecnici=t,window._lastMaterials=f,H=h,U=[...g],W=new Map,t.forEach(e=>{let t=e.tecnico||e.id;f.forEach(n=>{if(/^::.*::$/.test(n.trim())||/^;;.*;;$/.test(n.trim()))return;let r=e.materiali&&e.materiali[n]||``,i=r===`0`||r===0?``:String(r);W.set(`${t}:${n}`,i)})}),_){let e=document.getElementById(`material-search`);e&&(e.value=_,Se(_))}}async function we(e){let t=await crypto.subtle.digest(`SHA-256`,new TextEncoder().encode(e));return Array.from(new Uint8Array(t)).map(e=>e.toString(16).padStart(2,`0`)).join(``)}async function Te(){let e=document.getElementById(`inp-user`).value.trim(),t=document.getElementById(`inp-pass`).value,n=document.getElementById(`login-error`),r=await we(t);f[e]&&f[e].hash===r?(g({name:e,role:f[e].role}),localStorage.setItem(`tw_session`,JSON.stringify({name:e,role:f[e].role})),Ee()):(n.style.display=`block`,setTimeout(()=>n.style.display=`none`,3e3))}function Ee(){document.getElementById(`login-screen`).style.display=`none`;let e=document.getElementById(`app`);e.style.display=`flex`,document.getElementById(`tb-user`).textContent=p.name+` — Esci`;let t=document.getElementById(`nav-tecnici-wrapper`),n=document.getElementById(`btn-update-lists-sidebar`);p.role===`admin`?(t.style.display=`block`,n&&(n.style.display=`flex`)):(t.style.display=`none`,n&&(n.style.display=`none`)),L(),!window.location.hash||window.location.hash===`#/`?window.location.hash=`#/appalti/${d[0]}/live`:window.dispatchEvent(new HashChangeEvent(`hashchange`))}function De(){j({title:`Disconnessione`,msg:`Sei sicuro di voler uscire dalla dashboard?`,icon:`👋`,okLabel:`Esci`,okAccent:!0}).then(e=>{e&&(g(null),localStorage.removeItem(`tw_session`),document.getElementById(`login-screen`).style.display=`flex`,document.getElementById(`app`).style.display=`none`,document.getElementById(`inp-pass`).value=``)})}function Oe(){try{let e=localStorage.getItem(`tw_session`);if(e){let t=JSON.parse(e);t&&f[t.name]&&t.role===f[t.name].role&&(g(t),window.addEventListener(`load`,Ee))}}catch{localStorage.removeItem(`tw_session`)}}var ke={samsung:`samsung_global_en`,xiaomi:`xiaomi`,redmi:`xiaomi`,poco:`xiaomi`,huawei:`huawei_global_en`,honor:`honor_global_en`,oneplus:`oneplus_en`,oppo:`oppo_global_en`,realme:`realme_global_en`,vivo:`vivo_global_en`,motorola:`motorola_global_en`,nokia:`nokia_global_en`,sony:`sony_global_en`,apple:`apple_all_en`,iphone:`apple_all_en`,google:`google_en`,asus:`asus_global_en`,lg:`lg_global_en`},Ae=`https://raw.githubusercontent.com/KHwang9883/MobileModels/master/brands/`,J={};async function je(e){if(J[e])return J[e];try{let t=await fetch(Ae+ke[e]+`.md`);if(!t.ok)return J[e]=new Map,J[e];let n=await t.text(),r=new Map,i=n.split(/[·\n]/);for(let e of i){let t=e.split(/[：:]/);if(t.length<2)continue;let n=t[0],i=t.slice(1).join(`:`).trim().replace(/\s+(Global|China|Japan.*|US.*|Canada|South Korea|India.*)$/i,``).trim(),a=/`([^`]+)`/g,o,s=!1;for(;(o=a.exec(n))!==null;)s=!0,r.set(o[1].trim().toUpperCase(),i);if(!s){let e=n.match(/([A-Za-z0-9\-_]+)\s*$/);e&&r.set(e[1].trim().toUpperCase(),i)}}return J[e]=r,r}catch{return J[e]=new Map,J[e]}}async function Me(e){if(!e||e===`—`)return e;let t=e.trim().split(/\s+/),n=t[0].toLowerCase(),r=t.slice(1).join(` `).toUpperCase(),i=Object.keys(ke).find(e=>n.includes(e));if(!i)return e;let a=(await je(i)).get(r);return a?`${t[0]} ${a}`:e}function Y(){let e=de();for(let t in e)e[t]&&e[t](),delete e[t]}async function X(){document.querySelectorAll(`.sidebar-item`).forEach(e=>e.classList.remove(`active`));let e=document.getElementById(`nav-Tecnici`);e&&e.classList.add(`active`);let n=document.getElementById(`content`);if(p.role!==`admin`){n.innerHTML=`<div class="state-box fade-in"><h2>Accesso Negato</h2><p>Non hai i permessi per visualizzare questa pagina.</p></div>`;return}n.innerHTML=`<div class="state-box"><div class="loader-spinner"></div><p>Caricamento tecnici…</p></div>`;try{let e=new Map;for(let n of d)(await o(t(M,n))).docs.filter(e=>!/_\d{4}-\d{2}-\d{2}$/.test(e.id)).forEach(t=>{let r=t.data(),i=r.tecnico||t.id;e.has(i)||e.set(i,{docIds:{},dispositivo:r.dispositivo||`—`,versione:r.versione_app||``,appalti:[],ultimo:r.ultimo_aggiornamento||`—`}),e.get(i).appalti.push(n),e.get(i).docIds[n]=t.id});if(e.size===0){n.innerHTML=`<div class="state-box fade-in"><p>Nessun tecnico trovato.</p></div>`;return}let r=``,i=await P();for(let[t,n]of e){let e=!i.includes(t),a=await Me(n.dispositivo),o=n.versione?` · <span style="color:var(--accent)">${n.versione}</span>`:``,s=t.replace(/'/g,`\\'`),c=JSON.stringify(n.docIds).replace(/'/g,`&#39;`).replace(/"/g,`&quot;`);r+=`<div class="toggle-wrap">
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
      <div class="tecnici-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
        <div class="content-title">Tecnici</div>
        <div class="tecnici-note" style="width:100%;">⚠ I tecnici disattivati vengono nascosti dalla tabella e dai conteggi. Il loro sync continua normalmente.</div>
      </div>${r}</div>`}catch(e){n.innerHTML=`<div class="state-box fade-in"><p>Errore caricamento tecnici.</p></div>`,console.error(e)}}async function Ne(e,r){if(await j({title:`Eliminare "${e}"?`,msg:`Verranno cancellati TUTTI i dati di questo tecnico (inclusi gli snapshot) da tutti gli appalti. Questa azione è irreversibile.`,icon:`🗑️`,okLabel:`Elimina definitivamente`}))try{let a=JSON.parse(r.replace(/&#39;/g,`'`).replace(/&quot;/g,`"`));for(let[e,r]of Object.entries(a)){await n(i(M,e,r));let a=(await o(t(M,e))).docs.filter(e=>e.id.startsWith(r+`_`)&&/_\d{4}-\d{2}-\d{2}$/.test(e.id));for(let t of a)await n(i(M,e,t.id))}let s=await P();s=s.filter(t=>t!==e),await F(s),Y(),L(),O(`Tecnico "${e}" eliminato.`,`success`),X()}catch(e){O(`Errore durante l'eliminazione: `+e.message,`error`,5e3),console.error(e)}}async function Pe(e,n){let r=await ne({title:`Rinomina tecnico`,defaultValue:e,icon:`✏️`});if(!r||r===e)return;let a=r;try{let r=JSON.parse(n.replace(/&#39;/g,`'`).replace(/&quot;/g,`"`));if(Object.keys(r).length>0){let e=Object.values(r)[0];try{await l(i(M,`settings`,`devices_names`),{[e]:{name:a,updatedAt:Date.now()}},{merge:!0})}catch{}}for(let[e,n]of Object.entries(r)){await u(i(M,e,n),{tecnico:a});let r=(await o(t(M,e))).docs.filter(e=>e.id.startsWith(n+`_`)&&/_\d{4}-\d{2}-\d{2}$/.test(e.id));for(let t of r)await u(i(M,e,t.id),{tecnico:a})}let s=await P();s.includes(e)&&(s=s.map(t=>t===e?a:t),await F(s)),Y(),L(),X()}catch(e){O(`Errore durante la rinomina: `+e.message,`error`,5e3),console.error(e)}}async function Fe(e,t){let n=await P();t?n=n.filter(t=>t!==e):n.includes(e)||n.push(e),await F(n),Y(),L(),X()}function Z(e){if(!e)return 0;try{let t=String(e).trim().split(/\s+/);if(t.length<2)return 0;let n,r;t[0].includes(`:`)?(n=t[0],r=t[1]):(r=t[0],n=t[1]);let[i,a,o]=n.split(`:`),[s,c,l]=r.split(`/`),u=new Date(l,c-1,s,i,a,o||0).getTime();return isNaN(u)?0:u}catch{return 0}}async function Q(){document.querySelectorAll(`.sidebar-item`).forEach(e=>e.classList.remove(`active`));let e=document.getElementById(`nav-pfs`);e&&e.classList.add(`active`);let n=document.getElementById(`content`);if(p.role!==`admin`){n.innerHTML=`<div class="state-box fade-in"><h2>Accesso Negato</h2><p>Non hai i permessi per visualizzare questa pagina.</p></div>`;return}n.innerHTML=`<div class="state-box"><div class="loader-spinner"></div><p>Caricamento dati PFS…</p></div>`;try{let e=await o(t(M,`pfs_segnalati`)),r=await o(t(M,`pfs_logs`)),i=e.docs.map(e=>({id:e.id,...e.data()})).sort((e,t)=>Z(t.orario)-Z(e.orario)),a=r.docs.map(e=>({id:e.id,...e.data()})).sort((e,t)=>Z(t.orario)-Z(e.orario)),s=`<div class="tecnici-panel fade-in">
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
      <h3 class="pfs-section-title pfs-section-red">
        <span class="pfs-section-dot" style="background:var(--red)"></span>
        Nuovi Indirizzi
        <span class="pfs-badge">${i.length}</span>
        ${i.length>0?`<label class="pfs-check-wrapper" style="margin-left:8px" title="Seleziona tutti">
          <input type="checkbox" onclick="toggleAllPfs('sig', this.checked)">
          <span class="pfs-check-custom"></span>
        </label>`:``}
      </h3>`,i.length===0?s+=`<div class="pfs-empty">Nessuna segnalazione.</div>`:i.forEach(e=>{let t=e.lat&&e.lng?`https://www.google.com/maps?q=${e.lat},${e.lng}`:null;s+=`<div class="pfs-card" data-id="${w(e.id)}" data-coll="pfs_segnalati">
          <div class="pfs-card-check">
            <label class="pfs-check-wrapper">
              <input type="checkbox" class="sig-check" onclick="updatePfsToolbar()">
              <span class="pfs-check-custom"></span>
            </label>
          </div>
          <div class="pfs-card-body">
            <div class="pfs-card-title">${w(e.nome_pfs)}</div>
            <div class="pfs-card-sub">${w(e.nuovo_indirizzo)}</div>
            <div class="pfs-card-meta">
              <span class="pfs-meta-item">👷 ${w(e.tecnico)}</span>
              <span class="pfs-meta-item pfs-meta-time">🕐 ${w(e.orario)}</span>
            </div>
          </div>
          <div class="pfs-card-actions">
            ${t?`<a href="${t}" target="_blank" rel="noopener noreferrer" class="pfs-action-btn pfs-action-map" title="Mappa">📍</a>`:``}
            <button class="pfs-action-btn pfs-action-del" onclick="deletePfsItem('${w(e.id)}', 'pfs_segnalati')" title="Elimina">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
            </button>
          </div>
        </div>`}),s+=`</div>`,s+=`<div>
      <h3 class="pfs-section-title pfs-section-accent">
        <span class="pfs-section-dot" style="background:var(--accent)"></span>
        Log Accessi (Accuracy)
        <span class="pfs-badge">${a.length}</span>
        ${a.length>0?`<label class="pfs-check-wrapper" style="margin-left:8px" title="Seleziona tutti">
          <input type="checkbox" onclick="toggleAllPfs('log', this.checked)">
          <span class="pfs-check-custom"></span>
        </label>`:``}
      </h3>`,a.length===0?s+=`<div class="pfs-empty">Nessun log.</div>`:a.slice(0,100).forEach(e=>{let t=`https://www.google.com/maps?q=${e.lat},${e.lng}`;s+=`<div class="pfs-card" data-id="${w(e.id)}" data-coll="pfs_logs">
          <div class="pfs-card-check">
            <label class="pfs-check-wrapper">
              <input type="checkbox" class="log-check" onclick="updatePfsToolbar()">
              <span class="pfs-check-custom"></span>
            </label>
          </div>
          <div class="pfs-card-body">
            <div class="pfs-card-title">${w(e.nome_pfs)}</div>
            <div class="pfs-card-sub">${w(e.indirizzo_pfs||``)}</div>
            <div class="pfs-card-meta">
              <span class="pfs-meta-item">👷 ${w(e.tecnico)}</span>
              <span class="pfs-meta-item pfs-meta-time">🕐 ${w(e.orario)}</span>
              <span class="pfs-meta-item pfs-meta-coords">📌 ${e.lat.toFixed(5)}, ${e.lng.toFixed(5)}</span>
            </div>
          </div>
          <div class="pfs-card-actions">
            <a href="${t}" target="_blank" rel="noopener noreferrer" class="pfs-action-btn pfs-action-map" title="Controlla">📍</a>
            <button class="pfs-action-btn pfs-action-del" onclick="deletePfsItem('${w(e.id)}', 'pfs_logs')" title="Elimina">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
            </button>
          </div>
        </div>`}),s+=`</div></div>`,n.innerHTML=s}catch(e){n.innerHTML=`<div class="state-box fade-in"><p>Errore caricamento dati PFS.</p></div>`,console.error(e)}}function Ie(e,t){document.querySelectorAll(`.`+e+`-check`).forEach(e=>e.checked=t),Le()}function Le(){let e=document.querySelectorAll(`.sig-check:checked, .log-check:checked`),t=document.getElementById(`pfs-delete-toolbar`),n=document.getElementById(`pfs-delete-count`);e.length>0?(t.style.display=`flex`,n.textContent=`${e.length} elementi selezionati`):t.style.display=`none`}async function Re(e,t){if(await j({title:`Eliminare elemento?`,msg:`L'operazione è irreversibile.`,icon:`🗑️`,okLabel:`Elimina`}))try{await n(i(M,t,e)),O(`Elemento eliminato.`,`success`),Q()}catch(e){O(`Errore: `+e.message,`error`,5e3)}}async function ze(){let e=document.querySelectorAll(`.sig-check:checked, .log-check:checked`),t=e.length;if(!await j({title:`Eliminare ${t} element${t===1?`o`:`i`}?`,msg:`L'operazione è irreversibile e coinvolge tutti gli elementi selezionati.`,icon:`🗑️`,okLabel:`Elimina ${t} element${t===1?`o`:`i`}`}))return;let r=document.querySelector(`.btn-bulk-delete`);r&&(r.innerHTML=`<span class="btn-spinner" style="border-color:rgba(255,255,255,0.3);border-top-color:white"></span> Eliminazione…`,r.disabled=!0);try{let r=[];e.forEach(e=>{let t=e.closest(`.pfs-card`),a=t.dataset.id,o=t.dataset.coll;r.push(n(i(M,o,a)))}),await Promise.all(r),O(`${t} element${t===1?`o eliminato`:`i eliminati`}.`,`success`),Q()}catch(e){O(`Errore durante la cancellazione multipla: `+e.message,`error`,5e3),r&&(r.textContent=`Elimina Selezionati`,r.disabled=!1)}}async function $(){document.querySelectorAll(`.sidebar-item`).forEach(e=>e.classList.remove(`active`));let e=document.getElementById(`nav-aree`);e&&e.classList.add(`active`);let t=document.getElementById(`content`);if(p.role!==`admin`){t.innerHTML=`<div class="state-box fade-in"><h2>Accesso Negato</h2><p>Non hai i permessi per visualizzare questa pagina.</p></div>`;return}t.innerHTML=`<div class="state-box"><div class="loader-spinner"></div><p>Caricamento aree preferite…</p></div>`;try{let e=await a(i(M,`settings`,`devices_names`));if(!e.exists()){t.innerHTML=`<div class="state-box fade-in"><p>Nessun dato trovato.</p></div>`;return}let n=e.data(),r=``,o=Object.keys(n).map(e=>({id:e,name:n[e].name||e,pfsAreas:n[e].pfsAreas||[]})).sort((e,t)=>e.name.localeCompare(t.name));if(o.length===0){t.innerHTML=`<div class="state-box fade-in"><p>Nessun tecnico configurato.</p></div>`;return}for(let e of o){let t=e.pfsAreas.join(`, `);r+=`
        <div class="toggle-wrap" style="flex-direction:column; align-items:stretch; gap:12px;">
          <div class="toggle-info" style="display:flex; justify-content:space-between; align-items:center;">
            <div>
              <span class="toggle-name">${e.name}</span>
              <span class="toggle-device" style="font-size:0.85rem; margin-left: 8px;">ID: ${e.id}</span>
            </div>
            <div style="display:flex; gap:8px; flex-wrap:wrap;">
              <button class="btn-outline" onclick="savePfsAreas('${e.id}')" style="width: auto; padding: 6px 16px; font-size: 0.85rem; border-color: var(--accent); color: var(--accent);">💾 Salva</button>
              <button class="btn-outline" onclick="deleteDeviceAreas('${e.id}')" style="width: auto; padding: 6px 16px; font-size: 0.85rem; border-color: var(--red); color: var(--red);">🗑️ Elimina</button>
            </div>
          </div>
          <div style="display:flex; flex-direction:column; gap:6px;">
            <label for="areas-${e.id}" style="font-size:0.85rem; color:var(--text-muted); font-weight: 600;">Aree preferite (separate da virgola):</label>
            <input type="text" id="areas-${e.id}" value="${t.replace(/"/g,`&quot;`)}" class="rename-field" placeholder="Es. Grugliasco, Torino, TOH_1">
          </div>
        </div>
      `}t.innerHTML=`
      <div class="tecnici-panel fade-in">
        <div class="tecnici-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
          <div class="content-title">Aree Preferite Tecnici</div>
          <div class="tecnici-note" style="width:100%;">
            Queste sono le aree (comuni, province o PFS) preferite di ogni tecnico (quelle con la stellina attiva).
            Modificando queste aree e salvando, l'app del tecnico si aggiornerà in tempo reale.
          </div>
        </div>
        <div style="display:flex; flex-direction:column; gap:16px;">
          ${r}
        </div>
      </div>
    `}catch(e){console.error(e),t.innerHTML=`<div class="state-box fade-in"><p>Errore caricamento aree preferite.</p></div>`}}async function Be(e){let t=document.getElementById(`areas-${e}`);if(!t)return;let n=t.value.split(`,`).map(e=>e.trim()).filter(e=>e.length>0);try{await u(i(M,`settings`,`devices_names`),{[`${e}.pfsAreas`]:n,[`${e}.updatedAt`]:Date.now()}),O(`Aree preferite aggiornate con successo`,`success`)}catch(e){console.error(e),O(`Errore durante il salvataggio: `+e.message,`error`)}}async function Ve(e){if(await j({title:`Elimina tecnico`,msg:`Vuoi eliminare completamente le preferenze e la scheda di questo tecnico? (Se il tecnico userà di nuovo l'app, verrà ricreato automaticamente).`,icon:`🗑️`,okLabel:`Elimina`,okAccent:!1}))try{await u(i(M,`settings`,`devices_names`),{[e]:r()}),O(`Tecnico eliminato dalle aree preferite`,`success`),$()}catch(e){console.error(e),O(`Errore: `+e.message,`error`)}}function He(e){document.documentElement.setAttribute(`data-theme`,e);let t=document.getElementById(`btn-theme`);t&&(t.textContent=e===`dark`?`🌙`:`☀️`);let n=document.querySelector(`meta[name="theme-color"]`);n&&(n.content=e===`dark`?`#020617`:`#f1f5f9`),localStorage.setItem(`tw_theme`,e)}function Ue(){He((document.documentElement.getAttribute(`data-theme`)||`dark`)===`dark`?`light`:`dark`)}He(localStorage.getItem(`tw_theme`)||`dark`);function We(){let e=document.getElementById(`offline-banner`);e&&(navigator.onLine?e.classList.remove(`show`):e.classList.add(`show`))}window.addEventListener(`online`,We),window.addEventListener(`offline`,We);async function Ge(){await S();let e=document.getElementById(`sidebar-appalti`);e&&(e.innerHTML=d.map((e,t)=>`
      <a href="#/appalti/${e}/live" class="sidebar-item" id="nav-${e}" role="button" tabindex="0" onclick="closeDrawer()">
        <div class="sidebar-item-left">
          <div class="dot-indicator"></div>
          ${e}
        </div>
        <span class="sidebar-count" id="cnt-${e}">—</span>
      </a>
    `).join(``)),L(),Ke()}document.addEventListener(`DOMContentLoaded`,()=>Ge());function Ke(){let e=document.getElementById(`login-screen`);if(e&&e.style.display!==`none`)return;let t=window.location.hash.slice(1);if(!t||t===`/`){window.location.hash=`#/appalti/${d[0]}/live`;return}let n=t.split(`/`).filter(Boolean),r=n[0];if(r===`admin`){let e=n[1];e===`tecnici`?X():e===`pfs`?Q():e===`aree`&&$()}else if(r===`appalti`){let e=n[1]||d[0],t=n[2]||`live`;document.querySelectorAll(`.sidebar-item`).forEach(e=>e.classList.remove(`active`));let r=document.getElementById(`nav-`+e);r&&r.classList.add(`active`),_(e),v(t),document.getElementById(`tb-appalto`).textContent=e,K(e,t)}}window.addEventListener(`hashchange`,Ke),document.addEventListener(`keydown`,e=>{if(e.key!==`Enter`)return;let t=document.getElementById(`login-screen`).style.display!==`none`,n=document.getElementById(`confirm-overlay`).classList.contains(`show`)||document.getElementById(`rename-overlay`).classList.contains(`show`);t&&!n&&Te()}),document.addEventListener(`keydown`,e=>{let t=document.querySelector(`.snapshot-dropdown.open`);if(!t)return;let n=Array.from(t.querySelectorAll(`.snapshot-option`));if(!n.length)return;let r=n.findIndex(e=>e===document.activeElement);if(e.key===`ArrowDown`)e.preventDefault(),n[(r+1+n.length)%n.length].focus();else if(e.key===`ArrowUp`)e.preventDefault(),n[(r-1+n.length)%n.length].focus();else if(e.key===`Enter`&&r>=0){e.preventDefault();let t=n[r].getAttribute(`data-value`);t&&me(t)}else e.key===`Escape`&&R()}),document.addEventListener(`click`,R),document.addEventListener(`keydown`,e=>{e.key===`Escape`&&R()}),Oe(),window.doLogin=Te,window.doLogout=De,window.toggleTheme=Ue,window.toggleDrawer=ge,window.closeDrawer=z,window.selectAppalto=he,window.loadAppalto=K,window.refreshData=()=>K(m,h),window.onDateChange=fe,window.toggleSnapshotDropdown=pe,window.pickSnapshotDate=me,window.closeSnapshotDropdown=R,window.filterMaterials=Se,window.scrollCellIntoViewCenter=be,window.scrollTechHeaderNeighbor=xe,window.loadGeo=ye,window.exportToExcel=re,window.printTable=ie,window.showTecnici=X,window.deleteTecnico=Ne,window.renameTecnico=Pe,window.toggleTecnico=Fe,window.showPfsDashboard=Q,window.showAreeDashboard=$,window.savePfsAreas=Be,window.deleteDeviceAreas=Ve,window.toggleAllPfs=Ie,window.updatePfsToolbar=Le,window.deletePfsItem=Re,window.deleteSelectedPfs=ze,window.showToast=O,window.forceUpdateLists=async()=>{if(await j({title:`Forza Aggiornamento`,msg:`Vuoi forzare l'aggiornamento delle liste di tutti gli appalti da GitHub? L'operazione ripulirà la cache locale.`,icon:`🔄`,okLabel:`Forza Aggiornamento`,okAccent:!0})){let e=document.getElementById(`btn-update-lists-sidebar`);e&&(e.innerHTML=`<div class="loader-spinner" style="width:14px;height:14px;border-width:2px;display:inline-block;vertical-align:middle;margin-right:6px"></div> Attendere...`),C(),await _e(),window.location.reload()}};