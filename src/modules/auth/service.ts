import { db } from '../../db/index.js';
import { users } from '../../db/schema.js';

import { and, eq, or } from 'drizzle-orm';
import { type RegisterInput, type resetPasswordInput } from './validation.js';
import { hashPassword } from '../../utils/bcryptService.js';
import { ClientError } from '../../utils/errorHandler.js';

export const registerUser = async (data: RegisterInput) => {
  const hashedPassword = await hashPassword(data.password);

  const [user] = await db
    .insert(users)
    .values({
      username: data.username,
      email: data.email,
      password: hashedPassword,
    })
    .returning({
      id: users.id,
      email: users.email,
      username: users.username,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    });

  return user;
};

export const findUserByEmailOrUsername = async ({
  email,
  username,
}: {
  email?: string;
  username?: string;
}) => {
  if (!email && !username) {
    throw new ClientError('Must provide email or username');
  }

  const conditions = [];
  if (email) conditions.push(eq(users.email, email));
  if (username) conditions.push(eq(users.username, username));
  const user = await db.query.users.findFirst({
    where: or(...conditions),
  });
  return user;
};

export const findUserById = async (userId: number) => {
  return db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: {
      password: false,
    },
  });
};

export const forgotPassword = async (email: string) => {
  // check user existence
  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, email),
  });
  if (!existingUser) throw new ClientError('User Not Found');
  // static otp for demo
  const otp = '123456'; // (Math.floor(100000 + Math.random() * 900000)).toString();
  await db
    .update(users)
    .set({
      resetPassOtp: otp,
    })
    .where(eq(users.id, existingUser.id));

  return {};
};

export const resetPassword = async (data: resetPasswordInput) => {
  // check user existence
  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, data.email),
  });
  console.log(existingUser, 'existingUser');

  if (!existingUser) throw new ClientError('User Not Found', 404);

  // check if user has requested for password reset
  if (!existingUser.resetPassOtp)
    throw new ClientError('User Has Not Requested For Password Reset');

  // check if otp is valid
  if (existingUser.resetPassOtp !== data.otp) throw new ClientError('Invalid OTP');

  const hashedPassword = await hashPassword(data.newPassword);

  await db
    .update(users)
    .set({ password: hashedPassword, resetPassOtp: null })
    .where(and(eq(users.email, data.email), eq(users.resetPassOtp, data.otp)));
};
