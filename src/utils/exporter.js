/**
 * Exports an HTML element's contents to PDF using html2pdf.js loaded from CDN
 */
export const exportToPDF = (elementId, filename = 'document.pdf') => {
  return new Promise((resolve, reject) => {
    const element = document.getElementById(elementId);
    if (!element) {
      reject(new Error(`Element with id ${elementId} not found.`));
      return;
    }

    if (!window.html2pdf) {
      reject(new Error('PDF generation engine is not loaded. Check internet connectivity.'));
      return;
    }

    const cleanFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;

    const opt = {
      margin:       [0.5, 0.5, 0.5, 0.5], // Top, Left, Bottom, Right margin
      filename:     cleanFilename,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { 
        scale: 2, 
        useCORS: true,
        logging: false
      },
      jsPDF:        { 
        unit: 'in', 
        format: 'letter', 
        orientation: 'portrait' 
      },
      pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
    };

    try {
      window.html2pdf()
        .set(opt)
        .from(element)
        .save()
        .then(() => resolve(true))
        .catch(err => reject(err));
    } catch (error) {
      console.error('PDF export failed:', error);
      reject(error);
    }
  });
};

/**
 * Exports HTML string content directly to Microsoft Word (.doc) format
 * using native XML/MIME-type HTML formatting.
 */
export const exportToWord = (htmlContent, filename = 'document.doc') => {
  const cleanFilename = filename.endsWith('.doc') ? filename : `${filename}.doc`;

  // Standard Word XML wrapper to retain CSS styling and layout
  const docTemplate = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' 
          xmlns:w='urn:schemas-microsoft-com:office:word' 
          xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <title>${filename}</title>
      <!--[if gte mso 9]>
      <xml>
        <w:WordDocument>
          <w:View>Print</w:View>
          <w:Zoom>100</w:Zoom>
          <w:DoNotOptimizeForBrowser/>
        </w:WordDocument>
      </xml>
      <![endif]-->
      <style>
        @page {
          size: 8.5in 11.0in;
          margin: 1.0in 1.0in 1.0in 1.0in;
        }
        body {
          font-family: 'Segoe UI', Arial, sans-serif;
          font-size: 11pt;
          line-height: 1.6;
          color: #1E293B;
        }
        h1 {
          color: #0070AD;
          font-size: 20pt;
          border-bottom: 2px solid #E2E8F0;
          padding-bottom: 5px;
          margin-top: 24px;
          margin-bottom: 12px;
        }
        h2 {
          color: #17ABDA;
          font-size: 15pt;
          margin-top: 18px;
          margin-bottom: 8px;
          border-bottom: 1px solid #F1F5F9;
        }
        h3 {
          color: #002C52;
          font-size: 12pt;
          margin-top: 14px;
        }
        p {
          margin-bottom: 12px;
          text-align: justify;
        }
        ul, ol {
          margin-bottom: 12px;
          padding-left: 20px;
        }
        li {
          margin-bottom: 4px;
        }
        code {
          font-family: 'Consolas', 'Courier New', monospace;
          background-color: #F1F5F9;
          padding: 2px 4px;
          border-radius: 4px;
          font-size: 9.5pt;
        }
        pre {
          background-color: #F8FAFC;
          border: 1px solid #E2E8F0;
          padding: 12px;
          border-radius: 6px;
          font-family: 'Consolas', 'Courier New', monospace;
          font-size: 9.5pt;
          margin-bottom: 15px;
          white-space: pre-wrap;
          word-wrap: break-word;
        }
        table {
          border-collapse: collapse;
          width: 100%;
          margin-top: 10px;
          margin-bottom: 15px;
        }
        th, td {
          border: 1px solid #CBD5E1;
          padding: 10px;
          text-align: left;
        }
        th {
          background-color: #0070AD;
          color: white;
          font-weight: bold;
        }
        tr:nth-child(even) {
          background-color: #F8FAFC;
        }
        blockquote {
          border-left: 4px solid #0070AD;
          padding-left: 15px;
          margin: 0 0 15px 0;
          color: #475569;
          font-style: italic;
        }
      </style>
    </head>
    <body>
      ${htmlContent}
    </body>
    </html>
  `;

  // Add the UTF-8 Byte Order Mark (BOM) to support foreign characters in Word
  const blob = new Blob(['\ufeff' + docTemplate], {
    type: 'application/msword;charset=utf-8'
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = cleanFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Exports document listing inventory as a CSV spreadsheet
 */
export const exportDocumentationIndexToExcel = (documents) => {
  const headers = ['Document Title', 'Category', 'Format Type', 'Source Type', 'GitHub URL / Reference', 'Created Date', 'Last Updated'];
  
  const rows = documents.map(doc => [
    doc.title,
    doc.category.toUpperCase(),
    doc.type.toUpperCase(),
    doc.source,
    doc.githubUrl || (doc.source === 'upload' ? 'Uploaded Asset' : 'Manual Entry'),
    new Date(doc.createdAt).toLocaleString(),
    new Date(doc.updatedAt).toLocaleString()
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(val => `"${val.replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `CapDoc_Inventory_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Downloads a stored binary file (like a PDF or Excel sheet) from database content
 */
export const downloadBinaryFile = (base64Content, filename, type) => {
  try {
    // If it's stored as plain string (e.g. Markdown or HTML text)
    if (!base64Content.startsWith('data:')) {
      const mime = type === 'html' ? 'text/html' : 'text/markdown';
      const blob = new Blob([base64Content], { type: `${mime};charset=utf-8` });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      return;
    }

    // It's stored as a Data URL (base64)
    const parts = base64Content.split(';base64,');
    const contentType = parts[0].split(':')[1];
    const raw = window.atob(parts[1]);
    const rawLength = raw.length;
    const uInt8Array = new Uint8Array(rawLength);

    for (let i = 0; i < rawLength; ++i) {
      uInt8Array[i] = raw.charCodeAt(i);
    }

    const blob = new Blob([uInt8Array], { type: contentType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Binary file download failed:', error);
    alert('Failed to download file. The content may be corrupted or in an incompatible format.');
  }
};
