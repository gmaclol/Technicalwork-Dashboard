// ── Excel Export & Print ──
import { escapeHtml, showToast, parseQuantity, formatQuantityTotal, formatDateLabel, isToday, techStatus, relativeTime, dateOnlyRelativeTime } from './utils.js';
import { currentDate, currentUser } from './state.js';

export async function exportToExcel(appalto, tecnici, allMaterials) {
  const exportBtn = document.querySelector('.btn-export');
  const originalHTML = exportBtn ? exportBtn.innerHTML : null;
  if (exportBtn) {
    exportBtn.disabled = true;
    exportBtn.innerHTML = `<span class="btn-spinner"></span> Generazione…`;
  }
  try {
    if (typeof ExcelJS === 'undefined') {
      await new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.3.0/exceljs.min.js';
        s.onload = resolve;
        s.onerror = () => reject(new Error('Impossibile caricare ExcelJS. Controlla la connessione.'));
        document.head.appendChild(s);
      });
    }
    const today = new Date().toLocaleDateString('it-IT');
    const materialsOnly = allMaterials.filter(m =>
      !/^::.*::$/.test(m.trim()) && !/^;;.*;;$/.test(m.trim())
    );

    const wb = new ExcelJS.Workbook();
    wb.creator = 'TechnicalWork';
    const ws = wb.addWorksheet(appalto);

    const totalCols = tecnici.length + 2;
    const FONT = 'Segoe UI';
    const COL_DARK    = 'FF1A2B3C';
    const COL_MID     = 'FF2C3E50';
    const COL_WHITE   = 'FFFFFFFF';
    const COL_GRAY    = 'FFADB5BD';
    const COL_BLACK   = 'FF212529';
    const COL_ZEBRA   = 'FFF8F9FA';
    const COL_ACCENT  = 'FF0D6EFD';
    const COL_TOTAL_BG= 'FFE7F1FF';

    const borderAll = {
      top:    { style: 'thin', color: { argb: 'FFDEE2E6' } },
      bottom: { style: 'thin', color: { argb: 'FFDEE2E6' } },
      left:   { style: 'thin', color: { argb: 'FFDEE2E6' } },
      right:  { style: 'thin', color: { argb: 'FFDEE2E6' } },
    };
    const borderH = {
      top:    { style: 'thin', color: { argb: 'FFDEE2E6' } },
      bottom: { style: 'thin', color: { argb: 'FFDEE2E6' } },
    };

    ws.getColumn(1).width = 40;
    for (let i = 2; i <= tecnici.length + 1; i++) ws.getColumn(i).width = 14;
    ws.getColumn(tecnici.length + 2).width = 11;

    const r1 = ws.addRow(['TECHNICALWORK — LISTA MODEM']);
    ws.mergeCells(1, 1, 1, totalCols);
    r1.height = 30;
    const c1 = r1.getCell(1);
    c1.font = { name: FONT, size: 13, bold: true, color: { argb: COL_WHITE } };
    c1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COL_DARK } };
    c1.alignment = { horizontal: 'center', vertical: 'middle' };

    const r2 = ws.addRow([`${appalto.toUpperCase()}   ·   ${today}`]);
    ws.mergeCells(2, 1, 2, totalCols);
    r2.height = 22;
    const c2 = r2.getCell(1);
    c2.font = { name: FONT, size: 10, bold: false, color: { argb: 'FFAABCCC' } };
    c2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COL_DARK } };
    c2.alignment = { horizontal: 'center', vertical: 'middle' };

    const r3 = ws.addRow([]);
    ws.mergeCells(3, 1, 3, totalCols);
    r3.height = 8;
    r3.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COL_WHITE } };

    const headers = ['MATERIALE', ...tecnici.map(t => (t.tecnico || t.id).toUpperCase()), 'TOT'];
    const r4 = ws.addRow(headers);
    r4.height = 22;
    r4.eachCell((cell, colNum) => {
      const isTot = colNum === totalCols;
      cell.font = { name: FONT, size: 9, bold: true, color: { argb: isTot ? COL_ACCENT : COL_WHITE } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isTot ? COL_TOTAL_BG : COL_MID } };
      cell.alignment = { horizontal: colNum === 1 ? 'left' : 'center', vertical: 'middle' };
      cell.border = { bottom: { style: 'medium', color: { argb: isTot ? COL_ACCENT : 'FF4A6278' } } };
    });

    materialsOnly.forEach((mat, idx) => {
      const isZebraB = idx % 2 === 1;
      const bgColor = isZebraB ? COL_ZEBRA : COL_WHITE;
      let matFree = 0;
      let matUsed = 0;
      const rowData = [mat, ...tecnici.map(t => { 
        const v = (t.materiali && t.materiali[mat]) || ''; 
        const q = parseQuantity(v);
        matFree += q.free;
        matUsed += q.used;
        return (v === '0' || v === 0) ? '' : v; 
      }), formatQuantityTotal(matFree, matUsed)];
      const row = ws.addRow(rowData);
      row.height = 20;

      row.eachCell({ includeEmpty: true }, (cell, colNum) => {
        const isTot = colNum === totalCols;
        const val = cell.value ? String(cell.value).trim() : '';
        const isEmpty = val === '' || val === '0';

        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
        cell.alignment = { horizontal: colNum === 1 ? 'left' : 'center', vertical: 'middle' };
        cell.border = borderH;

        if (colNum === 1) {
          cell.font = { name: FONT, size: 9, bold: true, color: { argb: COL_BLACK } };
          cell.border = borderAll;
        } else if (isTot) {
          cell.font = { name: FONT, size: 9, bold: true, color: { argb: COL_ACCENT } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COL_TOTAL_BG } };
          cell.border = borderAll;
        } else {
          cell.font = { name: FONT, size: 9, bold: !isEmpty, color: { argb: isEmpty ? COL_GRAY : COL_BLACK } };
          cell.border = borderAll;
        }
      });
    });

    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${appalto}_${today.replace(/\//g, '-')}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`File "${appalto}_${today.replace(/\//g, '-')}.xlsx" scaricato.`, 'success');
  } catch(e) {
    showToast('Errore durante l\'esportazione: ' + e.message, 'error', 5000);
    console.error(e);
  } finally {
    if (exportBtn && originalHTML) {
      exportBtn.disabled = false;
      exportBtn.innerHTML = originalHTML;
    }
  }
}

export function printTable(appalto, tecnici, allMaterials) {
  const today = new Date().toLocaleDateString('it-IT');
  const materialsOnly = allMaterials.filter(m =>
    !/^::.*::$/.test(m.trim()) && !/^;;.*;;$/.test(m.trim())
  );

  let rows = '';
  materialsOnly.forEach((mat, idx) => {
    let matFree = 0;
    let matUsed = 0;
    const bg = idx % 2 === 1 ? '#F8F9FA' : '#FFFFFF';
    let cells = `<td style="padding:4px 6px;font-weight:600;font-size:10px;border:1px solid #DEE2E6;background:${bg};white-space:nowrap">${escapeHtml(mat)}</td>`;
    tecnici.forEach(t => {
      const raw = (t.materiali && t.materiali[mat]) || '';
      const val = (raw === '0' || raw === 0) ? '' : raw;
      const q = parseQuantity(val);
      matFree += q.free;
      matUsed += q.used;
      const isEmpty = val === '';
      cells += `<td style="padding:4px 6px;text-align:center;font-size:10px;border:1px solid #DEE2E6;background:${bg};color:${isEmpty ? '#ADB5BD' : '#212529'};font-weight:${isEmpty ? 'normal' : '600'};white-space:nowrap">${val || '·'}</td>`;
    });
    const totStr = formatQuantityTotal(matFree, matUsed);
    cells += `<td style="padding:4px 6px;text-align:center;border:1px solid #DEE2E6;background:#E7F1FF;min-width:35px;font-weight:600;color:#0D6EFD;">${totStr}</td>`;
    rows += `<tr>${cells}</tr>`;
  });

  let headers = `<th style="padding:6px 6px;text-align:left;background:#2C3E50;color:white;font-size:10px;border:1px solid #4A6278">MATERIALE</th>`;
  tecnici.forEach(t => {
    headers += `<th style="padding:6px 6px;text-align:center;background:#2C3E50;color:white;font-size:10px;border:1px solid #4A6278;white-space:nowrap">${escapeHtml((t.tecnico || t.id).toUpperCase())}</th>`;
  });
  headers += `<th style="padding:6px 6px;text-align:center;background:#E7F1FF;color:#0D6EFD;font-size:10px;border:1px solid #B6D4FE">TOT</th>`;

  const html = `
    <!DOCTYPE html><html><head><meta charset="UTF-8">
    <title>TechnicalWork — ${appalto}</title>
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
        ${appalto.toUpperCase()}   ·   ${today}
      </div>
      <table style="font-size:9px;width:100%">
        <thead><tr>${headers}</tr></thead>
        <tbody>${rows}</tbody>
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
    </body></html>`;

  const win = window.open('', '_blank', 'width=1100,height=700');
  if (!win) { showToast('Popup bloccato. Consenti i popup per la stampa.', 'error'); return; }
  win.document.write(html);
  win.document.close();
}

export async function exportToImage(appalto, tecnici, allMaterials) {
  const btn = document.querySelector('.btn-image');
  const originalHTML = btn ? btn.innerHTML : null;
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span class="btn-spinner"></span> Creazione…`;
  }

  try {
    // 1. Filtra i materiali puliti (senza divisori)
    const cleanMaterials = allMaterials.filter(m =>
      !/^::.*::$/.test(m.trim()) && !/^;;.*;;$/.test(m.trim())
    );

    const firstColWidth = 250;
    const colWidth = 110;
    const lastColWidth = 120;
    const paddingX = 40;
    const tableWidth = firstColWidth + (tecnici.length * colWidth) + lastColWidth;
    const canvasWidth = tableWidth + (paddingX * 2);

    // Altezza base
    const headerHeight = 110;
    const tableHeaderHeight = 40;
    const rowHeight = 32;
    const tableHeight = tableHeaderHeight + (cleanMaterials.length * rowHeight);
    
    // Altezza totale dinamica basata sul numero di materiali
    const canvasHeight = 175 + tableHeight + 80;

    // 2. Creazione canvas reale
    const canvas = document.createElement('canvas');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext('2d');

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Helper per disegnare rettangoli arrotondati
    function drawRoundedRect(x, y, width, height, radius, fillStyle, strokeStyle, strokeWidth = 1) {
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + width - radius, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      ctx.lineTo(x + width, y + height - radius);
      ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      ctx.lineTo(x + radius, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
      if (fillStyle) {
        ctx.fillStyle = fillStyle;
        ctx.fill();
      }
      if (strokeStyle) {
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = strokeWidth;
        ctx.stroke();
      }
    }

    // Helper per troncare testo troppo lungo nei titoli di colonna
    function truncateText(text, maxWidth, fontCtx) {
      if (fontCtx.measureText(text).width <= maxWidth) return text;
      let t = text;
      while (t.length > 0 && fontCtx.measureText(t + '...').width > maxWidth) {
        t = t.slice(0, -1);
      }
      return t + '...';
    }

    // 3. Sfondo con gradiente scuro Slate + bagliori radiali
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvasHeight);
    bgGrad.addColorStop(0, '#090d16');
    bgGrad.addColorStop(1, '#020617');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Bagliore viola in alto a sinistra
    const glow1 = ctx.createRadialGradient(0, 0, 0, 0, 0, 450);
    glow1.addColorStop(0, 'rgba(99, 102, 241, 0.12)');
    glow1.addColorStop(1, 'rgba(99, 102, 241, 0)');
    ctx.fillStyle = glow1;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Bagliore smeraldo in basso a destra
    const glow2 = ctx.createRadialGradient(canvasWidth, canvasHeight, 0, canvasWidth, canvasHeight, 550);
    glow2.addColorStop(0, 'rgba(16, 185, 129, 0.06)');
    glow2.addColorStop(1, 'rgba(16, 185, 129, 0)');
    ctx.fillStyle = glow2;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // 4. Intestazioni del Report
    ctx.textBaseline = 'top';
    
    ctx.font = "bold 11px monospace";
    ctx.fillStyle = "#6366f1";
    ctx.fillText("TECHNICALWORK // LISTA MODEM", paddingX, 45);

    ctx.font = "bold 38px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(appalto, paddingX, 70);

    const isSnapshot = currentDate !== 'live';
    ctx.font = "600 13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    if (isSnapshot) {
      ctx.fillStyle = "#f59e0b";
      ctx.fillText(`SNAPSHOT: ${formatDateLabel(currentDate).toUpperCase()}`, paddingX, 115);
    } else {
      const todayStr = new Date().toLocaleDateString('it-IT');
      ctx.fillStyle = "#10b981";
      ctx.fillText(`LIVE STATUS · ${todayStr}`, paddingX, 115);
    }

    // Linea divisoria sotto intestazione
    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(paddingX, 145);
    ctx.lineTo(canvasWidth - paddingX, 145);
    ctx.stroke();

    // Y iniziale della tabella
    const tableY = 175;

    // 5. DISEGNO INTESTAZIONI COLONNE TABELLA
    drawRoundedRect(paddingX, tableY, tableWidth, tableHeaderHeight, 8, "rgba(255, 255, 255, 0.04)", "rgba(255, 255, 255, 0.08)", 1);
    
    ctx.font = "bold 11px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.textBaseline = 'middle';
    
    // Colonna "MATERIALE"
    ctx.fillStyle = "#94a3b8";
    ctx.fillText("MATERIALE", paddingX + 16, tableY + (tableHeaderHeight / 2));

    // Nomi tecnici
    tecnici.forEach((t, i) => {
      const name = (t.tecnico || t.id).toUpperCase();
      const colX = paddingX + firstColWidth + (i * colWidth);
      ctx.font = "bold 11px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      
      const truncated = truncateText(name, colWidth - 10, ctx);
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = 'center';
      ctx.fillText(truncated, colX + (colWidth / 2), tableY + (tableHeaderHeight / 2));
      ctx.textAlign = 'left';
    });

    // Colonna "TOTALE"
    const totalColX = paddingX + firstColWidth + (tecnici.length * colWidth);
    ctx.font = "bold 11px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillStyle = "#6366f1";
    ctx.textAlign = 'center';
    ctx.fillText("TOTALE", totalColX + (lastColWidth / 2), tableY + (tableHeaderHeight / 2));
    ctx.textAlign = 'left';

    // 6. DISEGNO RIGHE MATERIALI
    let currentYLine = tableY + tableHeaderHeight;
    cleanMaterials.forEach((mat, idx) => {
      // Zebra striping
      const isZebra = idx % 2 === 1;
      const rowBg = isZebra ? "rgba(255, 255, 255, 0.01)" : "transparent";
      
      ctx.fillStyle = rowBg;
      ctx.fillRect(paddingX, currentYLine, tableWidth, rowHeight);

      // Linea orizzontale separatore
      ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(paddingX, currentYLine + rowHeight);
      ctx.lineTo(canvasWidth - paddingX, currentYLine + rowHeight);
      ctx.stroke();

      // Nome materiale
      ctx.font = "bold 12px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.fillStyle = "#cbd5e1";
      ctx.fillText(mat, paddingX + 16, currentYLine + (rowHeight / 2));

      let matFree = 0;
      let matUsed = 0;

      // Scrittura celle quantità per tecnico
      tecnici.forEach((t, i) => {
        const v = (t.materiali && t.materiali[mat]) || '';
        const q = parseQuantity(v);
        matFree += q.free;
        matUsed += q.used;

        const colX = paddingX + firstColWidth + (i * colWidth);
        const display = (v === '0' || v === 0 || v === '') ? '·' : String(v);

        ctx.font = display === '·' ? "bold 14px monospace" : "bold 13px monospace";
        ctx.fillStyle = display === '·' ? "#475569" : "#ffffff";
        ctx.textAlign = 'center';
        ctx.fillText(display, colX + (colWidth / 2), currentYLine + (rowHeight / 2));
        ctx.textAlign = 'left';
      });

      // Valore Totale Materiale della riga
      const totalDisplay = formatQuantityTotal(matFree, matUsed) || '0';
      const colX = paddingX + firstColWidth + (tecnici.length * colWidth);
      
      // Sfondo colorato della cella Totale
      ctx.fillStyle = "rgba(99, 102, 241, 0.06)";
      ctx.fillRect(colX, currentYLine, lastColWidth, rowHeight);

      ctx.font = "bold 13px monospace";
      ctx.fillStyle = "#38bdf8"; // Cyan brillante per staccare visivamente
      ctx.textAlign = 'center';
      ctx.fillText(totalDisplay, colX + (lastColWidth / 2), currentYLine + (rowHeight / 2));
      ctx.textAlign = 'left';

      currentYLine += rowHeight;
    });

    // 7. DISEGNO BORDI ESTERNI E GRIGLIA VERTICALE
    ctx.strokeStyle = "rgba(255, 255, 255, 0.07)";
    ctx.lineWidth = 1;
    // Sinistro
    ctx.beginPath();
    ctx.moveTo(paddingX, tableY);
    ctx.lineTo(paddingX, currentYLine);
    ctx.stroke();
    // Destro
    ctx.beginPath();
    ctx.moveTo(canvasWidth - paddingX, tableY);
    ctx.lineTo(canvasWidth - paddingX, currentYLine);
    ctx.stroke();
    // Inferiore
    ctx.beginPath();
    ctx.moveTo(paddingX, currentYLine);
    ctx.lineTo(canvasWidth - paddingX, currentYLine);
    ctx.stroke();

    // Linee verticali interne
    ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
    // Linea dopo "MATERIALE"
    ctx.beginPath();
    ctx.moveTo(paddingX + firstColWidth, tableY);
    ctx.lineTo(paddingX + firstColWidth, currentYLine);
    ctx.stroke();

    // Linee tra tecnici
    tecnici.forEach((t, i) => {
      const colX = paddingX + firstColWidth + (i * colWidth);
      ctx.beginPath();
      ctx.moveTo(colX + colWidth, tableY);
      ctx.lineTo(colX + colWidth, currentYLine);
      ctx.stroke();
    });

    // 8. Footer Watermark
    ctx.font = "500 11px monospace";
    ctx.fillStyle = "#475569";
    ctx.textAlign = "center";
    const nowStr = new Date().toLocaleString('it-IT');
    ctx.fillText(`TechnicalWork Dashboard · Lista Modem Generata da ${currentUser?.name || 'Admin'} il ${nowStr}`, canvasWidth / 2, canvasHeight - 25);
    ctx.textAlign = "left"; // Reset

    // 9. Condivisione nativa (PWA/Mobile) o Download alternativo (Desktop)
    const dateFileSuffix = currentDate === 'live'
      ? new Date().toLocaleDateString('it-IT').replace(/\//g, '-')
      : currentDate;
    const filename = `Lista_Modem_${appalto}_${dateFileSuffix}.png`;

    const downloadImage = () => {
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast('Immagine generata e scaricata!', 'success');
    };

    if (navigator.canShare && typeof File !== 'undefined') {
      canvas.toBlob(async (blob) => {
        if (!blob) {
          downloadImage();
          return;
        }
        const file = new File([blob], filename, { type: 'image/png' });
        if (navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: `Lista Modem - ${appalto}`,
              text: `Lista dei modem sincronizzata per ${appalto}.`
            });
            showToast('Condivisione avviata!', 'success');
          } catch (err) {
            // AbortError indica che l'utente ha chiuso il pannello nativo di share, non facciamo nulla
            if (err.name !== 'AbortError') {
              console.error(err);
              downloadImage();
            }
          }
        } else {
          downloadImage();
        }
      }, 'image/png');
    } else {
      downloadImage();
    }
  } catch(e) {
    console.error(e);
    showToast('Errore durante la creazione dell\'immagine: ' + e.message, 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = originalHTML;
    }
  }
}
