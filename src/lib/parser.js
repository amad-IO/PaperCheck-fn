/**
 * Client-Side Document Parser for PDF and DOCX
 * 100% processed in the browser memory, never sent to any server.
 */

/**
 * Extract raw text from a DOCX file using mammoth.js
 */
export async function parseDocx(file) {
  try {
    const mammoth = await import('mammoth');
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value || '';
  } catch (error) {
    console.error('Error parsing DOCX file:', error);
    throw new Error('Gagal membaca isi berkas DOCX. Pastikan berkas tidak rusak atau terenkripsi password.');
  }
}

/**
 * Extract raw text from a PDF file using pdfjs-dist
 */
export async function parsePdf(file) {
  try {
    // Dynamic import to prevent SSR issues
    const pdfjsLib = await import('pdfjs-dist');
    
    // Configure worker
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '3.11.174'}/pdf.worker.min.js`;
    }

    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    let fullText = '';
    const numPages = pdf.numPages;

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map(item => item.str)
        .join(' ');
      fullText += pageText + '\n';
    }

    return fullText.trim();
  } catch (error) {
    console.error('Error parsing PDF file:', error);
    throw new Error('Gagal membaca isi berkas PDF. Pastikan berkas PDF bukan hasil scan gambar murni tanpa teks.');
  }
}

/**
 * Main parser entry point: dispatches according to file extension/MIME
 */
export async function extractTextFromFile(file) {
  const fileName = file.name.toLowerCase();

  if (fileName.endsWith('.pdf') || file.type === 'application/pdf') {
    return await parsePdf(file);
  } else if (fileName.endsWith('.docx') || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    return await parseDocx(file);
  } else if (fileName.endsWith('.txt') || file.type === 'text/plain') {
    return await file.text();
  } else {
    throw new Error('Format berkas tidak didukung. Harap unggah berkas PDF (.pdf) atau Word (.docx).');
  }
}
