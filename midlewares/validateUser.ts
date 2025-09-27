import { Request, Response, NextFunction } from 'express';

export function validateUser(req: Request, res: Response, next: NextFunction) {
    if (!req.user?.id) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
}