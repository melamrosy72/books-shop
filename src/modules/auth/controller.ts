import { type Context } from "hono"
import * as authService from "./service.js"
import { forgetPasswordSchema, loginSchema, registerSchema, resetPasswordSchema } from "./validation.js"
import z from "zod";
import { failureResponse, successResponse } from "../../utils/response.js";
import { generateToken } from "../../utils/jwtService.js";
import { comparePassword } from "../../utils/bcryptService.js";

export const register = async (c: Context) => {
    const body = await c.req.json()
    // validating req data
    const validatedData = registerSchema.parse(body)
    // check user existence
    const existingUser = await authService.findUserByEmailOrUsername(validatedData.email, validatedData.username)
    if (existingUser) {
        return c.json({ success: false, error: 'User already exists' }, 409);
    }
    // create user
    const user = await authService.registerUser(validatedData)
    // create token
    const token = generateToken(user.user.id)

    return c.json({ success: true, token }, 201)

}

export const login = async (c: Context) => {
    const body = await c.req.json();
    const validatedData = loginSchema.parse(body);

    // Find user
    const user = await authService.findUserByEmailOrUsername(validatedData.login, validatedData.login);
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

    // Generate token
    const token = generateToken(user.id);

    // Remove password from response
    const { password, ...userWithoutPassword } = user;

    return c.json({
        success: true,
        data: {
            user: userWithoutPassword,
            token,
        },
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
    // handle logout logic
    console.log('logged out!')
};
