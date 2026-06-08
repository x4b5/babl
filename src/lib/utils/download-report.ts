/**
 * Download report in various formats (Word, PDF, plain text).
 * Uses docx for .docx, jspdf for .pdf, and Blob for .txt.
 */

import { Document, Packer, Paragraph, TextRun, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';

/** Generate a timestamped filename without extension. */
function baseFilename(): string {
	const now = new Date();
	const date = now.toISOString().slice(0, 10);
	const time = now.toTimeString().slice(0, 5).replace(':', '');
	return `verslag-${date}-${time}`;
}

/** Download as plain text (.txt). */
export function downloadTxt(text: string): void {
	const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
	saveAs(blob, `${baseFilename()}.txt`);
}

/** Download as Word document (.docx). */
export async function downloadDocx(text: string): Promise<void> {
	const paragraphs = text.split('\n').map(
		(line) =>
			new Paragraph({
				children: [
					new TextRun({
						text: line,
						size: 24, // 12pt
						font: 'Calibri'
					})
				],
				spacing: { after: 120 },
				alignment: AlignmentType.LEFT
			})
	);

	const doc = new Document({
		sections: [
			{
				properties: {},
				children: paragraphs
			}
		]
	});

	const buffer = await Packer.toBlob(doc);
	saveAs(buffer, `${baseFilename()}.docx`);
}

/** Download as PDF (.pdf). */
export function downloadPdf(text: string): void {
	const doc = new jsPDF({
		orientation: 'portrait',
		unit: 'mm',
		format: 'a4'
	});

	const marginLeft = 20;
	const marginTop = 20;
	const pageWidth = 210 - 2 * marginLeft;
	const lineHeight = 6;
	const pageHeight = 297 - 2 * marginTop;

	doc.setFont('helvetica', 'normal');
	doc.setFontSize(11);

	const lines = doc.splitTextToSize(text, pageWidth);
	let y = marginTop;

	for (const line of lines) {
		if (y + lineHeight > marginTop + pageHeight) {
			doc.addPage();
			y = marginTop;
		}
		doc.text(line, marginLeft, y);
		y += lineHeight;
	}

	doc.save(`${baseFilename()}.pdf`);
}
