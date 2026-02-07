/**
 * Unit Tests for Libraries Controller
 */

import { Request, Response } from 'express';
import { LibrariesController } from '../../../src/controllers/libraries.controller';
import { librariesService } from '../../../src/services/libraries.service';
import { AuthorizationError } from '../../../src/utils/errors';
import { createMockRequest, createMockResponse, createMockSession } from '../../helpers/mocks';

jest.mock('../../../src/services/libraries.service');

const mockedLibrariesService = librariesService as jest.Mocked<typeof librariesService>;

describe('LibrariesController', () => {
    let librariesController: LibrariesController;
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;

    const sessionUser = {
        id: 'user-1',
        username: 'admin',
        fullName: 'Admin User',
        email: 'admin@test.com',
        role: 'library_admin',
        libraryId: 'lib-1',
    };

    beforeEach(() => {
        librariesController = new LibrariesController();
        mockRequest = createMockRequest();
        mockResponse = createMockResponse();
        mockRequest.session = createMockSession(sessionUser) as any;
        jest.clearAllMocks();
    });

    describe('createLibrary', () => {
        it('should create library with body and files', async () => {
            mockRequest.body = { name: 'Library A', description: 'Desc' };
            mockRequest.files = {} as any;
            const library = { id: 'lib-1', name: 'Library A' } as any;
            mockedLibrariesService.createLibrary.mockResolvedValue(library);

            await librariesController.createLibrary(mockRequest as Request, mockResponse as Response);

            expect(mockedLibrariesService.createLibrary).toHaveBeenCalledWith(
                mockRequest.body,
                mockRequest.files
            );
            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith({ success: true, data: library });
        });
    });

    describe('updateLibrary', () => {
        it('should update library when user has libraryId and matches', async () => {
            mockRequest.params = { id: 'lib-1' };
            mockRequest.body = { name: 'Updated Name' };
            mockRequest.files = {} as any;
            const updated = { id: 'lib-1', name: 'Updated Name' } as any;
            mockedLibrariesService.updateLibrary.mockResolvedValue(updated);

            await librariesController.updateLibrary(mockRequest as Request, mockResponse as Response);

            expect(mockedLibrariesService.updateLibrary).toHaveBeenCalledWith(
                'lib-1',
                mockRequest.body,
                'lib-1',
                'library_admin',
                mockRequest.files
            );
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({ success: true, data: updated });
        });

        it('should throw when not logged in', async () => {
            mockRequest.session = {} as any;
            mockRequest.params = { id: 'lib-1' };
            mockRequest.body = {};

            await expect(
                librariesController.updateLibrary(mockRequest as Request, mockResponse as Response)
            ).rejects.toMatchObject({ statusCode: 403, name: 'AuthorizationError' });
        });

        it('should throw when libraryId is missing in session', async () => {
            (mockRequest.session as any).user = { ...sessionUser, libraryId: undefined };
            mockRequest.params = { id: 'lib-1' };

            await expect(
                librariesController.updateLibrary(mockRequest as Request, mockResponse as Response)
            ).rejects.toMatchObject({ statusCode: 403, name: 'AuthorizationError' });
        });
    });

    describe('getLibraries', () => {
        it('should return all libraries', async () => {
            const libraries = [{ id: 'lib-1', name: 'Lib 1' }] as any[];
            mockedLibrariesService.getLibraries.mockResolvedValue(libraries);

            await librariesController.getLibraries(mockRequest as Request, mockResponse as Response);

            expect(mockedLibrariesService.getLibraries).toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(libraries);
        });
    });

    describe('getLibrary', () => {
        it('should return library by id', async () => {
            mockRequest.params = { id: 'lib-1' };
            const library = { id: 'lib-1', name: 'Library 1' } as any;
            mockedLibrariesService.getLibrary.mockResolvedValue(library);

            await librariesController.getLibrary(mockRequest as Request, mockResponse as Response);

            expect(mockedLibrariesService.getLibrary).toHaveBeenCalledWith('lib-1');
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(library);
        });
    });
});
