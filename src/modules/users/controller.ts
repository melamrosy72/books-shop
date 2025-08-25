import { type Context } from 'hono';
import * as usersService from './service.js';
import { failureResponse, successResponse } from '../../utils/response.js';

import { comparePassword } from '../../utils/bcryptService.js';

import { changePasswordSchema, updateProfileSchema } from './validation.js';

// Get Profile
export const getProfile = async (c: Context) => {
  const userId = c.get('user').id;
  const user = await usersService.getUserById(userId);
  if (!user) return failureResponse(c, 'User not found', 404);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...userWithoutPassword } = user;
  return successResponse(c, userWithoutPassword);
};

//  EditProfile : allowed editing username and email
export const editProfile = async (c: Context) => {
  const userId = c.get('user').id;
  const body = await c.req.json();
  const validatedData = updateProfileSchema.parse(body);
  const user = await usersService.getUserById(userId);
  if (!user) return failureResponse(c, 'User not found', 404);
  const updatedUser = await usersService.updateUser(userId, validatedData);
  return successResponse(c, updatedUser);
};

//changePassword
export const changePassword = async (c: Context) => {
  const userId = c.get('user').id;
  // const body = await c.req.json();
  // const validatedData = changePasswordSchema.parse(body);
  const { oldPassword, newPassword } = changePasswordSchema.parse(await c.req.json());

  const user = await usersService.getUserById(userId);
  if (!user) return failureResponse(c, 'User not found', 404);
  // check old password
  const isValidPassword = await comparePassword(oldPassword, user.password);
  if (!isValidPassword) return failureResponse(c, 'old password is not valid', 401);
  // update password
  await usersService.changePassword(userId, newPassword);
  return c.json({ success: true, message: 'Password Has Been Changed Successfully' });
};
