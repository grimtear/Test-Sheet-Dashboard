/**
 * PDF Generation Utilities
 * 
 * Client-side utilities for generating PDFs using the server-side Puppeteer service.
 * This replaces the unreliable client-side jsPDF/html2canvas approach.
 */

/**
 * Generate a test sheet PDF using server-side rendering
 * 
 * @param formData - Complete test sheet form data
 * @param filename - Optional filename for the PDF
 * @returns Promise that resolves when PDF is downloaded
 */
export async function generateTestSheetPdf(
    formData: any,
    filename?: string
): Promise<void> {
    try {
        const response = await fetch('/api/pdf/generate-test-sheet', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                formData,
                filename: filename || `${formData.adminReference || 'test-sheet'}.pdf`,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to generate PDF');
        }

        // Get the PDF blob
        const blob = await response.blob();

        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename || `${formData.adminReference || 'test-sheet'}.pdf`;

        // Trigger download
        document.body.appendChild(link);
        link.click();

        // Cleanup
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('PDF generation error:', error);
        throw error;
    }
}

/**
 * Generate PDF from HTML content
 * 
 * @param html - HTML string to convert to PDF
 * @param options - PDF generation options
 * @returns Promise that resolves when PDF is downloaded
 */
export async function generatePdfFromHtml(
    html: string,
    options: {
        filename?: string;
        format?: 'A4' | 'Letter';
        landscape?: boolean;
        margin?: {
            top?: string;
            right?: string;
            bottom?: string;
            left?: string;
        };
    } = {}
): Promise<void> {
    try {
        const response = await fetch('/api/pdf/generate-from-html', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                html,
                options,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to generate PDF');
        }

        // Get the PDF blob
        const blob = await response.blob();

        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = options.filename || 'document.pdf';

        // Trigger download
        document.body.appendChild(link);
        link.click();

        // Cleanup
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('PDF generation error:', error);
        throw error;
    }
}

/**
 * Save PDF to server (in addition to downloading)
 * 
 * @param formData - Test sheet form data
 * @param filename - Filename to save on server
 * @returns Promise with response data
 */
export async function saveTestSheetPdfToServer(
    formData: any,
    filename: string
): Promise<{ success: boolean; path?: string }> {
    try {
        const response = await fetch('/api/pdf/generate-test-sheet', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                formData,
                saveToDisk: true,
                filename,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to save PDF');
        }

        return { success: true };
    } catch (error) {
        console.error('PDF save error:', error);
        throw error;
    }
}
