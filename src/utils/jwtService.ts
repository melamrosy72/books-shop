import 'dotenv/config';
import jwt from 'jsonwebtoken';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "access_secret";
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "refresh_secret";

export function generateAccessToken(userId: number): string {
    return jwt.sign(
        { userId },
        ACCESS_SECRET,
        { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN } as jwt.SignOptions
    );
}
export function generateRefreshToken(userId: number): string {
    return jwt.sign(
        { userId },
        REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN } as jwt.SignOptions
    );
}


export function verifyAccessToken(token: string) {
    return jwt.verify(token, ACCESS_SECRET) as { userId: string; exp: number };
}

export function verifyRefreshToken(token: string) {
    return jwt.verify(token, REFRESH_SECRET) as { userId: string; exp: number };
}