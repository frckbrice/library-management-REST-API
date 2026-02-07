/**
 * Unit Tests for Libraries Service
 */

import { LibrariesService } from '../../../src/services/libraries.service';
import drizzleService from '../../../src/services/drizzle-services';
import * as sharedRoutes from '../../../src/routes/shared';

jest.mock('../../../src/services/drizzle-services');
jest.mock('../../../src/routes/shared');
jest.mock('../../../src/middlewares/logger', () => ({
    logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

const mockedDrizzle = drizzleService as jest.Mocked<typeof drizzleService>;

describe('LibrariesService', () => {
    let librariesService: LibrariesService;

    beforeEach(() => {
        librariesService = new LibrariesService();
        jest.clearAllMocks();
    });

    describe('createLibrary', () => {
        it('should create library with data', async () => {
            const data = { name: 'Lib A', description: 'Desc' };
            const created = { id: 'lib-1', ...data };
            mockedDrizzle.createLibrary.mockResolvedValue(created as any);

            const result = await librariesService.createLibrary(data);
            expect(mockedDrizzle.createLibrary).toHaveBeenCalledWith(
                expect.objectContaining({
                    ...data,
                    isApproved: false,
                })
            );
            expect(result).toEqual(created);
        });
    });

    describe('updateLibrary', () => {
        it('should throw NotFoundError when library not found', async () => {
            mockedDrizzle.getLibrary.mockResolvedValue(undefined as any);

            await expect(
                librariesService.updateLibrary('lib-1', { name: 'X' }, 'lib-1', 'library_admin')
            ).rejects.toMatchObject({ message: 'Library not found', statusCode: 404, name: 'NotFoundError' });
        });

        it('should throw AuthorizationError when library_admin updates other library', async () => {
            mockedDrizzle.getLibrary.mockResolvedValue({ id: 'lib-1', libraryId: 'lib-1' } as any);

            await expect(
                librariesService.updateLibrary('lib-1', { name: 'X' }, 'other-lib', 'library_admin')
            ).rejects.toMatchObject({ message: 'You can only edit your own library', statusCode: 403 });
        });

        it('should update library when allowed', async () => {
            const existing = { id: 'lib-1', name: 'Old' };
            const updated = { id: 'lib-1', name: 'New' };
            mockedDrizzle.getLibrary.mockResolvedValue(existing as any);
            mockedDrizzle.updateLibrary.mockResolvedValue(updated as any);

            const result = await librariesService.updateLibrary(
                'lib-1',
                { name: 'New' },
                'lib-1',
                'library_admin'
            );
            expect(mockedDrizzle.updateLibrary).toHaveBeenCalled();
            expect(result).toEqual(updated);
        });
    });

    describe('getLibraries', () => {
        it('should return all libraries', async () => {
            const libraries = [{ id: 'lib-1', name: 'Lib 1' }];
            mockedDrizzle.getLibraries.mockResolvedValue(libraries as any);

            const result = await librariesService.getLibraries();
            expect(mockedDrizzle.getLibraries).toHaveBeenCalled();
            expect(result).toEqual(libraries);
        });
    });

    describe('getLibrary', () => {
        it('should return library by id', async () => {
            const library = { id: 'lib-1', name: 'Lib 1' };
            mockedDrizzle.getLibrary.mockResolvedValue(library as any);

            const result = await librariesService.getLibrary('lib-1');
            expect(mockedDrizzle.getLibrary).toHaveBeenCalledWith('lib-1');
            expect(result).toEqual(library);
        });

        it('should throw NotFoundError when not found', async () => {
            mockedDrizzle.getLibrary.mockResolvedValue(undefined as any);

            await expect(librariesService.getLibrary('lib-1')).rejects.toMatchObject({
                message: 'Library not found',
                statusCode: 404,
            });
        });
    });
});
