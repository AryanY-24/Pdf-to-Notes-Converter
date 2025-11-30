import { NoteResult } from '../types';
import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import * as FileSaver from 'file-saver';

// Robust handling for FileSaver import in various environments
const saveAs = (FileSaver as any).saveAs || (FileSaver as any).default || FileSaver;

export const exportToPDF = (note: NoteResult) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const maxLineWidth = pageWidth - margin * 2;

  // Title
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0); // Black
  doc.setFontSize(22);
  doc.text(note.title, margin, 20);

  let yPos = 35;

  // Keywords
  if (note.keywordsFound.length > 0) {
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0); // Black
    doc.text(`Keywords: ${note.keywordsFound.join(', ')}`, margin, yPos);
    yPos += 10;
  }

  // Sections
  note.sections.forEach((section) => {
    // Check for page break
    if (yPos > 270) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0); // Black
    doc.text(section.heading, margin, yPos);
    yPos += 8;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0); // Black
    
    const splitText = doc.splitTextToSize(section.content, maxLineWidth);
    doc.text(splitText, margin, yPos);
    
    yPos += (splitText.length * 6) + 10;
  });

  doc.save(`${note.title.replace(/\s+/g, '_')}_Notes.pdf`);
};

export const exportToWord = async (note: NoteResult) => {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          text: note.title,
          heading: HeadingLevel.TITLE,
          style: "Title",
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Keywords: ${note.keywordsFound.join(', ')}`,
              italics: true,
              color: "000000" // Black
            })
          ],
          spacing: { after: 200 }
        }),
        ...note.sections.flatMap(section => [
          new Paragraph({
            text: section.heading,
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 200, after: 100 },
            style: "Heading1"
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: section.content,
                color: "000000" // Black
              })
            ],
            spacing: { after: 200 }
          })
        ])
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${note.title.replace(/\s+/g, '_')}_Notes.docx`);
};

export const exportToText = (note: NoteResult) => {
  const lines: string[] = [];
  
  // Title
  lines.push(note.title);
  lines.push('='.repeat(note.title.length));
  lines.push('');

  // Keywords
  if (note.keywordsFound.length > 0) {
    lines.push(`Keywords: ${note.keywordsFound.join(', ')}`);
    lines.push('');
  }

  // Sections
  note.sections.forEach(section => {
    lines.push(section.heading.toUpperCase());
    lines.push('-'.repeat(section.heading.length));
    lines.push(section.content);
    lines.push(''); // Empty line between sections
  });

  const blob = new Blob([lines.join('\n')], { type: "text/plain;charset=utf-8" });
  saveAs(blob, `${note.title.replace(/\s+/g, '_')}_Notes.txt`);
};

export const exportToJSON = (note: NoteResult) => {
  const jsonString = JSON.stringify(note, null, 2);
  const blob = new Blob([jsonString], { type: "application/json;charset=utf-8" });
  saveAs(blob, `${note.title.replace(/\s+/g, '_')}_Notes.json`);
};