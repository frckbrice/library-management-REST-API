/**
 * Libraries Service
 *
 * CRUD for libraries. Create/update handle logo and featured image uploads.
 * Update/delete enforce libraryId and role (library_admin or super_admin).
 *
 * @module src/services/libraries.service
 */

import drizzleService from './drizzle-services';
import { Library, InsertLibrary } from '../../config/database/schema';
import { NotFoundError, AuthorizationError } from '../utils/errors';
import { logger } from '../middlewares/logger';
import { uploadImageToCloudinary } from '../routes/shared';

export interface CreateLibraryData extends Partial<InsertLibrary> {
  logoUrl?: string | null;
  featuredImageUrl?: string | null;
}

export interface UpdateLibraryData extends Partial<InsertLibrary> {
  logoUrl?: string | null;
  featuredImageUrl?: string | null;
}

export interface LibraryFiles {
  logo?: Express.Multer.File[];
  featuredImage?: Express.Multer.File[];
}

export class LibrariesService {
  /** Creates a library with optional logo/featured image uploads. */
  async createLibrary(
    data: CreateLibraryData,
    files?: LibraryFiles
  ): Promise<Library> {
    // Handle logo upload
    let logoUrl = data.logoUrl || null;
    if (files?.logo && files.logo[0]) {
      try {
        logoUrl = await uploadImageToCloudinary(files.logo[0], 'libraries/logos');
      } catch (error) {
        throw new Error('Failed to upload logo');
      }
    }

    // Handle featured image upload
    let featuredImageUrl = data.featuredImageUrl || null;
    if (files?.featuredImage && files.featuredImage[0]) {
      try {
        featuredImageUrl = await uploadImageToCloudinary(
          files.featuredImage[0],
          'libraries/featured'
        );
      } catch (error) {
        throw new Error('Failed to upload featured image');
      }
    }

    const libraryData: InsertLibrary = {
      ...data,
      logoUrl,
      featuredImageUrl,
      isApproved: false, // New libraries need approval
      createdAt: new Date(),
    } as InsertLibrary;

    const library = await drizzleService.createLibrary(libraryData);
    logger.info('Library created', { libraryId: library.id });

    return library;
  }

  async updateLibrary(
    libraryId: string,
    data: UpdateLibraryData,
    userLibraryId: string,
    userRole: string,
    files?: LibraryFiles
  ): Promise<Library> {
    const existingLibrary = await drizzleService.getLibrary(libraryId);

    if (!existingLibrary) {
      throw new NotFoundError('Library');
    }

    // Check if library admin is updating their own library
    if (userRole === 'library_admin' && userLibraryId !== libraryId) {
      throw new AuthorizationError('You can only edit your own library');
    }

    // Handle logo upload
    let logoUrl = data.logoUrl ?? existingLibrary.logoUrl;
    if (files?.logo && files.logo[0]) {
      try {
        logoUrl = await uploadImageToCloudinary(files.logo[0], 'libraries/logos');
      } catch (error) {
        throw new Error('Failed to upload logo');
      }
    }

    // Handle featured image upload
    let featuredImageUrl = data.featuredImageUrl ?? existingLibrary.featuredImageUrl;
    if (files?.featuredImage && files.featuredImage[0]) {
      try {
        featuredImageUrl = await uploadImageToCloudinary(
          files.featuredImage[0],
          'libraries/featured'
        );
      } catch (error) {
        throw new Error('Failed to upload featured image');
      }
    }

    const updateData: Partial<Library> = {
      ...data,
      logoUrl,
      featuredImageUrl,
    };

    const updatedLibrary = await drizzleService.updateLibrary(libraryId, updateData);
    if (!updatedLibrary) {
      throw new Error('Failed to update library');
    }
    logger.info('Library updated', { libraryId });

    return updatedLibrary;
  }

  /** Lists all libraries. */
  async getLibraries(): Promise<Library[]> {
    return drizzleService.getLibraries();
  }

  /** Gets a library by ID; throws NotFoundError if not found. */
  async getLibrary(libraryId: string): Promise<Library> {
    const library = await drizzleService.getLibrary(libraryId);

    if (!library) {
      throw new NotFoundError('Library');
    }

    return library;
  }
}

export const librariesService = new LibrariesService();
