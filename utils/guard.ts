import { Request, Response, NextFunction } from "express";

export function isLoggedIn (req: Request, res: Response, next: NextFunction) {
    if (req.session.username) {
        next();
    } else {
        res.status(400).json({ message: "access denied"})
    }
}