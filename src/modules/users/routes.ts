import { Hono } from "hono"
import * as usersController from "./controller.js"
import { authMiddleware } from '../../middleware/authChecker.js';
export const usersRoutes = new Hono()

// ● API for user profile details
usersRoutes.get("/profile", authMiddleware, usersController.getProfile)
// ● API for editing user details
usersRoutes.patch("/edit-profile", authMiddleware, usersController.editProfile)
// ● API for changing the user password
usersRoutes.patch("/change-password", authMiddleware, usersController.changePassword)



