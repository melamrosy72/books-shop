import { Hono } from "hono"
import * as authController from "./controller.js"
import { authMiddleware } from "../../middleware/authChecker.js"

export const authRoutes = new Hono()

authRoutes.post("/register", authController.register)
authRoutes.post("/login", authController.login)
authRoutes.post("/refresh", authController.refresh)


authRoutes.post("/logout", authMiddleware, authController.logout)

authRoutes.post("/forgot-password", authController.forgotPassword)
authRoutes.post("/reset-password", authController.resetPassword)
