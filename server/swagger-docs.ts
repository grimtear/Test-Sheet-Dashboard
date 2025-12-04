/**
 * Swagger API Documentation - Endpoint Definitions
 * 
 * This file contains JSDoc annotations for all API endpoints.
 * These are parsed by swagger-jsdoc to generate the OpenAPI specification.
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: User login
 *     description: Authenticate user and create session
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: User logout
 *     description: End user session and log out
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

/**
 * @swagger
 * /api/auth/user:
 *   get:
 *     summary: Get current user
 *     description: Retrieve authenticated user's information
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: User information
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

/**
 * @swagger
 * /api/auth/complete-profile:
 *   post:
 *     summary: Complete user profile
 *     description: Add first name and last name to user profile
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: John
 *               lastName:
 *                 type: string
 *                 example: Doe
 *     responses:
 *       200:
 *         description: Profile updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

/**
 * @swagger
 * /api/test-sheets:
 *   get:
 *     summary: Get all test sheets
 *     description: Retrieve all test sheets for the authenticated user
 *     tags: [Test Sheets]
 *     responses:
 *       200:
 *         description: List of test sheets
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TestSheet'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 *   post:
 *     summary: Create test sheet
 *     description: Create a new test sheet
 *     tags: [Test Sheets]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customer
 *               - plantName
 *             properties:
 *               customer:
 *                 type: string
 *                 example: Acme Corporation
 *               plantName:
 *                 type: string
 *                 example: Main Warehouse
 *               vehicleMake:
 *                 type: string
 *                 example: Toyota
 *               Test:
 *                 type: string
 *                 enum: [Test OK, Failed, N/A]
 *                 example: Test OK
 *               isDraft:
 *                 type: integer
 *                 enum: [0, 1]
 *                 example: 0
 *     responses:
 *       200:
 *         description: Test sheet created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TestSheet'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

/**
 * @swagger
 * /api/test-sheets/recent:
 *   get:
 *     summary: Get recent test sheets
 *     description: Retrieve the 5 most recent test sheets for the authenticated user
 *     tags: [Test Sheets]
 *     responses:
 *       200:
 *         description: List of recent test sheets
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TestSheet'
 *               maxItems: 5
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

/**
 * @swagger
 * /api/test-sheets/stats:
 *   get:
 *     summary: Get test sheet statistics
 *     description: Retrieve statistics about test sheets for the authenticated user
 *     tags: [Test Sheets]
 *     responses:
 *       200:
 *         description: Test sheet statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                   description: Total number of test sheets
 *                   example: 150
 *                 thisMonth:
 *                   type: integer
 *                   description: Test sheets created this month
 *                   example: 25
 *                 recent:
 *                   type: integer
 *                   description: Test sheets created in last 7 days
 *                   example: 8
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

/**
 * @swagger
 * /api/test-sheets/{id}:
 *   get:
 *     summary: Get test sheet by ID
 *     description: Retrieve a specific test sheet by its ID
 *     tags: [Test Sheets]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Test sheet ID
 *         example: test123
 *     responses:
 *       200:
 *         description: Test sheet details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TestSheet'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

/**
 * @swagger
 * /api/search/test-sheets:
 *   post:
 *     summary: Search test sheets
 *     description: Search and filter test sheets with advanced criteria
 *     tags: [Search]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               query:
 *                 type: string
 *                 description: Search query string
 *                 example: Toyota
 *               filters:
 *                 type: object
 *                 description: Filter criteria
 *                 properties:
 *                   customer:
 *                     type: string
 *                   plantName:
 *                     type: string
 *                   Test:
 *                     type: string
 *                     enum: [Test OK, Failed, N/A]
 *                   isDraft:
 *                     type: integer
 *                     enum: [0, 1]
 *               page:
 *                 type: integer
 *                 minimum: 1
 *                 default: 1
 *                 example: 1
 *               limit:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 100
 *                 default: 20
 *                 example: 20
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 results:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TestSheet'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     hasMore:
 *                       type: boolean
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

/**
 * @swagger
 * /api/pdf/generate:
 *   post:
 *     summary: Generate PDF
 *     description: Generate a PDF from test sheet data
 *     tags: [PDF]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - testSheetId
 *             properties:
 *               testSheetId:
 *                 type: string
 *                 description: ID of test sheet to generate PDF for
 *                 example: test123
 *               options:
 *                 type: object
 *                 description: PDF generation options
 *                 properties:
 *                   format:
 *                     type: string
 *                     enum: [A4, Letter]
 *                     default: A4
 *                   landscape:
 *                     type: boolean
 *                     default: false
 *     responses:
 *       200:
 *         description: PDF generated successfully
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

/**
 * @swagger
 * /api/notifications/test-sheet/{id}/completed:
 *   post:
 *     summary: Send completion notification
 *     description: Send email notification for completed test sheet
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Test sheet ID
 *     responses:
 *       200:
 *         description: Notification sent
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

/**
 * @swagger
 * /api/audit/logs:
 *   get:
 *     summary: Get audit logs
 *     description: Retrieve audit logs with filtering and pagination
 *     tags: [Audit]
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filter by user ID
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *           enum: [CREATE, UPDATE, DELETE, LOGIN, LOGOUT, VIEW, EXPORT, SEARCH]
 *         description: Filter by action type
 *       - in: query
 *         name: entity
 *         schema:
 *           type: string
 *           enum: [test_sheets, users, test_items, test_templates, audit_logs]
 *         description: Filter by entity type
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: Results per page
 *     responses:
 *       200:
 *         description: Audit logs retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 logs:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AuditLog'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     hasMore:
 *                       type: boolean
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

/**
 * @swagger
 * /api/audit/stats:
 *   get:
 *     summary: Get audit statistics
 *     description: Retrieve statistics about audit logs
 *     tags: [Audit]
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filter by user ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: integer
 *         description: Start date (Unix timestamp)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: integer
 *         description: End date (Unix timestamp)
 *     responses:
 *       200:
 *         description: Audit statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 stats:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     byAction:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           action:
 *                             type: string
 *                           count:
 *                             type: integer
 *                     byEntity:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           entity:
 *                             type: string
 *                           count:
 *                             type: integer
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check
 *     description: Check API health status
 *     tags: [System]
 *     security: []
 *     responses:
 *       200:
 *         description: API is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: 2025-11-06T12:00:00.000Z
 */

/**
 * @swagger
 * /api/google-sheets/summary:
 *   get:
 *     summary: Get Google Sheets summary
 *     description: Retrieve summary data from Google Sheets
 *     tags: [Google Sheets]
 *     responses:
 *       200:
 *         description: Summary data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalRows:
 *                   type: integer
 *                   example: 1500
 *                 plantCounts:
 *                   type: object
 *                   additionalProperties:
 *                     type: integer
 *                   example:
 *                     "Main Warehouse": 500
 *                     "North Facility": 300
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

export default {};
