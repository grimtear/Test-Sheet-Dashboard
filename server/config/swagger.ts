/**
 * Swagger API Documentation Configuration
 * 
 * OpenAPI 3.0 specification for all API endpoints
 */

import swaggerJSDoc from 'swagger-jsdoc';

const swaggerDefinition = {
    openapi: '3.0.0',
    info: {
        title: 'NAE IT Technology Test Sheet API',
        version: '1.0.0',
        description: `
      Complete API documentation for the NAE IT Technology Test Sheet Management System.
      
      This API provides endpoints for managing test sheets, users, authentication, 
      PDF generation, search, notifications, and audit logging.
      
      ## Features
      - Test sheet CRUD operations
      - User authentication and profile management
      - Advanced search and filtering
      - PDF generation and export
      - Email notifications
      - Comprehensive audit logging
      
      ## Authentication
      All endpoints (except login) require authentication via session cookies.
      Use the POST /api/auth/login endpoint to authenticate.
    `,
        contact: {
            name: 'NAE IT Technology',
            email: 'support@naeit.tech',
        },
        license: {
            name: 'MIT',
            url: 'https://opensource.org/licenses/MIT',
        },
    },
    servers: [
        {
            url: 'http://192.168.1.194:5002',
            description: 'Development server',
        },
        {
            url: 'https://api.naeit.tech',
            description: 'Production server',
        },
    ],
    tags: [
        {
            name: 'Authentication',
            description: 'User authentication and session management',
        },
        {
            name: 'Test Sheets',
            description: 'Test sheet CRUD operations',
        },
        {
            name: 'Search',
            description: 'Advanced search and filtering',
        },
        {
            name: 'PDF',
            description: 'PDF generation and export',
        },
        {
            name: 'Notifications',
            description: 'Email notification management',
        },
        {
            name: 'Audit',
            description: 'Audit log access and management',
        },
        {
            name: 'Google Sheets',
            description: 'Google Sheets integration',
        },
    ],
    components: {
        securitySchemes: {
            sessionAuth: {
                type: 'apiKey',
                in: 'cookie',
                name: 'connect.sid',
                description: 'Session cookie authentication',
            },
        },
        schemas: {
            User: {
                type: 'object',
                properties: {
                    id: {
                        type: 'string',
                        description: 'Unique user identifier',
                        example: 'abc123def456',
                    },
                    email: {
                        type: 'string',
                        format: 'email',
                        description: 'User email address',
                        example: 'user@example.com',
                    },
                    firstName: {
                        type: 'string',
                        description: 'User first name',
                        example: 'John',
                    },
                    lastName: {
                        type: 'string',
                        description: 'User last name',
                        example: 'Doe',
                    },
                    profileImageUrl: {
                        type: 'string',
                        format: 'uri',
                        description: 'Profile image URL',
                        example: 'https://example.com/avatar.jpg',
                    },
                    userNumber: {
                        type: 'integer',
                        description: 'User number for reference generation',
                        example: 1,
                    },
                    createdAt: {
                        type: 'integer',
                        description: 'Unix timestamp of creation',
                        example: 1699123456,
                    },
                    updatedAt: {
                        type: 'integer',
                        description: 'Unix timestamp of last update',
                        example: 1699123456,
                    },
                },
            },
            TestSheet: {
                type: 'object',
                properties: {
                    id: {
                        type: 'string',
                        description: 'Unique test sheet identifier',
                        example: 'test123',
                    },
                    userId: {
                        type: 'string',
                        description: 'ID of user who created the test sheet',
                        example: 'user123',
                    },
                    techReference: {
                        type: 'string',
                        description: 'Technical reference number',
                        example: 'TS391703-11-2025 13:07',
                    },
                    adminReference: {
                        type: 'string',
                        description: 'Admin reference number',
                        example: 'CG01-CSM S64-Zi12441640',
                    },
                    customer: {
                        type: 'string',
                        description: 'Customer name',
                        example: 'Acme Corporation',
                    },
                    plantName: {
                        type: 'string',
                        description: 'Plant/site name',
                        example: 'Main Warehouse',
                    },
                    Test: {
                        type: 'string',
                        description: 'Overall test status',
                        enum: ['Test OK', 'Failed', 'N/A'],
                        example: 'Test OK',
                    },
                    isDraft: {
                        type: 'integer',
                        description: 'Whether this is a draft (0 = submitted, 1 = draft)',
                        enum: [0, 1],
                        example: 0,
                    },
                    createdAt: {
                        type: 'integer',
                        description: 'Unix timestamp of creation',
                        example: 1699123456,
                    },
                    updatedAt: {
                        type: 'integer',
                        description: 'Unix timestamp of last update',
                        example: 1699123456,
                    },
                },
            },
            AuditLog: {
                type: 'object',
                properties: {
                    id: {
                        type: 'string',
                        description: 'Unique audit log identifier',
                        example: 'audit123',
                    },
                    userId: {
                        type: 'string',
                        description: 'ID of user who performed the action',
                        example: 'user123',
                    },
                    userEmail: {
                        type: 'string',
                        format: 'email',
                        description: 'Email of user who performed the action',
                        example: 'user@example.com',
                    },
                    userName: {
                        type: 'string',
                        description: 'Name of user who performed the action',
                        example: 'John Doe',
                    },
                    action: {
                        type: 'string',
                        description: 'Type of action performed',
                        enum: ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'VIEW', 'EXPORT', 'SEARCH'],
                        example: 'CREATE',
                    },
                    entity: {
                        type: 'string',
                        description: 'Type of entity affected',
                        enum: ['test_sheets', 'users', 'test_items', 'test_templates', 'audit_logs'],
                        example: 'test_sheets',
                    },
                    entityId: {
                        type: 'string',
                        description: 'ID of affected entity',
                        example: 'test123',
                    },
                    description: {
                        type: 'string',
                        description: 'Human-readable description of the action',
                        example: 'Created test sheet: TS391703-11-2025',
                    },
                    severity: {
                        type: 'string',
                        description: 'Severity level',
                        enum: ['info', 'warning', 'error', 'critical'],
                        default: 'info',
                        example: 'info',
                    },
                    timestamp: {
                        type: 'integer',
                        description: 'Unix timestamp of the action',
                        example: 1699123456,
                    },
                },
            },
            Error: {
                type: 'object',
                properties: {
                    error: {
                        type: 'string',
                        description: 'Error message',
                        example: 'Resource not found',
                    },
                    success: {
                        type: 'boolean',
                        description: 'Always false for errors',
                        example: false,
                    },
                },
            },
            Success: {
                type: 'object',
                properties: {
                    success: {
                        type: 'boolean',
                        description: 'Always true for successful operations',
                        example: true,
                    },
                    message: {
                        type: 'string',
                        description: 'Success message',
                        example: 'Operation completed successfully',
                    },
                },
            },
        },
        responses: {
            Unauthorized: {
                description: 'Not authenticated',
                content: {
                    'application/json': {
                        schema: {
                            $ref: '#/components/schemas/Error',
                        },
                        example: {
                            error: 'Not authenticated',
                            success: false,
                        },
                    },
                },
            },
            NotFound: {
                description: 'Resource not found',
                content: {
                    'application/json': {
                        schema: {
                            $ref: '#/components/schemas/Error',
                        },
                        example: {
                            error: 'Resource not found',
                            success: false,
                        },
                    },
                },
            },
            BadRequest: {
                description: 'Invalid request parameters',
                content: {
                    'application/json': {
                        schema: {
                            $ref: '#/components/schemas/Error',
                        },
                        example: {
                            error: 'Invalid request parameters',
                            success: false,
                        },
                    },
                },
            },
            ServerError: {
                description: 'Internal server error',
                content: {
                    'application/json': {
                        schema: {
                            $ref: '#/components/schemas/Error',
                        },
                        example: {
                            error: 'Internal server error',
                            success: false,
                        },
                    },
                },
            },
        },
    },
    security: [
        {
            sessionAuth: [],
        },
    ],
};

const options = {
    swaggerDefinition,
    apis: [
        './server/routes/*.ts',
        './server/simpleRoutes.ts',
        './server/swagger-docs.ts', // Additional documentation file
    ],
};

export const swaggerSpec = swaggerJSDoc(options);
