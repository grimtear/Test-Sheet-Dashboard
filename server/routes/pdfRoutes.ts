import { Router, Request, Response } from 'express';
import { generateTestSheetPdf, generatePdfFromHtml } from '../services/pdfService';
import { writeFileSync } from 'fs';
import { join } from 'path';

const router = Router();

/**
 * POST /api/pdf/generate-test-sheet
 * Generate a PDF from test sheet form data
 * 
 * Body: {
 *   formData: TestSheetFormData,
 *   saveToDisk?: boolean,
 *   filename?: string
 * }
 */
router.post('/generate-test-sheet', async (req: Request, res: Response) => {
    try {
        const { formData, saveToDisk, filename } = req.body;

        if (!formData) {
            return res.status(400).json({ error: 'Form data is required' });
        }

        // Generate PDF using Puppeteer
        const pdfBuffer = await generateTestSheetPdf(formData);

        // Optionally save to disk
        if (saveToDisk && filename) {
            const outputPath = join(process.cwd(), 'pdfs', filename);
            writeFileSync(outputPath, pdfBuffer);
            console.log(`PDF saved to: ${outputPath}`);
        }

        // Set appropriate headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename || 'test-sheet.pdf'}"`);
        res.setHeader('Content-Length', pdfBuffer.length);

        // Send the PDF
        res.send(pdfBuffer);
    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).json({
            error: 'Failed to generate PDF',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

/**
 * POST /api/pdf/generate-from-html
 * Generate a PDF from HTML content
 * 
 * Body: {
 *   html: string,
 *   options?: {
 *     format?: 'A4' | 'Letter',
 *     landscape?: boolean,
 *     margin?: { top, right, bottom, left }
 *   }
 * }
 */
router.post('/generate-from-html', async (req: Request, res: Response) => {
    try {
        const { html, options = {} } = req.body;

        if (!html) {
            return res.status(400).json({ error: 'HTML content is required' });
        }

        // Generate PDF
        const pdfBuffer = await generatePdfFromHtml(html, options);

        // Set headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="document.pdf"');
        res.setHeader('Content-Length', pdfBuffer.length);

        // Send PDF
        res.send(pdfBuffer);
    } catch (error) {
        console.error('Error generating PDF from HTML:', error);
        res.status(500).json({
            error: 'Failed to generate PDF',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

/**
 * GET /api/pdf/health
 * Health check endpoint for PDF service
 */
router.get('/health', (req: Request, res: Response) => {
    res.json({
        status: 'ok',
        service: 'PDF Generation',
        engine: 'Puppeteer'
    });
});

export default router;
