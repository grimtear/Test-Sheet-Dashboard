# Server-Side PDF Generation with Puppeteer

## Overview

This implementation replaces the previous client-side PDF generation (using jsPDF and html2canvas) with a robust server-side solution using Puppeteer. This provides several key advantages:

- **Reliability**: Server-side rendering eliminates browser inconsistencies
- **Quality**: Better font rendering and layout accuracy
- **Performance**: Offloads heavy processing from client browsers
- **Consistency**: Identical output across all devices and browsers
- **Features**: Access to full Chrome rendering engine capabilities

---

## Architecture

### Components

```
client/src/lib/pdfUtils.ts          # Client-side utilities
server/services/pdfService.ts       # PDF generation service
server/routes/pdfRoutes.ts          # API endpoints
server/index.ts                     # Server integration
```

### Flow

1. **Client** calls `generateTestSheetPdf(formData)` from `pdfUtils.ts`
2. **Request** sent to `/api/pdf/generate-test-sheet` with form data
3. **Server** uses Puppeteer to render HTML and generate PDF
4. **Response** returns PDF buffer to client
5. **Client** creates download link and triggers browser download

---

## API Endpoints

### POST `/api/pdf/generate-test-sheet`

Generate a PDF from test sheet form data.

**Request Body**:

```json
{
  "formData": {
    "adminReference": "NAE-001-2025",
    "customer": "Anglo American",
    "vehicleMake": "Mercedes Benz",
    ...
  },
  "saveToDisk": false,
  "filename": "test-sheet-NAE-001-2025.pdf"
}
```

**Response**: PDF file (application/pdf)

**Headers**:

- `Content-Type: application/pdf`
- `Content-Disposition: attachment; filename="..."`
- `Content-Length: <size>`

---

### POST `/api/pdf/generate-from-html`

Generate a PDF from raw HTML content.

**Request Body**:

```json
{
  "html": "<!DOCTYPE html><html>...</html>",
  "options": {
    "format": "A4",
    "landscape": false,
    "margin": {
      "top": "10mm",
      "right": "10mm",
      "bottom": "10mm",
      "left": "10mm"
    },
    "printBackground": true
  }
}
```

**Response**: PDF file (application/pdf)

---

### GET `/api/pdf/health`

Health check for PDF service.

**Response**:

```json
{
  "status": "ok",
  "service": "PDF Generation",
  "engine": "Puppeteer"
}
```

---

## Usage

### Client-Side

#### Generate and Download PDF

```typescript
import { generateTestSheetPdf } from '@/lib/pdfUtils';

// In your form submit handler
const handleSubmit = async (formData) => {
  try {
    await generateTestSheetPdf(formData, 'test-sheet.pdf');
    console.log('PDF downloaded successfully');
  } catch (error) {
    console.error('Failed to generate PDF:', error);
  }
};
```

#### Generate PDF from HTML

```typescript
import { generatePdfFromHtml } from '@/lib/pdfUtils';

const html = `
  <!DOCTYPE html>
  <html>
    <head>
      <style>
        body { font-family: Arial; }
        .header { font-size: 24px; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="header">Custom Report</div>
      <p>Content goes here...</p>
    </body>
  </html>
`;

await generatePdfFromHtml(html, {
  filename: 'report.pdf',
  format: 'A4',
  landscape: false,
});
```

#### Save to Server

```typescript
import { saveTestSheetPdfToServer } from '@/lib/pdfUtils';

await saveTestSheetPdfToServer(formData, 'archived-test-sheet.pdf');
```

---

### Server-Side

#### Direct PDF Generation

```typescript
import { generateTestSheetPdf } from './services/pdfService';

const pdfBuffer = await generateTestSheetPdf(formData);
// pdfBuffer is a Node.js Buffer containing the PDF
```

#### Custom HTML Template

```typescript
import { generatePdfFromHtml } from './services/pdfService';

const html = buildCustomTemplate(data);

const pdfBuffer = await generatePdfFromHtml(html, {
  format: 'A4',
  landscape: true,
  printBackground: true,
  margin: {
    top: '20mm',
    bottom: '20mm',
  },
});
```

---

## Configuration

### Puppeteer Options

Configured in `server/services/pdfService.ts`:

```typescript
const browser = await puppeteer.launch({
  headless: true,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
  ],
});
```

### PDF Options

Default PDF generation options:

```typescript
{
  format: 'A4',              // Paper size
  landscape: false,          // Portrait mode
  printBackground: true,     // Include background colors/images
  margin: {
    top: '10mm',
    right: '10mm',
    bottom: '10mm',
    left: '10mm',
  },
  preferCSSPageSize: false,  // Use format option instead of CSS
}
```

---

## Performance

### Browser Instance Pooling

The service maintains a single browser instance that is reused across requests:

```typescript
let browserInstance: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (!browserInstance || !browserInstance.isConnected()) {
    browserInstance = await puppeteer.launch({...});
  }
  return browserInstance;
}
```

**Benefits**:

- **Fast**: Reusing browser reduces startup time from ~2s to ~100ms
- **Efficient**: Lower memory usage
- **Reliable**: Automatic reconnection if browser crashes

### Cleanup

Browser is properly closed on server shutdown:

```typescript
process.on('SIGTERM', async () => {
  await closeBrowser();
  server.close(() => process.exit(0));
});
```

---

## HTML Template Structure

The PDF service expects well-formed HTML with embedded CSS:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    /* All styles must be embedded */
    body { font-family: Arial; }
    .header { font-size: 18pt; }
  </style>
</head>
<body>
  <div class="header">Test Sheet</div>
  <!-- Content -->
</body>
</html>
```

**Important**:

- External stylesheets are NOT supported (embed all CSS)
- External images should use data URLs or absolute URLs
- Use print-friendly CSS (`@media print`)

---

## Error Handling

### Client-Side

```typescript
try {
  await generateTestSheetPdf(formData);
} catch (error) {
  if (error.message.includes('Failed to generate PDF')) {
    // Server-side error
    alert('PDF generation failed. Please try again.');
  } else {
    // Network or other error
    alert('Network error. Please check your connection.');
  }
}
```

### Server-Side

Errors are logged and returned as JSON:

```typescript
try {
  const pdfBuffer = await generateTestSheetPdf(formData);
  res.send(pdfBuffer);
} catch (error) {
  console.error('PDF generation error:', error);
  res.status(500).json({
    error: 'Failed to generate PDF',
    message: error.message,
  });
}
```

---

## Migration from jsPDF

### Before (Client-Side)

```typescript
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const canvas = await html2canvas(element);
const pdf = new jsPDF();
pdf.addImage(canvas.toDataURL(), 'PNG', 0, 0);
pdf.save('test-sheet.pdf');
```

### After (Server-Side)

```typescript
import { generateTestSheetPdf } from '@/lib/pdfUtils';

await generateTestSheetPdf(formData, 'test-sheet.pdf');
```

**Benefits**:

- ✅ No more canvas rendering issues
- ✅ Better text quality
- ✅ Consistent cross-browser output
- ✅ Faster for large documents
- ✅ Supports complex layouts

---

## Troubleshooting

### Issue: PDF generation is slow

**Solution**: First PDF generation after server start takes ~2s (browser launch). Subsequent requests are fast (~100ms). This is normal.

---

### Issue: Fonts not rendering correctly

**Solution**: Ensure fonts are available on the server or use web-safe fonts:

```css
body {
  font-family: Arial, Helvetica, sans-serif;
}
```

---

### Issue: Images not appearing in PDF

**Solution**: Use data URLs or ensure images are accessible via absolute URLs:

```html
<!-- Good -->
<img src="data:image/png;base64,..." />
<img src="https://example.com/logo.png" />

<!-- Bad -->
<img src="/logo.png" /> <!-- Relative URLs don't work -->
```

---

### Issue: Background colors missing

**Solution**: Ensure `printBackground: true` in options:

```typescript
await generatePdfFromHtml(html, {
  printBackground: true, // ← Important!
});
```

---

## Testing

### Manual Testing

1. Start the server: `npm run dev`
2. Navigate to test sheet form
3. Fill in form data
4. Click Submit
5. Verify PDF downloads with correct content

### API Testing

```bash
# Health check
curl http://localhost:5002/api/pdf/health

# Generate from HTML
curl -X POST http://localhost:5002/api/pdf/generate-from-html \
  -H "Content-Type: application/json" \
  -d '{
    "html": "<!DOCTYPE html><html><body><h1>Test</h1></body></html>",
    "options": {"format": "A4"}
  }' \
  --output test.pdf
```

---

## Production Deployment

### Docker Configuration

If deploying with Docker, ensure Puppeteer dependencies are installed:

```dockerfile
# Install Chromium dependencies
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libgdk-pixbuf2.0-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils
```

### Environment Variables

```env
# Optional: Set Puppeteer executable path
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Optional: Skip Chromium download during npm install
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
```

---

## Future Enhancements

- [ ] Template system for different test sheet types
- [ ] Batch PDF generation
- [ ] PDF watermarking
- [ ] Digital signatures
- [ ] Email PDF as attachment
- [ ] Cloud storage integration (S3, Google Drive)

---

*Last Updated: November 6, 2025*  
*Status: ✅ Implemented and Ready for Production*
