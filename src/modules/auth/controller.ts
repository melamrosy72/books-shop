import { type Context } from "hono"
import * as authService from "./service.js"
import { forgetPasswordSchema, loginSchema, registerSchema, resetPasswordSchema } from "./validation.js"
import { failureResponse, successResponse } from "../../utils/response.js";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../../utils/jwtService.js";
import { comparePassword } from "../../utils/bcryptService.js";
import redis from "../../config/redis.js";

export const register = async (c: Context) => {
    const body = await c.req.json()
    // validating req data
    const validatedData = registerSchema.parse(body)
    // check user existence
    const existingUser = await authService.findUserByEmailOrUsername(
        {
            email: validatedData.email,
            username: validatedData.username
        }
    )
    if (existingUser) {
        return c.json({ success: false, error: 'User already exists' }, 409);
    }
    // create user
    const user = await authService.registerUser(validatedData)
    // create token
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    return c.json({ success: true, accessToken, refreshToken }, 201)

}

export const login = async (c: Context) => {
    const body = await c.req.json();
    console.log(body);

    const validatedData = loginSchema.parse(body);

    // Find user
    const user = await authService.findUserByEmailOrUsername({
        email: validatedData.login,
        username: validatedData.login
    });
    if (!user) {
        return c.json({ success: false, error: 'Invalid credentials' }, 401);
    }

    // Verify password
    const isValidPassword = await comparePassword(
        validatedData.password,
        user.password
    );

    if (!isValidPassword) {
        return c.json({ success: false, error: 'Invalid credentials' }, 401);
    }

    // Generate tokens
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Store refresh token in Redis for 7 days
    await redis.set(`refresh:${user.id}`, refreshToken, "EX", 7 * 24 * 60 * 60);

    return c.json({
        username: user.username,
        accessToken,
        refreshToken,

    });

};

export const forgotPassword = async (c: Context) => {

    const body = await c.req.json()
    const validatedData = forgetPasswordSchema.parse(body)
    // generate otp
    await authService.forgotPassword(validatedData.email)
    //      In Real Life Scenario, We will handle email sending here with a dynamic otp & expiration time
    return c.json({ success: true, message: 'otp generated, you can reset password now with the static otp' }) // just return it for demo


}

export const resetPassword = async (c: Context) => {
    const body = await c.req.json()
    const validatedData = resetPasswordSchema.parse(body)
    await authService.resetPassword(validatedData)
    return c.json({ message: "Password reset successful" })
}


export const logout = async (c: Context) => {
    const { refreshToken } = await c.req.json();

    const decoded: any = verifyRefreshToken(refreshToken);
    await redis.del(`refresh:${decoded.userId}`);

    return c.json({ success: true, message: "Logged out" });
};



export const refresh = async (c: Context) => {

    const { refreshToken } = await c.req.json();

    try {
        const decoded: any = verifyRefreshToken(refreshToken);
        // Check in Redis
        const storedToken = await redis.get(`refresh:${decoded.userId}`);

        if (storedToken !== refreshToken) {
            return c.json({ success: false, error: "Invalid refresh token" }, 401);
        }

        // Generate new tokens
        const newAccessToken = generateAccessToken(decoded.userId);
        const newRefreshToken = generateRefreshToken(decoded.userId);

        // Update Redis with new refresh token (rotate)
        await redis.set(`refresh:${decoded.userId}`, newRefreshToken, "EX", 7 * 24 * 60 * 60);

        return c.json({
            success: true,
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
        });
    } catch (err) {
        return c.json({ success: false, error: "Invalid refresh token" }, 401);
    }
};