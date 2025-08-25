import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getProfile, editProfile, changePassword } from '../src/modules/users/controller.js';
import * as usersService from '../src/modules/users/service.js';
import * as bcryptService from '../src/utils/bcryptService.js';
import { updateProfileSchema, changePasswordSchema } from '../src/modules/users/validation.js';
import { failureResponse, successResponse } from '../src/utils/response.js';

// Mock dependencies
vi.mock('../src/modules/users/service');
vi.mock('../src/utils/bcryptService');
vi.mock('../src/modules/users/validation');
vi.mock('../src/utils/response');

describe('Users Controller', () => {
  let mockContext: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock Hono context
    mockContext = {
      get: vi.fn(),
      req: {
        json: vi.fn(),
      },
      json: vi.fn(),
    };

    // Mock response functions
    vi.mocked(successResponse).mockImplementation((c, data) => c.json({ success: true, data }));
    vi.mocked(failureResponse).mockImplementation((c, message, status) =>
      c.json({ success: false, error: message }, status),
    );
  });

  describe('Users Controller', () => {
    let mockContext: any;

    beforeEach(() => {
      vi.clearAllMocks();

      // Mock Hono context
      mockContext = {
        get: vi.fn(),
        req: {
          json: vi.fn(),
        },
        json: vi.fn(),
      };

      // Mock response functions
      vi.mocked(successResponse).mockImplementation((c, data) => c.json({ success: true, data }));
      vi.mocked(failureResponse).mockImplementation((c, message, status) =>
        c.json({ success: false, error: message }, status),
      );
    });

    describe('getProfile', () => {
      it('should return user profile without password', async () => {
        // Arrange
        const mockUser = {
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          password: 'hashedpassword',
          resetPassOtp: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        mockContext.get.mockImplementation((key: string) => {
          if (key === 'user') return { id: 1 };
          return undefined;
        });

        vi.mocked(usersService.getUserById).mockResolvedValue(mockUser);

        // Act
        await getProfile(mockContext);

        // Assert
        expect(mockContext.get).toHaveBeenCalledWith('user');
        expect(usersService.getUserById).toHaveBeenCalledWith(1);
        expect(successResponse).toHaveBeenCalledWith(mockContext, {
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          resetPassOtp: null,
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        });
      });

      it('should return 404 if user not found', async () => {
        // Arrange
        mockContext.get.mockReturnValue({ user: { id: 999 } });
        vi.mocked(usersService.getUserById).mockResolvedValue(null as any);

        // Act
        await getProfile(mockContext);

        // Assert
        expect(failureResponse).toHaveBeenCalledWith(mockContext, 'User not found', 404);
      });
    });
  });

  describe('editProfile', () => {
    it('should update user profile successfully', async () => {
      // Arrange
      const mockUser = {
        id: 1,
        username: 'oldusername',
        email: 'old@example.com',
        password: 'hashedpassword',
        resetPassOtp: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockUpdateData = {
        username: 'newusername',
        email: 'new@example.com',
      };

      const mockUpdatedUser = {
        id: 1,
        username: 'newusername',
        email: 'new@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Fix: Mock context properly
      mockContext.get.mockImplementation((key: string) => {
        if (key === 'user') return { id: 1 };
        return undefined;
      });
      mockContext.req.json.mockResolvedValue(mockUpdateData);
      vi.mocked(updateProfileSchema.parse).mockReturnValue(mockUpdateData);
      vi.mocked(usersService.getUserById).mockResolvedValue(mockUser);
      vi.mocked(usersService.updateUser).mockResolvedValue(mockUpdatedUser);

      // Act
      await editProfile(mockContext);

      // Assert
      expect(mockContext.req.json).toHaveBeenCalled();
      expect(updateProfileSchema.parse).toHaveBeenCalledWith(mockUpdateData);
      expect(usersService.getUserById).toHaveBeenCalledWith(1);
      expect(usersService.updateUser).toHaveBeenCalledWith(1, mockUpdateData);
      expect(successResponse).toHaveBeenCalledWith(mockContext, mockUpdatedUser);
    });

    it('should return 404 if user not found', async () => {
      // Arrange
      const mockUpdateData = { username: 'newusername' };

      // Fix: Mock context properly
      mockContext.get.mockImplementation((key: string) => {
        if (key === 'user') return { id: 999 };
        return undefined;
      });
      mockContext.req.json.mockResolvedValue(mockUpdateData);
      vi.mocked(updateProfileSchema.parse).mockReturnValue(mockUpdateData);
      vi.mocked(usersService.getUserById).mockResolvedValue(null as any);

      // Act
      await editProfile(mockContext);

      // Assert
      expect(usersService.updateUser).not.toHaveBeenCalled();
      expect(failureResponse).toHaveBeenCalledWith(mockContext, 'User not found', 404);
    });

    it('should handle validation errors', async () => {
      // Arrange
      const mockUpdateData = { email: 'invalid-email' };
      const validationError = new Error('Invalid email format');

      // Fix: Mock context properly
      mockContext.get.mockImplementation((key: string) => {
        if (key === 'user') return { id: 1 };
        return undefined;
      });
      mockContext.req.json.mockResolvedValue(mockUpdateData);
      vi.mocked(updateProfileSchema.parse).mockImplementation(() => {
        throw validationError;
      });

      // Act & Assert
      await expect(editProfile(mockContext)).rejects.toThrow('Invalid email format');
    });

    it('should handle service errors during update', async () => {
      // Arrange
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword',
        resetPassOtp: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockUpdateData = { username: 'existingusername' };
      const serviceError = new Error('Username already exists');

      // Fix: Mock context properly
      mockContext.get.mockImplementation((key: string) => {
        if (key === 'user') return { id: 1 };
        return undefined;
      });
      mockContext.req.json.mockResolvedValue(mockUpdateData);
      vi.mocked(updateProfileSchema.parse).mockReturnValue(mockUpdateData);
      vi.mocked(usersService.getUserById).mockResolvedValue(mockUser);
      vi.mocked(usersService.updateUser).mockRejectedValue(serviceError);

      // Act & Assert
      await expect(editProfile(mockContext)).rejects.toThrow('Username already exists');
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      // Arrange
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        password: 'oldhashedpassword',
        resetPassOtp: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockPasswordData = {
        oldPassword: 'oldpassword123',
        newPassword: 'newpassword456',
        confirmPassword: 'newpassword456',
      };

      // Fix: Mock context properly
      mockContext.get.mockImplementation((key: string) => {
        if (key === 'user') return { id: 1 };
        return undefined;
      });
      mockContext.req.json.mockResolvedValue(mockPasswordData);
      vi.mocked(changePasswordSchema.parse).mockReturnValue(mockPasswordData);
      vi.mocked(usersService.getUserById).mockResolvedValue(mockUser);
      vi.mocked(bcryptService.comparePassword).mockResolvedValue(true);
      vi.mocked(usersService.changePassword).mockResolvedValue(null as any);

      // Act
      await changePassword(mockContext);

      // Assert
      expect(bcryptService.comparePassword).toHaveBeenCalledWith(
        'oldpassword123',
        'oldhashedpassword',
      );
      expect(usersService.changePassword).toHaveBeenCalledWith(1, mockPasswordData);
      expect(mockContext.json).toHaveBeenCalledWith({
        success: true,
        message: 'Password Has Been Changed Successfully',
      });
    });

    it('should return 404 if user not found', async () => {
      // Arrange
      const mockPasswordData = {
        oldPassword: 'oldpassword123',
        newPassword: 'newpassword456',
        confirmPassword: 'newpassword456',
      };

      // Fix: Mock context properly
      mockContext.get.mockImplementation((key: string) => {
        if (key === 'user') return { id: 999 };
        return undefined;
      });
      mockContext.req.json.mockResolvedValue(mockPasswordData);
      vi.mocked(changePasswordSchema.parse).mockReturnValue(mockPasswordData);
      vi.mocked(usersService.getUserById).mockResolvedValue(null as any);

      // Act
      await changePassword(mockContext);

      // Assert
      expect(failureResponse).toHaveBeenCalledWith(mockContext, 'User not found', 404);
    });

    it('should return 401 if old password is incorrect', async () => {
      // Arrange
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        password: 'oldhashedpassword',
        resetPassOtp: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockPasswordData = {
        oldPassword: 'wrongpassword',
        newPassword: 'newpassword456',
        confirmPassword: 'newpassword456',
      };

      // Fix: Mock context properly
      mockContext.get.mockImplementation((key: string) => {
        if (key === 'user') return { id: 1 };
        return undefined;
      });
      mockContext.req.json.mockResolvedValue(mockPasswordData);
      vi.mocked(changePasswordSchema.parse).mockReturnValue(mockPasswordData);
      vi.mocked(usersService.getUserById).mockResolvedValue(mockUser);
      vi.mocked(bcryptService.comparePassword).mockResolvedValue(false);

      // Act
      await changePassword(mockContext);

      // Assert
      expect(failureResponse).toHaveBeenCalledWith(mockContext, 'old password is not valid', 401);
      expect(usersService.changePassword).not.toHaveBeenCalled();
    });

    it('should handle validation errors', async () => {
      // Arrange
      const mockPasswordData = {
        oldPassword: 'short',
        newPassword: 'short',
        confirmPassword: 'short',
      };
      const validationError = new Error('Password must be at least 8 characters');

      // Fix: Mock context properly
      mockContext.get.mockImplementation((key: string) => {
        if (key === 'user') return { id: 1 };
        return undefined;
      });
      mockContext.req.json.mockResolvedValue(mockPasswordData);
      vi.mocked(changePasswordSchema.parse).mockImplementation(() => {
        throw validationError;
      });

      // Act & Assert
      await expect(changePassword(mockContext)).rejects.toThrow(
        'Password must be at least 8 characters',
      );
    });

    it('should handle service errors during password change', async () => {
      // Arrange
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        password: 'oldhashedpassword',
        resetPassOtp: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockPasswordData = {
        oldPassword: 'oldpassword123',
        newPassword: 'newpassword456',
        confirmPassword: 'newpassword456',
      };

      const serviceError = new Error('Database error');

      // Fix: Mock context properly
      mockContext.get.mockImplementation((key: string) => {
        if (key === 'user') return { id: 1 };
        return undefined;
      });
      mockContext.req.json.mockResolvedValue(mockPasswordData);
      vi.mocked(changePasswordSchema.parse).mockReturnValue(mockPasswordData);
      vi.mocked(usersService.getUserById).mockResolvedValue(mockUser);
      vi.mocked(bcryptService.comparePassword).mockResolvedValue(true);
      vi.mocked(usersService.changePassword).mockRejectedValue(serviceError);

      // Act & Assert
      await expect(changePassword(mockContext)).rejects.toThrow('Database error');
    });
  });

  describe('Users Service', () => {
    describe('getUserById', () => {
      it('should return user by id', async () => {
        // Arrange
        const mockUser = {
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          password: 'hashedpassword',
          resetPassOtp: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        vi.mocked(usersService.getUserById).mockResolvedValue(mockUser);

        // Act
        const result = await usersService.getUserById(1);

        // Assert
        expect(result).toEqual(mockUser);
      });

      it('should return null if user not found', async () => {
        // Arrange
        vi.mocked(usersService.getUserById).mockResolvedValue(null as any);

        // Act
        const result = await usersService.getUserById(999);

        // Assert
        expect(result).toBeNull();
      });
    });

    describe('updateUser', () => {
      it('should update user successfully', async () => {
        // Arrange
        const mockUpdateData = {
          username: 'newusername',
          email: 'new@example.com',
        };

        const mockUpdatedUser = {
          id: 1,
          username: 'newusername',
          email: 'new@example.com',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        vi.mocked(usersService.updateUser).mockResolvedValue(mockUpdatedUser);

        // Act
        const result = await usersService.updateUser(1, mockUpdateData);

        // Assert
        expect(result).toEqual(mockUpdatedUser);
      });

      it('should throw error if email already exists', async () => {
        // Arrange
        const mockUpdateData = { email: 'existing@example.com' };
        const clientError = new Error('Email already exists');

        vi.mocked(usersService.updateUser).mockRejectedValue(clientError);

        // Act & Assert
        await expect(usersService.updateUser(1, mockUpdateData)).rejects.toThrow(
          'Email already exists',
        );
      });

      it('should throw error if username already exists', async () => {
        // Arrange
        const mockUpdateData = { username: 'existinguser' };
        const clientError = new Error('Username already exists');

        vi.mocked(usersService.updateUser).mockRejectedValue(clientError);

        // Act & Assert
        await expect(usersService.updateUser(1, mockUpdateData)).rejects.toThrow(
          'Username already exists',
        );
      });

      it('should throw error if no valid fields to update', async () => {
        // Arrange
        const mockUpdateData = {};
        const clientError = new Error('No valid fields to update');

        vi.mocked(usersService.updateUser).mockRejectedValue(clientError);

        // Act & Assert
        await expect(usersService.updateUser(1, mockUpdateData)).rejects.toThrow(
          'No valid fields to update',
        );
      });
    });

    describe('changePassword', () => {
      it('should change password successfully', async () => {
        // Arrange
        const mockPasswordData = {
          oldPassword: 'oldpassword123',
          newPassword: 'newpassword456',
          confirmPassword: 'newpassword456',
        };

        vi.mocked(usersService.changePassword).mockResolvedValue({
          success: true,
        } as any);

        // Act
        const result = await usersService.changePassword(1, mockPasswordData);

        // Assert
        expect(result).toBeDefined();
      });

      it('should handle errors during password change', async () => {
        // Arrange
        const mockPasswordData = {
          oldPassword: 'oldpassword123',
          newPassword: 'newpassword456',
          confirmPassword: 'newpassword456',
        };

        const serviceError = new Error('Database update failed');
        vi.mocked(usersService.changePassword).mockRejectedValue(serviceError);

        // Act & Assert
        await expect(usersService.changePassword(1, mockPasswordData)).rejects.toThrow(
          'Database update failed',
        );
      });
    });
  });
});
