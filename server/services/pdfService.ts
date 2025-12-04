import puppeteer, { Browser, Page } from 'puppeteer';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * PDF Generation Service using Puppeteer
 * 
 * This service provides server-side PDF generation for test sheets,
 * replacing the unreliable client-side jsPDF/html2canvas approach.
 */

let browserInstance: Browser | null = null;

/**
 * Get or create a shared browser instance
 * Reusing the browser improves performance significantly
 */
async function getBrowser(): Promise<Browser> {
    if (!browserInstance || !browserInstance.isConnected()) {
        browserInstance = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
            ],
        });
    }
    return browserInstance;
}

/**
 * Close the browser instance
 * Call this on server shutdown
 */
export async function closeBrowser(): Promise<void> {
    if (browserInstance) {
        await browserInstance.close();
        browserInstance = null;
    }
}

/**
 * Generate PDF from HTML content
 * 
 * @param html - Complete HTML document as string
 * @param options - PDF generation options
 * @returns PDF buffer
 */
export async function generatePdfFromHtml(
    html: string,
    options: {
        format?: 'A4' | 'Letter';
        landscape?: boolean;
        margin?: {
            top?: string;
            right?: string;
            bottom?: string;
            left?: string;
        };
        printBackground?: boolean;
    } = {}
): Promise<Buffer> {
    const browser = await getBrowser();
    const page = await browser.newPage();

    try {
        // Set viewport for consistent rendering
        await page.setViewport({
            width: 1200,
            height: 1600,
            deviceScaleFactor: 2, // Retina quality
        });

        // Load the HTML content
        await page.setContent(html, {
            waitUntil: ['load', 'networkidle0'],
        });

        // Wait for any fonts or images to load
        await page.evaluateHandle('document.fonts.ready');

        // Generate PDF
        const pdfBuffer = await page.pdf({
            format: options.format || 'A4',
            landscape: options.landscape || false,
            printBackground: options.printBackground !== false, // Default true
            margin: options.margin || {
                top: '10mm',
                right: '10mm',
                bottom: '10mm',
                left: '10mm',
            },
            preferCSSPageSize: false,
        });

        return Buffer.from(pdfBuffer);
    } finally {
        await page.close();
    }
}

/**
 * Generate PDF from URL
 * Useful for generating PDFs of pages in your application
 * 
 * @param url - URL to render as PDF
 * @param options - PDF generation options
 * @returns PDF buffer
 */
export async function generatePdfFromUrl(
    url: string,
    options: {
        format?: 'A4' | 'Letter';
        landscape?: boolean;
        margin?: {
            top?: string;
            right?: string;
            bottom?: string;
            left?: string;
        };
        printBackground?: boolean;
        waitForSelector?: string;
        waitTime?: number;
    } = {}
): Promise<Buffer> {
    const browser = await getBrowser();
    const page = await browser.newPage();

    try {
        // Set viewport for consistent rendering
        await page.setViewport({
            width: 1200,
            height: 1600,
            deviceScaleFactor: 2,
        });

        // Navigate to the URL
        await page.goto(url, {
            waitUntil: ['load', 'networkidle0'],
            timeout: 30000,
        });

        // Wait for specific selector if provided
        if (options.waitForSelector) {
            await page.waitForSelector(options.waitForSelector, {
                timeout: 10000,
            });
        }

        // Additional wait time if needed
        if (options.waitTime) {
            await new Promise(resolve => setTimeout(resolve, options.waitTime));
        }

        // Wait for fonts to load
        await page.evaluateHandle('document.fonts.ready');

        // Generate PDF
        const pdfBuffer = await page.pdf({
            format: options.format || 'A4',
            landscape: options.landscape || false,
            printBackground: options.printBackground !== false,
            margin: options.margin || {
                top: '10mm',
                right: '10mm',
                bottom: '10mm',
                left: '10mm',
            },
            preferCSSPageSize: false,
        });

        return Buffer.from(pdfBuffer);
    } finally {
        await page.close();
    }
}

/**
 * Generate test sheet PDF from form data
 * Creates a properly formatted test sheet document
 * 
 * @param formData - Complete test sheet form data
 * @returns PDF buffer
 */
export async function generateTestSheetPdf(formData: any): Promise<Buffer> {
    // Build the HTML for the test sheet
    const html = buildTestSheetHtml(formData);

    return generatePdfFromHtml(html, {
        format: 'A4',
        landscape: false,
        printBackground: true,
        margin: {
            top: '5mm',
            right: '5mm',
            bottom: '5mm',
            left: '5mm',
        },
    });
}

/**
 * Build HTML for test sheet
 * This creates a complete HTML document with embedded styles
 */
function buildTestSheetHtml(formData: any): string {
    // Read the base styles (you can include Tailwind or custom CSS here)
    const styles = `
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 10pt;
        line-height: 1.4;
        color: #333;
        background: white;
        padding: 10px;
      }
      
      .header {
        text-align: center;
        margin-bottom: 15px;
        border-bottom: 2px solid #333;
        padding-bottom: 10px;
      }
      
      .header h1 {
        font-size: 18pt;
        font-weight: bold;
        margin-bottom: 5px;
      }
      
      .header .logo {
        max-width: 60px;
        height: auto;
      }
      
      .section {
        margin-bottom: 12px;
      }
      
      .section-title {
        font-weight: bold;
        font-size: 11pt;
        margin-bottom: 6px;
        padding: 4px;
        background: #f3f4f6;
        border-left: 3px solid #3b82f6;
      }
      
      .grid {
        display: grid;
        gap: 8px;
        margin-bottom: 8px;
      }
      
      .grid-2 {
        grid-template-columns: 1fr 1fr;
      }
      
      .grid-3 {
        grid-template-columns: 1fr 1fr 1fr;
      }
      
      .field {
        margin-bottom: 6px;
      }
      
      .field-label {
        font-weight: 600;
        font-size: 9pt;
        color: #666;
        margin-bottom: 2px;
      }
      
      .field-value {
        border: 1px solid #d1d5db;
        padding: 4px 6px;
        background: white;
        border-radius: 2px;
        min-height: 20px;
      }
      
      .test-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 6px;
      }
      
      .test-table th,
      .test-table td {
        border: 1px solid #d1d5db;
        padding: 4px 6px;
        text-align: left;
      }
      
      .test-table th {
        background: #f3f4f6;
        font-weight: 600;
        font-size: 9pt;
      }
      
      .test-table td {
        font-size: 9pt;
      }
      
      .signature-box {
        border: 1px solid #d1d5db;
        height: 80px;
        margin-top: 4px;
        background: white;
      }
      
      .signature-box img {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
      }
      
      @media print {
        body {
          print-color-adjust: exact;
          -webkit-print-color-adjust: exact;
        }
      }
    </style>
  `;

    // Build the HTML document
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Test Sheet - ${formData.adminReference || 'Draft'}</title>
      ${styles}
    </head>
    <body>
      <div class="header">
        <h1>${formData.formType || 'Test Sheet'}</h1>
        <div>Admin Reference: ${formData.adminReference || 'N/A'}</div>
      </div>
      
      <div class="section">
        <div class="section-title">General Information</div>
        <div class="grid grid-2">
          <div class="field">
            <div class="field-label">Customer</div>
            <div class="field-value">${formData.customer || ''}</div>
          </div>
          <div class="field">
            <div class="field-label">Plant Name</div>
            <div class="field-value">${formData.plantName || ''}</div>
          </div>
          <div class="field">
            <div class="field-label">Start Time</div>
            <div class="field-value">${formData.startTime || ''}</div>
          </div>
          <div class="field">
            <div class="field-label">End Time</div>
            <div class="field-value">${formData.endTime || ''}</div>
          </div>
        </div>
      </div>
      
      <div class="section">
        <div class="section-title">Vehicle Details</div>
        <div class="grid grid-3">
          <div class="field">
            <div class="field-label">Make</div>
            <div class="field-value">${formData.vehicleMake || ''}</div>
          </div>
          <div class="field">
            <div class="field-label">Model</div>
            <div class="field-value">${formData.vehicleModel || ''}</div>
          </div>
          <div class="field">
            <div class="field-label">Voltage</div>
            <div class="field-value">${formData.vehicleVoltage || ''}</div>
          </div>
        </div>
      </div>
      
      <!-- Add more sections as needed -->
      
      <div class="section">
        <div class="section-title">Administrator Signature</div>
        <div class="signature-box">
          ${formData.signatureDataUrl ? `<img src="${formData.signatureDataUrl}" alt="Signature" />` : ''}
        </div>
        <div style="margin-top: 4px; font-size: 9pt;">
          Administrator: ${formData.administrator || ''} | 
          Technician: ${formData.technicianName || ''}
        </div>
      </div>
      
      <div style="margin-top: 15px; text-align: center; font-size: 8pt; color: #666;">
        Generated on ${new Date().toLocaleString()}
      </div>
    </body>
    </html>
  `;
}

export default {
    generatePdfFromHtml,
    generatePdfFromUrl,
    generateTestSheetPdf,
    closeBrowser,
};
