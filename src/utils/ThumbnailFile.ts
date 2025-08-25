import { access, unlink, writeFile } from 'fs/promises';
import { randomUUID } from 'crypto';
import { ClientError } from './errorHandler.js';

export const uploadThumbnail = async (file: File | null): Promise<string | null> => {
  if (!file || file.size === 0) return null;

  // Validate file type
  const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
  if (!allowedTypes.includes(file.type)) {
    throw new ClientError('Invalid thumbnail type. Allowed: PNG, JPG, JPEG');
  }
  const filename = `${Date.now()}_${randomUUID()}_${file.name}`;

  // Save file
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(`./uploads/${filename}`, buffer);

  return `/uploads/${filename}`;
};

export const deleteThumbnail = async (filePath: string): Promise<void> => {
  try {
    // Check if file exists
    await access(`.${filePath}`);
    // Delete the file
    await unlink(`.${filePath}`);
  } catch (err) {
    console.warn(`File not found or cannot delete: ${filePath}, err : ${err}`);
  }
};
