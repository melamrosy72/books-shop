import { Hono } from "hono"
import * as authController from "./controller.js"

export const authRoutes = new Hono()

authRoutes.post("/register", authController.register)
authRoutes.post("/login", authController.login)

// authRoutes.post("/logout", authController.logout)

authRoutes.post("/forgot-password", authController.forgotPassword)
authRoutes.post("/reset-password", authController.resetPassword)
