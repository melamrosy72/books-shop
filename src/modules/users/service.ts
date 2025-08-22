import { db } from "../../db/index.js"
import { users } from "../../db/schema.js"
import bcrypt from 'bcrypt';

import { and, eq, not, or, SQL } from "drizzle-orm"
import { hashPassword, comparePassword } from "../../utils/bcryptService.js";
import { ClientError } from "../../utils/errorHandler.js";
import type { ChangePasswordInput, UpdateProfileInput } from "./validation.js";


export const getUserById = async (id: number) => {
    return db.query.users.findFirst({
        where: eq(users.id, id
        )
    })
}

export const updateUser = async (id: number, data: UpdateProfileInput) => {

    // Check Email Existence
    if (data.email) {
        const existingEmail = await db.query.users.findFirst({
            where: and(
                eq(users.email, data.email),
                not(eq(users.id, id))   // exclude current user
            )
        })
        if (existingEmail) throw new ClientError("Email already exists", 409)
    }

    // Check Username Existence
    if (data.username) {
        const existingUsername = await db.query.users.findFirst({
            where: and(
                eq(users.username, data.username),
                not(eq(users.id, id)) // exclude current user 
            )
        })
        if (existingUsername) throw new ClientError("Username already exists", 409)
    }

    // Build Update Data
    const updateData: UpdateProfileInput = {};

    if (data.username) updateData.username = data.username;
    if (data.email) updateData.email = data.email;

    if (Object.keys(updateData).length === 0) {
        throw new ClientError("No valid fields to update", 400);
    }

    updateData.updatedAt = new Date();
    // Update user
    const [updatedUser] = await db.update(users)
        .set(updateData)
        .where(eq(users.id, id))
        .returning({
            id: users.id,
            email: users.email,
            username: users.username,
            createdAt: users.createdAt,
            updatedAt: users.updatedAt
        });

    return updatedUser;
}

export const changePassword = async (id: number, data: ChangePasswordInput) => {
    return await db.update(users).set({
        password: await hashPassword(data.newPassword),
        updatedAt: new Date()
    }).where(eq(users.id, id))
}