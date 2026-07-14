import swaggerJSDoc from 'swagger-jsdoc';

// Bonus feature — Swagger / OpenAPI docs, served at /api/docs.
export const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'AI-Ready Job Portal API',
      version: '1.0.0',
      description:
        'Full Stack Engineer assessment — job portal with authentication, job CRUD, ' +
        'applications, job scraping, admin dashboard, and AI resume matching.',
    },
    servers: [{ url: '/api', description: 'API root' }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
    tags: [
      { name: 'Auth' },
      { name: 'Users' },
      { name: 'Jobs' },
      { name: 'Applications' },
      { name: 'Scraper' },
      { name: 'Admin' },
      { name: 'AI' },
    ],
  },
  apis: ['./src/modules/**/*.routes.ts', './dist/modules/**/*.routes.js'],
});
