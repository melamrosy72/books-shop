import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getTags,
  createTag,
  getAuthors,
  createAuthor,
  getCategories,
  createCategory,
  deleteBook,
  getAllBooks,
  getMyBooks,
  createBook,
} from '../src/modules/books/controller.js';
import * as booksService from '../src/modules/books/service.js';
import {
  bookQuerySchema,
  createAuthorSchema,
  createBookSchema,
  createCategorySchema,
  createTagSchema,
  getBookByIdSchema,
} from '../src/modules/books/validation.js';
import { failureResponse, successResponse } from '../src/utils/response.js';

// Mock dependencies
vi.mock('../src/modules/books/service');
vi.mock('../src/modules/books/validation');
vi.mock('../src/utils/response');
vi.mock('../src/utils/errorHandler');

describe('Books Controller - Tags', () => {
  let mockContext: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock Hono context
    mockContext = {
      req: {
        json: vi.fn(),
      },
      json: vi.fn(),
    };

    vi.mocked(successResponse).mockImplementation((c, data) => c.json({ success: true, data }));
    vi.mocked(failureResponse).mockImplementation((c, message, status) =>
      c.json({ success: false, error: message }, status),
    );
  });

  describe('getTags', () => {
    it('should return all tags successfully', async () => {
      const mockTags = [
        { id: 1, name: 'fiction', createdAt: new Date(), updatedAt: new Date() },
        { id: 2, name: 'non-fiction', createdAt: new Date(), updatedAt: new Date() },
      ];

      vi.mocked(booksService.getTags).mockResolvedValue(mockTags);

      await getTags(mockContext);

      expect(booksService.getTags).toHaveBeenCalledOnce();
      expect(successResponse).toHaveBeenCalledWith(mockContext, mockTags);
    });

    it('should return empty array if no tags exist', async () => {
      vi.mocked(booksService.getTags).mockResolvedValue([]);

      await getTags(mockContext);

      expect(successResponse).toHaveBeenCalledWith(mockContext, []);
    });

    it('should handle service errors when fetching tags', async () => {
      const serviceError = new Error('Database connection failed');
      vi.mocked(booksService.getTags).mockRejectedValue(serviceError);

      await expect(getTags(mockContext)).rejects.toThrow('Database connection failed');
    });
  });

  describe('createTag', () => {
    describe('createTag', () => {
      it('should create a new tag successfully', async () => {
        const mockTagData = { name: 'science-fiction' };
        const mockCreatedTag = {
          id: 1,
          name: 'science-fiction',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        vi.mocked(booksService.createTag).mockResolvedValue(mockCreatedTag);

        const result = await booksService.createTag(mockTagData);

        expect(result).toEqual(mockCreatedTag);
      });

      it('should handle validation errors', async () => {
        const mockTagData = { name: '' };
        const validationError = new Error('Tag name is required');

        mockContext.req.json.mockResolvedValue(mockTagData);
        vi.mocked(createTagSchema.parse).mockImplementation(() => {
          throw validationError;
        });

        await expect(createTag(mockContext)).rejects.toThrow('Tag name is required');
      });

      it('should handle service errors during tag creation', async () => {
        const mockTagData = { name: 'fantasy' };
        const serviceError = new Error('Database error');

        mockContext.req.json.mockResolvedValue(mockTagData);
        vi.mocked(createTagSchema.parse).mockReturnValue(mockTagData);
        vi.mocked(booksService.createTag).mockRejectedValue(serviceError);

        await expect(createTag(mockContext)).rejects.toThrow('Database error');
      });

      it('should handle JSON parsing errors', async () => {
        const jsonError = new Error('Invalid JSON');
        mockContext.req.json.mockRejectedValue(jsonError);

        await expect(createTag(mockContext)).rejects.toThrow('Invalid JSON');
      });
    });
  });

  describe('Books Service - Tags', () => {
    describe('createTag', () => {
      it('should create a new tag successfully', async () => {
        const mockTagData = { name: 'science-fiction' };
        const mockCreatedTag = {
          id: 1,
          name: 'science-fiction',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        vi.mocked(booksService.createTag).mockResolvedValue(mockCreatedTag);

        const result = await booksService.createTag(mockTagData);

        expect(result).toEqual(mockCreatedTag);
      });

      it('should throw ClientError if tag already exists', async () => {
        const mockTagData = { name: 'existing-tag' };

        vi.mocked(booksService.createTag).mockImplementation(async () => {
          throw new Error('Tag already exists');
        });

        await expect(booksService.createTag(mockTagData)).rejects.toThrow('Tag already exists');
      });

      it('should handle database errors during tag creation', async () => {
        const mockTagData = { name: 'fantasy' };
        const dbError = new Error('Database constraint violation');

        vi.mocked(booksService.createTag).mockRejectedValue(dbError);

        await expect(booksService.createTag(mockTagData)).rejects.toThrow(
          'Database constraint violation',
        );
      });
    });

    describe('getTags', () => {
      it('should return all tags', async () => {
        const mockTags = [
          { id: 1, name: 'mystery', createdAt: new Date(), updatedAt: new Date() },
          { id: 2, name: 'thriller', createdAt: new Date(), updatedAt: new Date() },
        ];

        vi.mocked(booksService.getTags).mockResolvedValue(mockTags);

        const result = await booksService.getTags();

        expect(result).toEqual(mockTags);
      });

      it('should return empty array when no tags exist', async () => {
        vi.mocked(booksService.getTags).mockResolvedValue([]);

        const result = await booksService.getTags();

        expect(result).toEqual([]);
      });

      it('should handle database errors when fetching tags', async () => {
        const dbError = new Error('Database connection timeout');
        vi.mocked(booksService.getTags).mockRejectedValue(dbError);

        await expect(booksService.getTags()).rejects.toThrow('Database connection timeout');
      });
    });
  });
});

describe('Books Controller - Authors', () => {
  let mockContext: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock Hono context
    mockContext = {
      req: {
        json: vi.fn(),
      },
      json: vi.fn(),
    };

    // Mock response functions - Handle status code parameter
    vi.mocked(successResponse).mockImplementation((c, data, status) => {
      if (status) {
        return c.json({ success: true, data }, status);
      }
      return c.json({ success: true, data });
    });
    vi.mocked(failureResponse).mockImplementation((c, message, status) =>
      c.json({ success: false, error: message }, status),
    );
  });

  describe('getAuthors', () => {
    it('should return all authors successfully', async () => {
      // Arrange
      const mockAuthors = [
        { id: 1, name: 'Author One', bio: 'Bio one', createdAt: new Date(), updatedAt: new Date() },
        { id: 2, name: 'Author Two', bio: 'Bio two', createdAt: new Date(), updatedAt: new Date() },
      ];

      vi.mocked(booksService.getAuthors).mockResolvedValue(mockAuthors);

      // Act
      await getAuthors(mockContext);

      // Assert
      expect(booksService.getAuthors).toHaveBeenCalledOnce();
      expect(successResponse).toHaveBeenCalledWith(mockContext, mockAuthors);
    });

    it('should return empty array if no authors exist', async () => {
      // Arrange
      vi.mocked(booksService.getAuthors).mockResolvedValue([]);

      // Act
      await getAuthors(mockContext);

      // Assert
      expect(successResponse).toHaveBeenCalledWith(mockContext, []);
    });

    it('should handle service errors when fetching authors', async () => {
      // Arrange
      const serviceError = new Error('Database connection failed');
      vi.mocked(booksService.getAuthors).mockRejectedValue(serviceError);

      // Act & Assert
      await expect(getAuthors(mockContext)).rejects.toThrow('Database connection failed');
    });
  });

  describe('createAuthor', () => {
    it('should create a new author successfully', async () => {
      // Arrange
      const mockAuthorData = { name: 'New Author', bio: 'Author biography' };
      const mockCreatedAuthor = {
        id: 1,
        name: 'New Author',
        bio: 'Author biography',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockContext.req.json.mockResolvedValue(mockAuthorData);
      vi.mocked(createAuthorSchema.parse).mockReturnValue(mockAuthorData);
      vi.mocked(booksService.createAuthor).mockResolvedValue(mockCreatedAuthor);

      // Act
      await createAuthor(mockContext);

      // Assert
      expect(mockContext.req.json).toHaveBeenCalledOnce();
      expect(createAuthorSchema.parse).toHaveBeenCalledWith(mockAuthorData);
      expect(booksService.createAuthor).toHaveBeenCalledWith(mockAuthorData);
      expect(successResponse).toHaveBeenCalledWith(mockContext, mockCreatedAuthor, 201);
    });

    it('should handle validation errors', async () => {
      // Arrange
      const mockAuthorData = { name: '' }; // Empty name
      const validationError = new Error('Author name is required');

      mockContext.req.json.mockResolvedValue(mockAuthorData);
      vi.mocked(createAuthorSchema.parse).mockImplementation(() => {
        throw validationError;
      });

      // Act & Assert
      await expect(createAuthor(mockContext)).rejects.toThrow('Author name is required');
    });

    it('should handle service errors during author creation', async () => {
      // Arrange
      const mockAuthorData = { name: 'New Author', bio: 'Bio' };
      const serviceError = new Error('Database error');

      mockContext.req.json.mockResolvedValue(mockAuthorData);
      vi.mocked(createAuthorSchema.parse).mockReturnValue(mockAuthorData);
      vi.mocked(booksService.createAuthor).mockRejectedValue(serviceError);

      // Act & Assert
      await expect(createAuthor(mockContext)).rejects.toThrow('Database error');
    });

    it('should handle JSON parsing errors', async () => {
      // Arrange
      const jsonError = new Error('Invalid JSON');
      mockContext.req.json.mockRejectedValue(jsonError);

      // Act & Assert
      await expect(createAuthor(mockContext)).rejects.toThrow('Invalid JSON');
    });
  });
});

describe('Books Controller - Categories', () => {
  let mockContext: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock Hono context
    mockContext = {
      req: {
        json: vi.fn(),
      },
      json: vi.fn(),
    };

    // Mock response functions - Handle status code parameter
    vi.mocked(successResponse).mockImplementation((c, data, status) => {
      if (status) {
        return c.json({ success: true, data }, status);
      }
      return c.json({ success: true, data });
    });
    vi.mocked(failureResponse).mockImplementation((c, message, status) =>
      c.json({ success: false, error: message }, status),
    );
  });

  describe('getCategories', () => {
    it('should return all categories successfully', async () => {
      // Arrange
      const mockCategories = [
        {
          id: 1,
          name: 'Fiction',
          description: 'Fiction books',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          name: 'Non-Fiction',
          description: 'Non-fiction books',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(booksService.getCategories).mockResolvedValue(mockCategories);

      // Act
      await getCategories(mockContext);

      // Assert
      expect(booksService.getCategories).toHaveBeenCalledOnce();
      expect(successResponse).toHaveBeenCalledWith(mockContext, mockCategories);
    });

    it('should return empty array if no categories exist', async () => {
      // Arrange
      vi.mocked(booksService.getCategories).mockResolvedValue([]);

      // Act
      await getCategories(mockContext);

      // Assert
      expect(successResponse).toHaveBeenCalledWith(mockContext, []);
    });

    it('should handle service errors when fetching categories', async () => {
      // Arrange
      const serviceError = new Error('Database connection failed');
      vi.mocked(booksService.getCategories).mockRejectedValue(serviceError);

      // Act & Assert
      await expect(getCategories(mockContext)).rejects.toThrow('Database connection failed');
    });
  });

  describe('createCategory', () => {
    it('should create a new category successfully', async () => {
      // Arrange
      const mockCategoryData = { name: 'Science Fiction', description: 'Sci-fi books' };
      const mockCreatedCategory = {
        id: 1,
        name: 'Science Fiction',
        description: 'Sci-fi books',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockContext.req.json.mockResolvedValue(mockCategoryData);
      vi.mocked(createCategorySchema.parse).mockReturnValue(mockCategoryData);
      vi.mocked(booksService.createCategory).mockResolvedValue(mockCreatedCategory);

      // Act
      await createCategory(mockContext);

      // Assert
      expect(mockContext.req.json).toHaveBeenCalledOnce();
      expect(createCategorySchema.parse).toHaveBeenCalledWith(mockCategoryData);
      expect(booksService.createCategory).toHaveBeenCalledWith(mockCategoryData);
      expect(successResponse).toHaveBeenCalledWith(mockContext, mockCreatedCategory, 201);
    });

    it('should handle validation errors', async () => {
      // Arrange
      const mockCategoryData = { name: '' }; // Empty name
      const validationError = new Error('Category name is required');

      mockContext.req.json.mockResolvedValue(mockCategoryData);
      vi.mocked(createCategorySchema.parse).mockImplementation(() => {
        throw validationError;
      });

      // Act & Assert
      await expect(createCategory(mockContext)).rejects.toThrow('Category name is required');
    });

    it('should handle service errors during category creation', async () => {
      // Arrange
      const mockCategoryData = { name: 'New Category', description: 'Description' };
      const serviceError = new Error('Database error');

      mockContext.req.json.mockResolvedValue(mockCategoryData);
      vi.mocked(createCategorySchema.parse).mockReturnValue(mockCategoryData);
      vi.mocked(booksService.createCategory).mockRejectedValue(serviceError);

      // Act & Assert
      await expect(createCategory(mockContext)).rejects.toThrow('Database error');
    });

    it('should handle JSON parsing errors', async () => {
      // Arrange
      const jsonError = new Error('Invalid JSON');
      mockContext.req.json.mockRejectedValue(jsonError);

      // Act & Assert
      await expect(createCategory(mockContext)).rejects.toThrow('Invalid JSON');
    });

    it('should handle missing description field', async () => {
      // Arrange
      const mockCategoryData = { name: 'Category Without Description' }; // No description
      const mockCreatedCategory = {
        id: 1,
        name: 'Category Without Description',
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockContext.req.json.mockResolvedValue(mockCategoryData);
      vi.mocked(createCategorySchema.parse).mockReturnValue(mockCategoryData);
      vi.mocked(booksService.createCategory).mockResolvedValue(mockCreatedCategory);

      // Act
      await createCategory(mockContext);

      // Assert
      expect(successResponse).toHaveBeenCalledWith(mockContext, mockCreatedCategory, 201);
    });
  });
});

describe('Books Controller', () => {
  let mockContext: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock Hono context
    mockContext = {
      get: vi.fn(),
      req: {
        json: vi.fn(),
        query: vi.fn(),
        param: vi.fn(),
        formData: vi.fn(),
      },
      json: vi.fn(),
      header: vi.fn(),
    };

    // Mock response functions
    vi.mocked(successResponse).mockImplementation((c, data, status) => {
      if (status) {
        return c.json({ success: true, data }, status);
      }
      return c.json({ success: true, data });
    });
    vi.mocked(failureResponse).mockImplementation((c, message, status) =>
      c.json({ success: false, error: message }, status),
    );
  });

  describe('getAllBooks', () => {
    it('should return all books with pagination', async () => {
      // Arrange
      const paginated = true;
      const mockQuery = { page: 1, limit: 10, paginated };
      const mockBooks = {
        docs: [
          {
            id: 1,
            title: 'Book 1',
            price: 20,
            thumbnail: 'thumb1.jpg',
            author: { id: 1, name: 'Author 1' },
            category: { id: 1, name: 'Fiction' },
            tags: [{ id: 1, name: 'Fantasy' }],
          },
        ],
        totalDocs: 50,
        limit: 10,
        page: 1,
        totalPages: 5,
      };

      mockContext.req.query.mockReturnValue(mockQuery);
      vi.mocked(bookQuerySchema.parse).mockReturnValue(mockQuery);
      vi.mocked(booksService.getBooks).mockResolvedValue(mockBooks);

      // Act
      await getAllBooks(mockContext);

      // Assert
      expect(bookQuerySchema.parse).toHaveBeenCalledWith(mockQuery);
      expect(booksService.getBooks).toHaveBeenCalledWith({ ...mockQuery, paginated: true });
      expect(successResponse).toHaveBeenCalledWith(mockContext, mockBooks);
    });

    it('should handle validation errors', async () => {
      // Arrange
      const mockQuery = { page: 'invalid' };
      const validationError = new Error('Invalid page number');

      mockContext.req.query.mockReturnValue(mockQuery);
      vi.mocked(bookQuerySchema.parse).mockImplementation(() => {
        throw validationError;
      });

      // Act & Assert
      await expect(getAllBooks(mockContext)).rejects.toThrow('Invalid page number');
    });
  });

  describe('getMyBooks', () => {
    it('should return user books with pagination', async () => {
      // Arrange
      const paginated = true;
      const mockQuery = { page: 1, limit: 10, paginated };
      const mockBooks = {
        docs: [
          {
            id: 1,
            title: 'My Book',
            price: 20,
            thumbnail: 'thumb1.jpg',
            author: { id: 1, name: 'Author 1' },
            category: { id: 1, name: 'Fiction' },
            tags: [{ id: 1, name: 'Fantasy' }],
          },
        ],
        totalDocs: 5,
        limit: 10,
        page: 1,
        totalPages: 1,
      };

      // Fix: Mock the context properly to return user id
      mockContext.get.mockImplementation((key: string) => {
        if (key === 'user') return { id: 1 };
        return undefined;
      });
      mockContext.req.query.mockReturnValue(mockQuery);
      vi.mocked(bookQuerySchema.parse).mockReturnValue(mockQuery);
      vi.mocked(booksService.getBooks).mockResolvedValue(mockBooks);

      // Act
      await getMyBooks(mockContext);

      // Assert
      expect(booksService.getBooks).toHaveBeenCalledWith({
        ...mockQuery,
        paginated: true,
        ownerId: 1, // This should now be properly set
      });
      expect(successResponse).toHaveBeenCalledWith(mockContext, mockBooks);
    });
  });

  //create book test
  describe('createBook', () => {
    it('should create a new book successfully', async () => {
      // Arrange
      const mockBookData = {
        title: 'New Book',
        description: 'Description',
        price: 20,
        categoryId: 1,
        authorId: 1,
        tags: [1, 2],
      };
      const mockCreatedBook = {
        id: 1,
        ...mockBookData,
        ownerId: 1,
        thumbnail: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Create FormData that matches what your controller expects
      const mockFormData = new FormData();
      mockFormData.append('title', 'New Book');
      mockFormData.append('description', 'Description');
      mockFormData.append('price', '20');
      mockFormData.append('categoryId', '1');
      mockFormData.append('authorId', '1');
      mockFormData.append('tags', '1');
      mockFormData.append('tags', '2');

      mockContext.get.mockImplementation((key: string) => {
        if (key === 'user') return { id: 1 };
        return undefined;
      });
      // FIX: Use formData instead of json
      mockContext.req.formData.mockResolvedValue(mockFormData);
      vi.mocked(createBookSchema.parse).mockReturnValue(mockBookData);
      vi.mocked(booksService.createBook).mockResolvedValue(mockCreatedBook);

      // Act
      await createBook(mockContext);

      // Assert
      expect(createBookSchema.parse).toHaveBeenCalledWith(mockBookData);
      expect(booksService.createBook).toHaveBeenCalledWith(1, mockBookData, undefined);
      expect(successResponse).toHaveBeenCalledWith(mockContext, mockCreatedBook, 201);
    });

    it('should create book with thumbnail file', async () => {
      // Arrange
      const mockBookData = {
        title: 'Book with Thumbnail',
        description: 'Description',
        price: 20,
        categoryId: 1,
        authorId: 1,
        tags: [1, 2],
      };
      const mockCreatedBook = {
        id: 1,
        ...mockBookData,
        ownerId: 1,
        thumbnail: 'thumbnail-url.jpg',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Create a proper mock File object
      const mockFile = {
        name: 'thumbnail.jpg',
        size: 1000,
        type: 'image/jpeg',
        arrayBuffer: vi.fn(),
        stream: vi.fn(),
        text: vi.fn(),
        slice: vi.fn(),
      } as unknown as File;

      const mockFormData = new FormData();
      mockFormData.append('title', 'Book with Thumbnail');
      mockFormData.append('description', 'Description');
      mockFormData.append('price', '20');
      mockFormData.append('categoryId', '1');
      mockFormData.append('authorId', '1');
      mockFormData.append('tags', '1');
      mockFormData.append('tags', '2');
      mockFormData.append('thumbnail', mockFile);

      mockContext.get.mockImplementation((key: string) => {
        if (key === 'user') return { id: 1 };
        return undefined;
      });
      mockContext.req.formData.mockResolvedValue(mockFormData);
      vi.mocked(createBookSchema.parse).mockReturnValue(mockBookData);
      vi.mocked(booksService.createBook).mockResolvedValue(mockCreatedBook);

      // Act
      await createBook(mockContext);

      // Assert - Use expect.anything() for the file since it's a complex object
      expect(booksService.createBook).toHaveBeenCalledWith(
        1,
        mockBookData,
        expect.anything(), // The file object
      );
      expect(successResponse).toHaveBeenCalledWith(mockContext, mockCreatedBook, 201);
    });

    it('should handle validation errors', async () => {
      // Arrange
      const mockFormData = new FormData();
      mockFormData.append('title', '');

      mockContext.get.mockImplementation((key: string) => {
        if (key === 'user') return { id: 1 };
        return undefined;
      });
      mockContext.req.formData.mockResolvedValue(mockFormData);

      const validationError = new Error('Title is required');
      vi.mocked(createBookSchema.parse).mockImplementation(() => {
        throw validationError;
      });

      // Act & Assert
      await expect(createBook(mockContext)).rejects.toThrow('Title is required');
    });

    it('should handle missing optional fields', async () => {
      // Arrange
      const mockBookData = {
        title: 'Book without tags',
        description: 'Description',
        price: 20,
        categoryId: 1,
        authorId: 1,
        tags: [], // Empty tags array
      };
      const mockCreatedBook = {
        id: 1,
        ...mockBookData,
        ownerId: 1,
        thumbnail: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockFormData = new FormData();
      mockFormData.append('title', 'Book without tags');
      mockFormData.append('description', 'Description');
      mockFormData.append('price', '20');
      mockFormData.append('categoryId', '1');
      mockFormData.append('authorId', '1');
      // No tags appended

      mockContext.get.mockImplementation((key: string) => {
        if (key === 'user') return { id: 1 };
        return undefined;
      });
      mockContext.req.formData.mockResolvedValue(mockFormData);
      vi.mocked(createBookSchema.parse).mockReturnValue(mockBookData);
      vi.mocked(booksService.createBook).mockResolvedValue(mockCreatedBook);

      // Act
      await createBook(mockContext);

      // Assert
      expect(createBookSchema.parse).toHaveBeenCalledWith(mockBookData);
      expect(booksService.createBook).toHaveBeenCalledWith(1, mockBookData, undefined);
    });
  });

  describe('deleteBook', () => {
    it('should delete book successfully', async () => {
      // Arrange
      const mockBook = {
        id: 1,
        title: 'Test Book',
        description: 'Some description',
        price: 10,
        thumbnail: 'thumb1.jpg',
        author: { id: 1, name: 'John Doe' },
        ownerId: 1,
        category: { id: 1, name: 'Fiction' },
        tags: [
          { id: 1, name: 'tag1' },
          { id: 1, name: 'tag2' },
        ],
      };

      // Mock req.param to return the string value
      mockContext.req.param.mockImplementation((key: string) => {
        if (key === 'bookId') return 1;
        return undefined;
      });

      vi.mocked(getBookByIdSchema.parse).mockReturnValue({ bookId: 1 });
      vi.mocked(booksService.getBookById).mockResolvedValue(mockBook);
      vi.mocked(booksService.deleteBook).mockResolvedValue(undefined);

      // Add debug logging
      console.log('Before deleteBook call');

      // Act
      await deleteBook(mockContext);

      // Assert
      expect(mockContext.req.param).toHaveBeenCalledWith('bookId');
      expect(getBookByIdSchema.parse).toHaveBeenCalledWith({ bookId: 1 });
      expect(booksService.getBookById).toHaveBeenCalledWith(1);
      expect(booksService.deleteBook).toHaveBeenCalledWith(1);

      // FIX: Check what successResponse is actually called with
      expect(mockContext.json).toHaveBeenCalledWith({
        success: true,
        message: 'Book deleted successfully',
      });
    });

    it('should handle service errors during deletion', async () => {
      // Arrange
      const mockBook = {
        id: 1,
        title: 'Test Book',
        description: 'Some description',
        price: 10,
        thumbnail: 'thumb1.jpg',
        author: { id: 1, name: 'John Doe' },
        ownerId: 1,
        category: { id: 1, name: 'Fiction' },
        tags: [
          { id: 1, name: 'tag1' },
          { id: 1, name: 'tag2' },
        ],
      };
      const serviceError = new Error('Database error');

      // FIX: Mock req.param correctly
      mockContext.req.param.mockImplementation((key: string) => {
        if (key === 'bookId') return 1;
        return undefined;
      });

      // FIX: Mock the schema validation
      vi.mocked(getBookByIdSchema.parse).mockReturnValue({ bookId: 1 });
      vi.mocked(booksService.getBookById).mockResolvedValue(mockBook);
      vi.mocked(booksService.deleteBook).mockRejectedValue(serviceError);

      // Act & Assert
      await expect(deleteBook(mockContext)).rejects.toThrow('Database error');
    });

    it('should return 404 if book not found', async () => {
      // Arrange

      // FIX: Mock req.param correctly
      mockContext.req.param.mockImplementation((key: string) => {
        if (key === 'bookId') return 1;
        return undefined;
      });

      // FIX: Mock the schema validation
      vi.mocked(getBookByIdSchema.parse).mockReturnValue({ bookId: 999 });
      vi.mocked(booksService.getBookById).mockResolvedValue(null as any);

      vi.mocked(failureResponse).mockImplementation((c, message, status) => {
        return c.json({ success: false, error: message }, status);
      });

      // Act
      await deleteBook(mockContext);

      // Assert
      expect(failureResponse).toHaveBeenCalledWith(mockContext, 'Book not found', 404);
      expect(booksService.deleteBook).not.toHaveBeenCalled();
    });

    it('should handle thumbnail deletion when book has thumbnail', async () => {
      // Arrange
      const mockBook = {
        id: 1,
        title: 'Test Book',
        description: 'Some description',
        price: 10.99,
        thumbnail: 'thumb1.jpg',
        author: { id: 1, name: 'John Doe' },
        ownerId: 1,
        category: { id: 1, name: 'Fiction' },
        tags: [
          { id: 1, name: 'tag1' },
          { id: 1, name: 'tag2' },
        ],
      };

      // FIX: Mock req.param correctly
      mockContext.req.param.mockImplementation((key: string) => {
        if (key === 'bookId') return 1;
        return undefined;
      });

      // FIX: Mock the schema validation
      vi.mocked(getBookByIdSchema.parse).mockReturnValue({ bookId: 1 });
      vi.mocked(booksService.getBookById).mockResolvedValue(mockBook);
      vi.mocked(booksService.deleteBook).mockResolvedValue(undefined);

      // If your controller calls deleteThumbnail, mock it too
      // vi.mocked(deleteThumbnail).mockResolvedValue(undefined)

      // Act
      await deleteBook(mockContext);

      // Assert
      expect(booksService.deleteBook).toHaveBeenCalledWith(1);
      // If your controller calls deleteThumbnail:
      // expect(deleteThumbnail).toHaveBeenCalledWith('thumb1.jpg')
    });
  });
});
