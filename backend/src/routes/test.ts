import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

const router = Router();

// Test endpoint to debug JWT
router.post('/verify-token', (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

    console.log('JWT_SECRET from env:', JWT_SECRET);
    console.log('Token received:', token);

    const decoded = jwt.verify(token, JWT_SECRET);

    res.json({
      success: true,
      decoded,
      secret: JWT_SECRET.substring(0, 10) + '...'
    });
  } catch (error: any) {
    res.json({
      success: false,
      error: error.message,
      secret: (process.env.JWT_SECRET || 'your-secret-key').substring(0, 10) + '...'
    });
  }
});

export default router;
