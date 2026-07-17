/**
 * Professional PDF Export Template
 * Creates clean, professional PDF-ready HTML for printing
 */

/**
 * Format currency to Indonesian Rupiah
 */
export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return "Rp 0";
  return `Rp ${Number(amount).toLocaleString("id-ID")}`;
};

/**
 * Format date to Indonesian format
 */
export const formatDate = (dateString) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

/**
 * Format date short
 */
export const formatDateShort = (dateString) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString("id-ID");
};

/**
 * Get company logo SVG
 */
const getLogo = () => {
  return `
    <svg width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="25" cy="25" r="25" fill="#7A2E3A"/>
      <path d="M15 35V20L25 15L35 20V35L25 40L15 35Z" stroke="white" stroke-width="2" fill="none"/>
      <circle cx="25" cy="27" r="5" fill="white"/>
    </svg>
  `;
};

/**
 * Generate Professional PDF Header
 */
export const generatePDFHeader = (title, reportType, filters = {}) => {
  const now = new Date().toLocaleString("id-ID");
  const periodText = filters.from && filters.to
    ? `${formatDate(filters.from)} - ${formatDate(filters.to)}`
    : filters.from
    ? `Dari ${formatDate(filters.from)}`
    : filters.to
    ? `Sampai ${formatDate(filters.to)}`
    : "Semua Periode";

  return `
    <div style="text-align: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 3px solid #7A2E3A;">
      <div style="display: flex; align-items: center; justify-content: center; gap: 15px; margin-bottom: 10px;">
        ${getLogo()}
        <div style="text-align: left;">
          <h1 style="margin: 0; font-size: 22px; color: #7A2E3A; font-weight: 800;">SIKOMU</h1>
          <p style="margin: 0; font-size: 11px; color: #666;">Sistem Informasi Koperasi Multi-Unit</p>
        </div>
      </div>
      <h2 style="margin: 10px 0 5px; font-size: 16px; color: #333;">${title}</h2>
      <p style="margin: 0; font-size: 11px; color: #666;">
        ${reportType} | ${periodText}
      </p>
      <p style="margin: 5px 0 0; font-size: 10px; color: #999;">
        Dicetak pada: ${now} | ${filters.mode === "details" ? "Mode Detail" : "Mode Ringkasan"}
      </p>
    </div>
  `;
};

/**
 * Generate Summary Cards HTML
 */
export const generateSummaryCards = (summaryData, cards) => {
  const cardsHtml = cards.map(card => {
    const value = summaryData?.[card.key] ?? 0;
    const displayValue = card.format === "currency"
      ? formatCurrency(value)
      : card.format === "number"
      ? Number(value).toLocaleString("id-ID")
      : value;

    return `
      <div style="flex: 1; min-width: 150px; background: ${card.bgColor || '#f8f9fa'};
                  border-radius: 8px; padding: 15px; border-left: 4px solid ${card.color || '#7A2E3A'};">
        <p style="margin: 0 0 5px; font-size: 11px; color: #666; text-transform: uppercase;">${card.label}</p>
        <p style="margin: 0; font-size: ${card.size || '18'}px; font-weight: 700; color: ${card.color || '#7A2E3A'};">
          ${displayValue}
        </p>
      </div>
    `;
  }).join('');

  return `
    <div style="display: flex; flex-wrap: wrap; gap: 15px; margin-bottom: 20px;">
      ${cardsHtml}
    </div>
  `;
};

/**
 * Generate Table HTML
 */
export const generateTable = (headers, rows, config = {}) => {
  const { emptyMessage = "Tidak ada data", emptyColspan = headers.length } = config;

  const headersHtml = headers.map(h => `
    <th style="background: #7A2E3A; color: white; padding: 12px 8px; text-align: ${h.align || 'left'};
               font-size: 11px; font-weight: 600; border-bottom: 2px solid #5a2230;">
      ${h.label}
    </th>
  `).join('');

  const rowsHtml = rows.length > 0
    ? rows.map((row, i) => `
        <tr style="${i % 2 === 0 ? 'background: #ffffff;' : 'background: #fdf2f4;'}">
          ${row.map((cell, j) => {
            const align = headers[j]?.align || 'left';
            const isNumber = align === 'right';
            return `
              <td style="padding: 10px 8px; font-size: 11px; color: #333; text-align: ${align};
                         ${isNumber ? 'font-family: monospace;' : ''}">
                ${cell}
              </td>
            `;
          }).join('')}
        </tr>
      `).join('')
    : `
      <tr>
        <td colspan="${emptyColspan}" style="padding: 30px; text-align: center; color: #999; font-style: italic;">
          ${emptyMessage}
        </td>
      </tr>
    `;

  return `
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;
                  box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <thead>
        <tr>${headersHtml}</tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>
  `;
};

/**
 * Generate Section Title
 */
export const generateSectionTitle = (title, subtitle = "") => {
  return `
    <div style="margin: 25px 0 15px; padding-bottom: 8px; border-bottom: 2px solid #eee;">
      <h3 style="margin: 0; font-size: 14px; color: #7A2E3A; font-weight: 700;">${title}</h3>
      ${subtitle ? `<p style="margin: 3px 0 0; font-size: 10px; color: #666;">${subtitle}</p>` : ''}
    </div>
  `;
};

/**
 * Generate Footer
 */
export const generatePDFFooter = () => {
  return `
    <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #ddd;
                display: flex; justify-content: space-between; font-size: 10px; color: #999;">
      <span>&copy; ${new Date().getFullYear()} Sistem Informasi Manajemen Koperasi</span>
      <span>Dokumen ini dicetak dari Sistem - Halaman</span>
    </div>
  `;
};

/**
 * Complete Professional PDF Template
 */
export const generateProfessionalPDF = ({ title, reportType, filters, summary, summaryCards, sections, filtersInfo }) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>${title}</title>
        <style>
          @page {
            size: A4;
            margin: 15mm;
          }
          * {
            box-sizing: border-box;
          }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            font-size: 12px;
            color: #333;
            line-height: 1.5;
            margin: 0;
            padding: 20px;
          }
          h1, h2, h3 {
            margin: 0;
          }
          .text-success { color: #059669; }
          .text-danger { color: #DC2626; }
          .text-warning { color: #D97706; }
          .text-muted { color: #666; }
          .fw-bold { font-weight: 700; }
          .fw-normal { font-weight: 400; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .mt-1 { margin-top: 10px; }
          .mb-1 { margin-bottom: 10px; }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        ${generatePDFHeader(title, reportType, filters)}

        ${filtersInfo ? `
          <div style="background: #f8f9fa; padding: 12px 15px; border-radius: 6px; margin-bottom: 20px; font-size: 11px;">
            <strong>Filter yang digunakan:</strong> ${filtersInfo}
          </div>
        ` : ''}

        ${summaryCards ? generateSummaryCards(summary, summaryCards) : ''}

        ${sections ? sections.map(s => `
          ${generateSectionTitle(s.title, s.subtitle)}
          ${generateTable(s.headers, s.rows, s.config)}
        `).join('') : ''}

        ${generatePDFFooter()}

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 250);
          };
        </script>
      </body>
    </html>
  `;
};

/**
 * Open professional PDF in new window
 */
export const openProfessionalPDF = (pdfContent) => {
  const printWindow = window.open("", "_blank", "width=900,height=700");
  if (!printWindow) {
    alert("Mohon izinkan popup untuk mencetak laporan");
    return;
  }
  printWindow.document.write(pdfContent);
  printWindow.document.close();
};
