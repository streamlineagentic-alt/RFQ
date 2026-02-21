import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import rfqRoutes from './routes/rfq';
import supplierRoutes from './routes/suppliers';
import categoryRoutes from './routes/categories';
import inventoryRoutes from './routes/inventory';
import testRoutes from './routes/test';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3001;
const API_VERSION = process.env.API_VERSION || 'v1';

// Middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } })); // Security headers
const allowedOrigin = process.env.FRONTEND_URL;
app.use(cors({
  origin: allowedOrigin === '*' || !allowedOrigin ? true : allowedOrigin,
  credentials: true
}));
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API routes
app.use(`/api/${API_VERSION}/auth`, authRoutes);
app.use(`/api/${API_VERSION}/rfqs`, rfqRoutes);
app.use(`/api/${API_VERSION}/suppliers`, supplierRoutes);
app.use(`/api/${API_VERSION}/categories`, categoryRoutes);
app.use(`/api/${API_VERSION}/inventory`, inventoryRoutes);
app.use(`/api/${API_VERSION}/test`, testRoutes);

app.get(`/api/${API_VERSION}`, (req: Request, res: Response) => {
  res.json({
    message: 'RFQ Management Platform API',
    version: API_VERSION,
    endpoints: {
      health: '/health',
      auth: `/api/${API_VERSION}/auth`,
      rfqs: `/api/${API_VERSION}/rfqs`,
      docs: `/api/${API_VERSION}/docs`
    }
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint not found'
    }
  });
});

// Error handler
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: err.message || 'Something went wrong'
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📚 API version: ${API_VERSION}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
