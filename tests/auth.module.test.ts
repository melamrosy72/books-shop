import { describe, it, expect, beforeEach, vi } from 'vitest';
import { register, login, resetPassword } from '../src/modules/auth/controller.js';
import * as authService from '../src/modules/auth/service.js';
import * as jwtService from '../src/utils/jwtService.js';
import * as bcryptService from '../src/utils/bcryptService.js';
import {
  registerSchema,
  loginSchema,
  resetPasswordSchema,
} from '../src/modules/auth/validation.js';
import { forgotPassword } from '../src/modules/auth/controller.js';
import { forgetPasswordSchema } from '../src/modules/auth/validation.js';

// Mock all dependencies
vi.mock('../src/modules/auth/service');
vi.mock('../src/utils/jwtService');
vi.mock('../src/utils/bcryptService');
vi.mock('../src/modules/auth/validation');
vi.mock('../src/utils/errorHandler');

// Mock environment variables
vi.mock('dotenv/config', () => ({}));
process.env.JWT_ACCESS_SECRET = 'test-access-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.JWT_ACCESS_EXPIRES_IN = '15m';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';

const mockRedis = {
  set: vi.fn(),
};

describe('Auth Controller - Register', () => {
  let mockContext: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock Hono context
    mockContext = {
      req: {
        json: vi.fn(),
      },
      json: vi.fn().mockReturnThis(), // Chainable
      status: vi.fn().mockReturnThis(), // Chainable for status codes
    };
  });

  describe('register', () => {
    it('should register user successfully and return tokens with 201 status', async () => {
      // Arrange
      const mockUserData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      };

      const mockValidatedData = { ...mockUserData };
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockAccessToken = 'access-token-123';
      const mockRefreshToken = 'refresh-token-456';

      // Mock implementations
      mockContext.req.json.mockResolvedValue(mockUserData);
      vi.mocked(registerSchema.parse).mockReturnValue(mockValidatedData);
      vi.mocked(authService.findUserByEmailOrUsername).mockResolvedValue(undefined);
      vi.mocked(authService.registerUser).mockResolvedValue(mockUser);
      vi.mocked(jwtService.generateAccessToken).mockReturnValue(mockAccessToken);
      vi.mocked(jwtService.generateRefreshToken).mockReturnValue(mockRefreshToken);

      // Act
      await register(mockContext);

      // Assert
      expect(mockContext.req.json).toHaveBeenCalledOnce();
      expect(registerSchema.parse).toHaveBeenCalledWith(mockUserData);
      expect(authService.findUserByEmailOrUsername).toHaveBeenCalledWith({
        email: mockValidatedData.email,
        username: mockValidatedData.username,
      });
      expect(authService.registerUser).toHaveBeenCalledWith(mockValidatedData);
      expect(jwtService.generateAccessToken).toHaveBeenCalledWith(mockUser.id);
      expect(jwtService.generateRefreshToken).toHaveBeenCalledWith(mockUser.id);
      expect(mockContext.json).toHaveBeenCalledWith(
        { success: true, accessToken: mockAccessToken, refreshToken: mockRefreshToken },
        201,
      );
    });

    it('should return 409 conflict if user already exists', async () => {
      // Arrange
      const mockUserData = {
        username: 'existinguser',
        email: 'existing@example.com',
        password: 'password123',
      };

      const mockValidatedData = { ...mockUserData };
      const existingUser = {
        id: 1,
        username: 'existinguser',
        email: 'existing@example.com',
        password: 'existingpassword', // Add this property
        resetPassOtp: null, // Add this property
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockContext.req.json.mockResolvedValue(mockUserData);
      vi.mocked(registerSchema.parse).mockReturnValue(mockValidatedData);
      vi.mocked(authService.findUserByEmailOrUsername).mockResolvedValue(existingUser);

      // Act
      await register(mockContext);

      // Assert
      expect(authService.findUserByEmailOrUsername).toHaveBeenCalledOnce();
      expect(authService.registerUser).not.toHaveBeenCalled();
      expect(jwtService.generateAccessToken).not.toHaveBeenCalled();
      expect(jwtService.generateRefreshToken).not.toHaveBeenCalled();
      expect(mockContext.json).toHaveBeenCalledWith(
        { success: false, error: 'User already exists' },
        409,
      );
    });

    it('should handle validation errors from Zod schema', async () => {
      // Arrange
      const mockUserData = { invalid: 'data' };
      const validationError = new Error('Validation failed: Invalid email');

      mockContext.req.json.mockResolvedValue(mockUserData);
      vi.mocked(registerSchema.parse).mockImplementation(() => {
        throw validationError;
      });

      // Act & Assert
      await expect(register(mockContext)).rejects.toThrow('Validation failed: Invalid email');
      expect(authService.findUserByEmailOrUsername).not.toHaveBeenCalled();
    });

    it('should handle service errors during user registration', async () => {
      // Arrange
      const mockUserData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      };

      const mockValidatedData = { ...mockUserData };
      const serviceError = new Error('Database connection failed');

      mockContext.req.json.mockResolvedValue(mockUserData);
      vi.mocked(registerSchema.parse).mockReturnValue(mockValidatedData);
      vi.mocked(authService.findUserByEmailOrUsername).mockResolvedValue(undefined);
      vi.mocked(authService.registerUser).mockRejectedValue(serviceError);

      // Act & Assert
      await expect(register(mockContext)).rejects.toThrow('Database connection failed');
    });

    it('should handle JSON parsing errors', async () => {
      // Arrange
      const jsonError = new Error('Invalid JSON');
      mockContext.req.json.mockRejectedValue(jsonError);

      // Act & Assert
      await expect(register(mockContext)).rejects.toThrow('Invalid JSON');
      expect(registerSchema.parse).not.toHaveBeenCalled();
    });
  });
});

describe('Auth Controller - Login', () => {
  let mockContext: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock Hono context
    mockContext = {
      req: {
        json: vi.fn(),
      },
      json: vi.fn().mockReturnThis(),
    };
  });

  describe('login', () => {
    it('should login user successfully and return tokens with user data', async () => {
      // Arrange
      const mockLoginData = {
        login: 'testuser', // can be email or username
        password: 'password123',
      };

      const mockValidatedData = { ...mockLoginData };
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword123', // hashed password
        resetPassOtp: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockAccessToken = 'access-token-123';
      const mockRefreshToken = 'refresh-token-456';

      // Mock implementations
      mockContext.req.json.mockResolvedValue(mockLoginData);
      vi.mocked(loginSchema.parse).mockReturnValue(mockValidatedData);
      vi.mocked(authService.findUserByEmailOrUsername).mockResolvedValue(mockUser);
      vi.mocked(bcryptService.comparePassword).mockResolvedValue(true);
      vi.mocked(jwtService.generateAccessToken).mockReturnValue(mockAccessToken);
      vi.mocked(jwtService.generateRefreshToken).mockReturnValue(mockRefreshToken);
      mockRedis.set.mockResolvedValue('OK');

      // Act
      await login(mockContext);

      // Assert
      expect(mockContext.req.json).toHaveBeenCalledOnce();
      expect(loginSchema.parse).toHaveBeenCalledWith(mockLoginData);
      expect(authService.findUserByEmailOrUsername).toHaveBeenCalledWith({
        email: mockValidatedData.login,
        username: mockValidatedData.login,
      });
      expect(bcryptService.comparePassword).toHaveBeenCalledWith(
        mockValidatedData.password,
        mockUser.password,
      );
      expect(jwtService.generateAccessToken).toHaveBeenCalledWith(mockUser.id);
      expect(jwtService.generateRefreshToken).toHaveBeenCalledWith(mockUser.id);
      expect(mockContext.json).toHaveBeenCalledWith({
        username: mockUser.username,
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
      });
    });

    it('should return 401 if user not found', async () => {
      // Arrange
      const mockLoginData = {
        login: 'nonexistentuser',
        password: 'password123',
      };

      const mockValidatedData = { ...mockLoginData };

      mockContext.req.json.mockResolvedValue(mockLoginData);
      vi.mocked(loginSchema.parse).mockReturnValue(mockValidatedData);
      vi.mocked(authService.findUserByEmailOrUsername).mockResolvedValue(undefined);

      // Act
      await login(mockContext);

      // Assert
      expect(authService.findUserByEmailOrUsername).toHaveBeenCalled();
      expect(bcryptService.comparePassword).not.toHaveBeenCalled();
      expect(jwtService.generateAccessToken).not.toHaveBeenCalled();
      expect(mockRedis.set).not.toHaveBeenCalled();
      expect(mockContext.json).toHaveBeenCalledWith(
        { success: false, error: 'Invalid credentials' },
        401,
      );
    });

    it('should return 401 if password is incorrect', async () => {
      // Arrange
      const mockLoginData = {
        login: 'testuser',
        password: 'wrongpassword',
      };

      const mockValidatedData = { ...mockLoginData };
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword123',
        resetPassOtp: null,

        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockContext.req.json.mockResolvedValue(mockLoginData);
      vi.mocked(loginSchema.parse).mockReturnValue(mockValidatedData);
      vi.mocked(authService.findUserByEmailOrUsername).mockResolvedValue(mockUser);
      vi.mocked(bcryptService.comparePassword).mockResolvedValue(false);

      // Act
      await login(mockContext);

      // Assert
      expect(bcryptService.comparePassword).toHaveBeenCalledWith(
        mockValidatedData.password,
        mockUser.password,
      );
      expect(jwtService.generateAccessToken).not.toHaveBeenCalled();
      expect(mockRedis.set).not.toHaveBeenCalled();
      expect(mockContext.json).toHaveBeenCalledWith(
        { success: false, error: 'Invalid credentials' },
        401,
      );
    });

    it('should handle validation errors from login schema', async () => {
      // Arrange
      const mockLoginData = { invalid: 'data' };
      const validationError = new Error('Validation failed: Invalid login format');

      mockContext.req.json.mockResolvedValue(mockLoginData);
      vi.mocked(loginSchema.parse).mockImplementation(() => {
        throw validationError;
      });

      // Act & Assert
      await expect(login(mockContext)).rejects.toThrow('Validation failed: Invalid login format');
      expect(authService.findUserByEmailOrUsername).not.toHaveBeenCalled();
    });

    it('should handle case where login is email', async () => {
      // Arrange
      const mockLoginData = {
        login: 'test@example.com', // email
        password: 'password123',
      };

      const mockValidatedData = { ...mockLoginData };
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword123',
        resetPassOtp: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockContext.req.json.mockResolvedValue(mockLoginData);
      vi.mocked(loginSchema.parse).mockReturnValue(mockValidatedData);
      vi.mocked(authService.findUserByEmailOrUsername).mockResolvedValue(mockUser);
      vi.mocked(bcryptService.comparePassword).mockResolvedValue(true);
      vi.mocked(jwtService.generateAccessToken).mockReturnValue('access-token');
      vi.mocked(jwtService.generateRefreshToken).mockReturnValue('refresh-token');
      mockRedis.set.mockResolvedValue('OK');

      // Act
      await login(mockContext);

      // Assert
      expect(authService.findUserByEmailOrUsername).toHaveBeenCalledWith({
        email: 'test@example.com',
        username: 'test@example.com', // Both are passed
      });
    });

    it('should handle case where login is username', async () => {
      // Arrange
      const mockLoginData = {
        login: 'testuser', // username
        password: 'password123',
      };

      const mockValidatedData = { ...mockLoginData };
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword123',
        resetPassOtp: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockContext.req.json.mockResolvedValue(mockLoginData);
      vi.mocked(loginSchema.parse).mockReturnValue(mockValidatedData);
      vi.mocked(authService.findUserByEmailOrUsername).mockResolvedValue(mockUser);
      vi.mocked(bcryptService.comparePassword).mockResolvedValue(true);
      vi.mocked(jwtService.generateAccessToken).mockReturnValue('access-token');
      vi.mocked(jwtService.generateRefreshToken).mockReturnValue('refresh-token');
      mockRedis.set.mockResolvedValue('OK');

      // Act
      await login(mockContext);

      // Assert
      expect(authService.findUserByEmailOrUsername).toHaveBeenCalledWith({
        email: 'testuser',
        username: 'testuser', // Both are passed
      });
    });
  });
});

describe('Auth Controller - Forgot Password', () => {
  let mockContext: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock Hono context
    mockContext = {
      req: {
        json: vi.fn(),
      },
      json: vi.fn().mockReturnThis(),
    };
  });

  describe('forgotPassword', () => {
    it('should generate OTP successfully and return success message', async () => {
      // Arrange
      const mockRequestData = {
        email: 'test@example.com',
      };

      const mockValidatedData = { ...mockRequestData };

      mockContext.req.json.mockResolvedValue(mockRequestData);
      vi.mocked(forgetPasswordSchema.parse).mockReturnValue(mockValidatedData);
      vi.mocked(authService.forgotPassword).mockResolvedValue({}); // void function

      // Act
      await forgotPassword(mockContext);

      // Assert
      expect(mockContext.req.json).toHaveBeenCalledOnce();
      expect(forgetPasswordSchema.parse).toHaveBeenCalledWith(mockRequestData);
      expect(authService.forgotPassword).toHaveBeenCalledWith(mockValidatedData.email);
      expect(mockContext.json).toHaveBeenCalledWith({
        success: true,
        message: 'otp generated, you can reset password now with the static otp',
      });
    });

    it('should handle validation errors from forgot password schema', async () => {
      // Arrange
      const mockRequestData = { invalid: 'data' };
      const validationError = new Error('Validation failed: Invalid email format');

      mockContext.req.json.mockResolvedValue(mockRequestData);
      vi.mocked(forgetPasswordSchema.parse).mockImplementation(() => {
        throw validationError;
      });

      // Act & Assert
      await expect(forgotPassword(mockContext)).rejects.toThrow(
        'Validation failed: Invalid email format',
      );
      expect(authService.forgotPassword).not.toHaveBeenCalled();
    });

    it('should handle service errors during OTP generation', async () => {
      // Arrange
      const mockRequestData = {
        email: 'test@example.com',
      };

      const mockValidatedData = { ...mockRequestData };
      const serviceError = new Error('Database error during OTP generation');

      mockContext.req.json.mockResolvedValue(mockRequestData);
      vi.mocked(forgetPasswordSchema.parse).mockReturnValue(mockValidatedData);
      vi.mocked(authService.forgotPassword).mockRejectedValue(serviceError);

      // Act & Assert
      await expect(forgotPassword(mockContext)).rejects.toThrow(
        'Database error during OTP generation',
      );
    });

    it('should handle JSON parsing errors', async () => {
      // Arrange
      const jsonError = new Error('Invalid JSON');
      mockContext.req.json.mockRejectedValue(jsonError);

      // Act & Assert
      await expect(forgotPassword(mockContext)).rejects.toThrow('Invalid JSON');
      expect(forgetPasswordSchema.parse).not.toHaveBeenCalled();
    });

    it('should handle empty email gracefully (though validation should catch this)', async () => {
      // Arrange
      const mockRequestData = {
        email: '', // empty string
      };

      const validationError = new Error('Email is required');

      mockContext.req.json.mockResolvedValue(mockRequestData);
      vi.mocked(forgetPasswordSchema.parse).mockImplementation(() => {
        throw validationError;
      });

      // Act & Assert
      await expect(forgotPassword(mockContext)).rejects.toThrow('Email is required');
      expect(authService.forgotPassword).not.toHaveBeenCalled();
    });
  });
});

describe('Auth Controller - Reset Password', () => {
  let mockContext: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock Hono context
    mockContext = {
      req: {
        json: vi.fn(),
      },
      json: vi.fn().mockReturnThis(),
    };
  });

  describe('resetPassword', () => {
    it('should reset password successfully and return success message', async () => {
      // Arrange
      const mockRequestData = {
        email: 'test@example.com',
        otp: '123456',
        newPassword: 'newPassword123',
        confirmPassword: 'newPassword123',
      };

      const mockValidatedData = { ...mockRequestData };

      mockContext.req.json.mockResolvedValue(mockRequestData);
      vi.mocked(resetPasswordSchema.parse).mockReturnValue(mockValidatedData);
      vi.mocked(authService.resetPassword).mockResolvedValue(undefined); // void function

      // Act
      await resetPassword(mockContext);

      // Assert
      expect(mockContext.req.json).toHaveBeenCalledOnce();
      expect(resetPasswordSchema.parse).toHaveBeenCalledWith(mockRequestData);
      expect(authService.resetPassword).toHaveBeenCalledWith(mockValidatedData);
      expect(mockContext.json).toHaveBeenCalledWith({
        success: true,
        message: 'Password reset successful',
      });
    });

    it('should handle validation errors from reset password schema', async () => {
      // Arrange
      const mockRequestData = {
        email: 'invalid-email', // invalid email
        otp: '123',
        newPassword: 'short', // too short password
      };

      const validationError = new Error(
        'Validation failed: Invalid email, OTP must be 6 digits, Password too short',
      );

      mockContext.req.json.mockResolvedValue(mockRequestData);
      vi.mocked(resetPasswordSchema.parse).mockImplementation(() => {
        throw validationError;
      });

      // Act & Assert
      await expect(resetPassword(mockContext)).rejects.toThrow(
        'Validation failed: Invalid email, OTP must be 6 digits, Password too short',
      );
      expect(authService.resetPassword).not.toHaveBeenCalled();
    });

    it('should handle service errors during password reset', async () => {
      // Arrange
      const mockRequestData = {
        email: 'test@example.com',
        otp: '123456',
        newPassword: 'newPassword123',
        confirmPassword: 'newPassword123',
      };

      const mockValidatedData = { ...mockRequestData };
      const serviceError = new Error('Invalid OTP or OTP expired');

      mockContext.req.json.mockResolvedValue(mockRequestData);
      vi.mocked(resetPasswordSchema.parse).mockReturnValue(mockValidatedData);
      vi.mocked(authService.resetPassword).mockRejectedValue(serviceError);

      // Act & Assert
      await expect(resetPassword(mockContext)).rejects.toThrow('Invalid OTP or OTP expired');
    });

    it('should handle JSON parsing errors', async () => {
      // Arrange
      const jsonError = new Error('Invalid JSON');
      mockContext.req.json.mockRejectedValue(jsonError);

      // Act & Assert
      await expect(resetPassword(mockContext)).rejects.toThrow('Invalid JSON');
      expect(resetPasswordSchema.parse).not.toHaveBeenCalled();
    });

    it('should handle missing required fields gracefully', async () => {
      // Arrange
      const mockRequestData = {
        // missing email, otp, and newPassword
      };

      const validationError = new Error('Email, OTP, and new password are required');

      mockContext.req.json.mockResolvedValue(mockRequestData);
      vi.mocked(resetPasswordSchema.parse).mockImplementation(() => {
        throw validationError;
      });

      // Act & Assert
      await expect(resetPassword(mockContext)).rejects.toThrow(
        'Email, OTP, and new password are required',
      );
      expect(authService.resetPassword).not.toHaveBeenCalled();
    });

    it('should handle weak password validation', async () => {
      // Arrange
      const mockRequestData = {
        email: 'test@example.com',
        otp: '123456',
        newPassword: 'weak', // too weak password
      };

      const validationError = new Error('Password must be at least 8 characters');

      mockContext.req.json.mockResolvedValue(mockRequestData);
      vi.mocked(resetPasswordSchema.parse).mockImplementation(() => {
        throw validationError;
      });

      // Act & Assert
      await expect(resetPassword(mockContext)).rejects.toThrow(
        'Password must be at least 8 characters',
      );
      expect(authService.resetPassword).not.toHaveBeenCalled();
    });
  });
});

describe('Auth Service - Reset Password', () => {
  describe('resetPassword', () => {
    it('should process password reset successfully', async () => {
      // Arrange
      const resetData = {
        email: 'test@example.com',
        otp: '123456',
        newPassword: 'newPassword123',
        confirmPassword: 'newPassword123',
      };

      vi.mocked(authService.resetPassword).mockResolvedValue(undefined);

      // Act
      await authService.resetPassword(resetData);

      // Assert
      expect(authService.resetPassword).toHaveBeenCalledWith(resetData);
    });

    it('should handle invalid OTP errors', async () => {
      // Arrange
      const resetData = {
        email: 'test@example.com',
        otp: 'wrong-otp',
        newPassword: 'newPassword123',
        confirmPassword: 'newPassword123',
      };

      const serviceError = new Error('Invalid OTP');
      vi.mocked(authService.resetPassword).mockRejectedValue(serviceError);

      // Act & Assert
      await expect(authService.resetPassword(resetData)).rejects.toThrow('Invalid OTP');
    });

    it('should handle expired OTP errors', async () => {
      // Arrange
      const resetData = {
        email: 'test@example.com',
        otp: '123456',
        newPassword: 'newPassword123',
        confirmPassword: 'newPassword123',
      };

      const serviceError = new Error('OTP has expired');
      vi.mocked(authService.resetPassword).mockRejectedValue(serviceError);

      // Act & Assert
      await expect(authService.resetPassword(resetData)).rejects.toThrow('OTP has expired');
    });

    it('should handle non-existent user errors', async () => {
      // Arrange
      const resetData = {
        email: 'nonexistent@example.com',
        otp: '123456',
        newPassword: 'newPassword123',
        confirmPassword: 'newPassword123',
      };

      const serviceError = new Error('User not found');
      vi.mocked(authService.resetPassword).mockRejectedValue(serviceError);

      // Act & Assert
      await expect(authService.resetPassword(resetData)).rejects.toThrow('User not found');
    });
  });
});

describe('JWT Service', () => {
  describe('generateAccessToken', () => {
    it('should generate access token with correct payload', () => {
      // Arrange
      const userId = 123;
      const mockToken = 'mock-access-token';
      vi.mocked(jwtService.generateAccessToken).mockReturnValue(mockToken);

      // Act
      const result = jwtService.generateAccessToken(userId);

      // Assert
      expect(result).toBe(mockToken);
      expect(jwtService.generateAccessToken).toHaveBeenCalledWith(userId);
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate refresh token with correct payload', () => {
      // Arrange
      const userId = 123;
      const mockToken = 'mock-refresh-token';
      vi.mocked(jwtService.generateRefreshToken).mockReturnValue(mockToken);

      // Act
      const result = jwtService.generateRefreshToken(userId);

      // Assert
      expect(result).toBe(mockToken);
      expect(jwtService.generateRefreshToken).toHaveBeenCalledWith(userId);
    });
  });
});
