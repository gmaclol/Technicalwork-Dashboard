// ── Excel Export & Print ──
import { escapeHtml, showToast } from './utils.js';

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
      const rowData = [mat, ...tecnici.map(t => { const v = (t.materiali && t.materiali[mat]) || ''; return (v === '0' || v === 0) ? '' : v; }), ''];
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
    const bg = idx % 2 === 1 ? '#F8F9FA' : '#FFFFFF';
    let cells = `<td style="padding:4px 6px;font-weight:600;font-size:10px;border:1px solid #DEE2E6;background:${bg};white-space:nowrap">${mat}</td>`;
    tecnici.forEach(t => {
      const raw = (t.materiali && t.materiali[mat]) || '';
      const val = (raw === '0' || raw === 0) ? '' : raw;
      const isEmpty = val === '';
      cells += `<td style="padding:4px 6px;text-align:center;font-size:10px;border:1px solid #DEE2E6;background:${bg};color:${isEmpty ? '#ADB5BD' : '#212529'};font-weight:${isEmpty ? 'normal' : '600'};white-space:nowrap">${val || '·'}</td>`;
    });
    cells += `<td style="padding:4px 6px;text-align:center;border:1px solid #DEE2E6;background:#E7F1FF;min-width:35px"></td>`;
    rows += `<tr>${cells}</tr>`;
  });

  let headers = `<th style="padding:6px 6px;text-align:left;background:#2C3E50;color:white;font-size:10px;border:1px solid #4A6278">MATERIALE</th>`;
  tecnici.forEach(t => {
    headers += `<th style="padding:6px 6px;text-align:center;background:#2C3E50;color:white;font-size:10px;border:1px solid #4A6278;white-space:nowrap">${(t.tecnico || t.id).toUpperCase()}</th>`;
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
  win.document.write(html);
  win.document.close();
}
