# API Documentation with Swagger/OpenAPI

## Overview

Complete interactive API documentation using Swagger UI and OpenAPI 3.0 specification. All endpoints are documented with request/response schemas, examples, and authentication requirements.

## Features

- ✅ **OpenAPI 3.0 Specification**: Industry-standard API documentation format
- ✅ **Swagger UI**: Interactive API explorer with "Try it out" functionality
- ✅ **Comprehensive Schemas**: TypeScript-aligned data models for all entities
- ✅ **Request/Response Examples**: Real-world examples for every endpoint
- ✅ **Authentication Documentation**: Session-based auth clearly explained
- ✅ **Organized by Tags**: Logical grouping (Auth, Test Sheets, Search, PDF, etc.)
- ✅ **Error Responses**: Standard error formats documented
- ✅ **Export Capability**: Download OpenAPI spec as JSON
- ✅ **No Code Changes Required**: Works with existing routes via JSDoc annotations

## Accessing the Documentation

### Swagger UI (Interactive)

Visit the interactive API documentation:

```
http://localhost:5002/api-docs
```

Features:

- Browse all endpoints organized by category
- View request/response schemas
- See example data
- Try out API calls directly from the browser
- Authenticate and test protected endpoints
- Download responses
- View cURL commands

### OpenAPI Specification (JSON)

Download the complete OpenAPI 3.0 spec:

```
http://localhost:5002/api-docs.json
```

Use this JSON file with:

- Postman (import collection)
- Insomnia (import spec)
- Code generators (generate client SDKs)
- API testing tools
- Documentation generators

## Architecture

### File Structure

```
server/
├── config/
│   └── swagger.ts          # OpenAPI configuration (300+ lines)
├── swagger-docs.ts         # JSDoc annotations (650+ lines)
└── simpleRoutes.ts         # Swagger UI integration
```

### Components

1. **Swagger Configuration** (`config/swagger.ts`)
   - OpenAPI 3.0 base specification
   - Server definitions (dev + production)
   - Security schemes (session auth)
   - Reusable schemas (User, TestSheet, AuditLog, Error, Success)
   - Reusable responses (Unauthorized, NotFound, BadRequest, ServerError)
   - Tag definitions for organization

2. **Endpoint Documentation** (`swagger-docs.ts`)
   - JSDoc annotations for all endpoints
   - Request body schemas
   - Response schemas
   - Parameter definitions
   - Example values
   - Authentication requirements

3. **Server Integration** (`simpleRoutes.ts`)
   - Swagger UI at `/api-docs`
   - JSON spec at `/api-docs.json`
   - Custom styling (hides top bar)

## Documented Endpoints

### Authentication (4 endpoints)

- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/user` - Get current user
- `POST /api/auth/complete-profile` - Complete user profile

### Test Sheets (5 endpoints)

- `GET /api/test-sheets` - Get all test sheets
- `POST /api/test-sheets` - Create test sheet
- `GET /api/test-sheets/recent` - Get recent test sheets (last 5)
- `GET /api/test-sheets/stats` - Get statistics
- `GET /api/test-sheets/{id}` - Get test sheet by ID

### Search (1 endpoint)

- `POST /api/search/test-sheets` - Advanced search with filters

### PDF (1 endpoint)

- `POST /api/pdf/generate` - Generate PDF from test sheet

### Notifications (1 endpoint)

- `POST /api/notifications/test-sheet/{id}/completed` - Send completion email

### Audit (2 endpoints)

- `GET /api/audit/logs` - Get audit logs with filters
- `GET /api/audit/stats` - Get audit statistics

### System (1 endpoint)

- `GET /api/health` - Health check (no auth required)

### Google Sheets (1 endpoint)

- `GET /api/google-sheets/summary` - Get summary data

**Total: 16 documented endpoints**

## Data Schemas

### User Schema

```typescript
{
  id: string;              // Unique identifier
  email: string;           // Email address
  firstName: string;       // First name
  lastName: string;        // Last name
  profileImageUrl: string; // Avatar URL
  userNumber: integer;     // Reference number
  createdAt: integer;      // Unix timestamp
  updatedAt: integer;      // Unix timestamp
}
```

### TestSheet Schema

```typescript
{
  id: string;              // Unique identifier
  userId: string;          // Creator user ID
  techReference: string;   // Tech reference (TS391703-11-2025 13:07)
  adminReference: string;  // Admin reference (CG01-CSM S64-Zi12441640)
  customer: string;        // Customer name
  plantName: string;       // Plant/site name
  Test: string;            // Status: "Test OK" | "Failed" | "N/A"
  isDraft: integer;        // 0 = submitted, 1 = draft
  createdAt: integer;      // Unix timestamp
  updatedAt: integer;      // Unix timestamp
  // ... 60+ additional fields
}
```

### AuditLog Schema

```typescript
{
  id: string;              // Unique identifier
  userId: string;          // User who performed action
  userEmail: string;       // User email
  userName: string;        // User full name
  action: string;          // CREATE | UPDATE | DELETE | LOGIN | etc.
  entity: string;          // test_sheets | users | etc.
  entityId: string;        // Affected record ID
  description: string;     // Human-readable description
  severity: string;        // info | warning | error | critical
  timestamp: integer;      // Unix timestamp
  // ... request metadata fields
}
```

### Error Schema

```typescript
{
  error: string;           // Error message
  success: false;          // Always false for errors
}
```

### Success Schema

```typescript
{
  success: true;           // Always true
  message: string;         // Success message
}
```

## Authentication

All endpoints (except `/api/auth/login` and `/api/health`) require authentication via session cookies.

**Security Scheme:**

```yaml
sessionAuth:
  type: apiKey
  in: cookie
  name: connect.sid
```

**How to authenticate in Swagger UI:**

1. Go to <http://localhost:5002/api-docs>
2. Click "Authorize" button (top right)
3. Login via your app first to get session cookie
4. Swagger UI will automatically use the cookie
5. Try protected endpoints

## Standard Responses

### Success Response (200)

```json
{
  "success": true,
  "message": "Operation completed successfully",
  ...
}
```

### Error Response (4xx/5xx)

```json
{
  "error": "Error message description",
  "success": false
}
```

### Common HTTP Status Codes

- `200` - Success
- `400` - Bad Request (invalid parameters)
- `401` - Unauthorized (not authenticated)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error

## Usage Examples

### View Documentation

1. Start server: `npm run dev:server`
2. Open browser: <http://localhost:5002/api-docs>
3. Browse endpoints by tag
4. Click endpoint to expand details
5. View schemas, parameters, responses
6. Click "Try it out" to test

### Test an Endpoint

1. Expand `POST /api/test-sheets`
2. Click "Try it out"
3. Edit the request body JSON
4. Click "Execute"
5. View response below (status code, headers, body)
6. See cURL command equivalent

### Download Specification

```bash
# Download OpenAPI JSON
curl http://localhost:5002/api-docs.json > openapi.json

# Import to Postman
# File → Import → openapi.json

# Generate client code
npm install -g @openapitools/openapi-generator-cli
openapi-generator-cli generate -i openapi.json -g typescript-axios -o ./client
```

## Extending Documentation

### Add New Endpoint Documentation

Edit `server/swagger-docs.ts` and add JSDoc annotation:

```typescript
/**
 * @swagger
 * /api/your-endpoint:
 *   post:
 *     summary: Short description
 *     description: Detailed description
 *     tags: [Category]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               field1:
 *                 type: string
 *                 example: value1
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: string
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
```

The documentation will automatically update on server restart.

### Add New Schema

Edit `server/config/swagger.ts`:

```typescript
components: {
  schemas: {
    YourNewSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Unique identifier',
          example: 'abc123',
        },
        name: {
          type: 'string',
          description: 'Name field',
          example: 'Example Name',
        },
      },
    },
  },
}
```

Then reference it in endpoint docs:

```yaml
schema:
  $ref: '#/components/schemas/YourNewSchema'
```

### Add New Tag/Category

Edit `server/config/swagger.ts`:

```typescript
tags: [
  {
    name: 'Your Category',
    description: 'Description of this category',
  },
],
```

## Integration with Tools

### Postman

1. Download spec: <http://localhost:5002/api-docs.json>
2. Postman → File → Import
3. Select downloaded JSON file
4. Choose "OpenAPI 3.0"
5. All endpoints imported as collection
6. Configure environment variables
7. Test endpoints

### Insomnia

1. Download spec: <http://localhost:5002/api-docs.json>
2. Insomnia → Application → Preferences → Data
3. Import Data → From File
4. Select JSON file
5. All endpoints available

### Code Generation

Generate TypeScript client:

```bash
# Install generator
npm install -g @openapitools/openapi-generator-cli

# Generate client
openapi-generator-cli generate \
  -i http://localhost:5002/api-docs.json \
  -g typescript-axios \
  -o ./generated-client

# Use generated client
import { DefaultApi } from './generated-client';
const api = new DefaultApi();
const user = await api.getUserInfo();
```

Generate Python client:

```bash
openapi-generator-cli generate \
  -i http://localhost:5002/api-docs.json \
  -g python \
  -o ./python-client
```

Supported generators: Java, Go, Ruby, PHP, C#, Rust, and 50+ more languages.

### API Testing

Use with automated testing tools:

```typescript
// Jest test with OpenAPI validation
import { validateAgainstSchema } from 'jest-openapi';

test('GET /api/test-sheets matches schema', async () => {
  const response = await fetch('/api/test-sheets');
  const data = await response.json();
  
  expect(response.status).toBe(200);
  validateAgainstSchema(data, 'TestSheet[]');
});
```

## Customization

### Swagger UI Theme

Edit `server/simpleRoutes.ts`:

```typescript
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: `
    .swagger-ui .topbar { display: none; }
    .swagger-ui { background-color: #f5f5f5; }
    .swagger-ui .opblock { border-color: #0066cc; }
  `,
  customSiteTitle: 'NAE IT Technology API Docs',
  customfavIcon: '/favicon.png',
}));
```

### Add API Key Authentication

Edit `server/config/swagger.ts`:

```typescript
components: {
  securitySchemes: {
    apiKey: {
      type: 'apiKey',
      in: 'header',
      name: 'X-API-Key',
    },
  },
}
```

Then apply to endpoints:

```yaml
security:
  - apiKey: []
```

### Change Base Path

Edit `server/config/swagger.ts`:

```typescript
servers: [
  {
    url: 'http://localhost:5002/v1',
    description: 'Development server (v1)',
  },
],
```

## Production Deployment

### Update Server URLs

Edit `server/config/swagger.ts`:

```typescript
servers: [
  {
    url: 'https://api.naeit.tech',
    description: 'Production server',
  },
  {
    url: 'https://staging-api.naeit.tech',
    description: 'Staging server',
  },
  {
    url: 'http://localhost:5002',
    description: 'Development server',
  },
],
```

### Host Static Documentation

Generate static HTML:

```bash
# Install redoc-cli
npm install -g redoc-cli

# Generate static HTML
redoc-cli bundle http://localhost:5002/api-docs.json \
  -o docs/api-documentation.html

# Deploy to static hosting
# Upload api-documentation.html to S3, Netlify, Vercel, etc.
```

### Versioning

Add versioning to paths:

```typescript
// v1 endpoints
'/api/v1/test-sheets': { ... }

// v2 endpoints  
'/api/v2/test-sheets': { ... }
```

Or use separate specs:

```typescript
// swagger-v1.ts
export const swaggerSpecV1 = ...

// swagger-v2.ts
export const swaggerSpecV2 = ...

// Mount separately
app.use('/api-docs/v1', swaggerUi.serve, swaggerUi.setup(swaggerSpecV1));
app.use('/api-docs/v2', swaggerUi.serve, swaggerUi.setup(swaggerSpecV2));
```

## Best Practices

1. **Keep Examples Realistic**: Use real-world data in examples
2. **Document All Fields**: Every property should have a description
3. **Use Consistent Names**: Match actual API field names exactly
4. **Include Error Cases**: Document all possible error responses
5. **Tag Logically**: Group related endpoints together
6. **Version Carefully**: Plan for API versioning from the start
7. **Update Regularly**: Keep docs in sync with code changes
8. **Validate Spec**: Use OpenAPI validators to catch errors

## Troubleshooting

### Swagger UI Not Loading

1. Check server is running: <http://localhost:5002/health>
2. Verify route is registered in `simpleRoutes.ts`
3. Check console for errors
4. Try accessing JSON directly: <http://localhost:5002/api-docs.json>

### Endpoints Not Appearing

1. Check JSDoc annotations in `swagger-docs.ts`
2. Verify syntax (YAML indentation matters)
3. Ensure files are included in `apis` array in `swagger.ts`
4. Restart server after doc changes

### Schema Validation Errors

1. Use online validator: <https://editor.swagger.io>
2. Paste your JSON spec
3. Fix any errors shown
4. Re-test locally

### Authentication Not Working

1. Login to app first (get session cookie)
2. Refresh Swagger UI page
3. Cookie should be sent automatically
4. Check browser dev tools → Application → Cookies

## Comparison with Alternatives

### Swagger vs. Postman Collections

**Swagger Advantages:**

- Standard format (OpenAPI)
- Interactive UI
- Code generation
- Validation

**Postman Advantages:**

- Better testing features
- Environment variables
- Team collaboration

**Recommendation:** Use both! Export Swagger to Postman.

### Swagger vs. GraphQL

**REST + Swagger:**

- Simpler to understand
- Better caching
- Works with existing code

**GraphQL:**

- Self-documenting
- Flexible queries
- Reduces over-fetching

**Recommendation:** Swagger for REST APIs, GraphQL for complex data fetching needs.

## Code Statistics

| Component | Lines | Features |
|-----------|-------|----------|
| Swagger Config | 300 | OpenAPI spec, schemas, security |
| Endpoint Docs | 650 | 16 endpoints fully documented |
| Integration | 15 | Swagger UI + JSON endpoint |
| **Total** | **965** | **Complete API docs** |

## Summary

The API Documentation system provides:

- ✅ **16 endpoints** fully documented with Swagger/OpenAPI
- ✅ **Interactive UI** at `/api-docs` for testing
- ✅ **Exportable spec** at `/api-docs.json`
- ✅ **Comprehensive schemas** for all data types
- ✅ **Standard responses** documented
- ✅ **Authentication** clearly explained
- ✅ **Production-ready** with server configuration
- ✅ **Tool integration** (Postman, code generators, validators)

**Access:** <http://localhost:5002/api-docs>

**Benefits:**

- Developers can understand API without reading code
- Clients can generate SDKs automatically
- QA can test endpoints interactively
- Documentation stays in sync with implementation
- Supports API versioning and evolution
