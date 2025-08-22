import 'dotenv/config';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';


export function generateToken(userId: number): string {
    try {
        if (!process.env.JWT_SECRET) {
            throw new Error('JWT_SECRET is not defined');
        }
        if (!process.env.JWT_EXPIRES_IN) {
            throw new Error('JWT_EXPIRES_IN is not defined');
        }

        const jti = randomUUID();
        const token = jwt.sign(
            { userId, jti },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN } as jwt.SignOptions
        );
        return token;
    } catch (error) {
        console.error('Error generating token:', error);
        throw new Error('Failed to generate token');
    }
}


export function verifyToken(token: string) {
    return jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; jti: string; exp: number };
}