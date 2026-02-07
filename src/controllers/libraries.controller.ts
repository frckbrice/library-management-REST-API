/**
 * Libraries Controller
 *
 * CRUD for libraries. Create accepts multipart body and files; update is
 * restricted by session libraryId and role. List and get by ID are public.
 *
 * @module src/controllers/libraries.controller
 */

import { Request, Response } from 'express';
import { librariesService } from '../services/libraries.service';
import { AuthorizationError } from '../utils/errors';

export class LibrariesController {
  /**
   * Creates a new library with optional logo and featured image uploads (multipart).
   * @param req - Express request; body + optional files
   * @param res - Express response; sends 201 and created library
   */
  async createLibrary(req: Request, res: Response): Promise<void> {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const library = await librariesService.createLibrary(req.body, files);

    res.status(201).json({
      success: true,
      data: library,
    });
  }

  /**
   * Updates a library by ID; enforces session libraryId and role (library_admin can only edit own library).
   * @param req - Express request; params.id, body, optional files
   * @param res - Express response; sends updated library
   */
  async updateLibrary(req: Request, res: Response): Promise<void> {
    if (!req.session.user) {
      throw new AuthorizationError('Unauthorized - not logged in');
    }
    const libraryIdFromSession = req.session.user.libraryId;
    if (!libraryIdFromSession) {
      throw new AuthorizationError('Library context required');
    }
    const libraryId = req.params.id;
    const role = req.session.user.role;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    const updatedLibrary = await librariesService.updateLibrary(
      libraryId,
      req.body,
      libraryIdFromSession,
      role,
      files
    );

    res.status(200).json({
      success: true,
      data: updatedLibrary,
    });
  }

  async getLibraries(req: Request, res: Response): Promise<void> {
    const libraries = await librariesService.getLibraries();
    res.status(200).json(libraries);
  }

  /**
   * Returns a single library by ID (public).
   * @param req - Express request; params.id
   * @param res - Express response; sends library object
   */
  async getLibrary(req: Request, res: Response): Promise<void> {
    const libraryId = req.params.id;
    const library = await librariesService.getLibrary(libraryId);
    res.status(200).json(library);
  }
}

export const librariesController = new LibrariesController();
