import { type Context } from "hono"
import * as usersService from "./service.js"
import { failureResponse, successResponse } from "../../utils/response.js";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../../utils/jwtService.js";
import { comparePassword } from "../../utils/bcryptService.js";
import redis from "../../config/redis.js";
import { changePasswordSchema, updateProfileSchema } from "./validation.js";


// Get Profile
export const getProfile = async (c: Context) => {
    const userId = c.get('user').id
    const user = await usersService.getUserById(userId)
    if (!user) return c.json({ success: false, error: "User not found" }, 404)
    const { password, ...userWithoutPassword } = user
    return c.json({ success: true, data: userWithoutPassword })
}


//editProfile : basic details
export const editProfile = async (c: Context) => {
    const userId = c.get('user').id
    const body = await c.req.json()
    const validatedData = updateProfileSchema.parse(body)
    const user = await usersService.getUserById(userId)
    if (!user) return c.json({ success: false, error: "User not found" }, 404)
    const updatedUser = await usersService.updateUser(userId, validatedData)
    return c.json({ success: true, data: updatedUser })
}


//changePassword  
export const changePassword = async (c: Context) => {
    const userId = c.get('user').id
    const body = await c.req.json()
    const validatedData = changePasswordSchema.parse(body)
    const user = await usersService.getUserById(userId)
    if (!user) return c.json({ success: false, error: "User not found" }, 404)
    // check old password
    const isValidPassword = await comparePassword(validatedData.oldPassword, user.password)
    if (!isValidPassword) return c.json({ success: false, error: "old password is not valid" }, 401)
    // update password
    await usersService.changePassword(userId, validatedData)
    return c.json({ success: true, message: 'Password Has Been Changed Successfully' })
}