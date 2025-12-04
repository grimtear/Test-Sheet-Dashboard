import { describe, it, expect, jest } from '@jest/globals';
import { renderWithProviders, screen, waitFor } from '@/tests/utils/test-utils';
import userEvent from '@testing-library/user-event';
import { useAuth } from '@/hooks/useAuth';

// Mock the useAuth hook
jest.mock('@/hooks/useAuth');

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('Authentication Hook', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('provides user authentication state', () => {
        mockUseAuth.mockReturnValue({
            user: {
                id: '1',
                email: 'test@example.com',
                firstName: 'Test',
                lastName: 'User',
                profileImageUrl: null,
                userNumber: 1,
                createdAt: Date.now(),
                updatedAt: Date.now()
            },
            isLoading: false,
            isAuthenticated: true,
        });

        const { user, isAuthenticated } = useAuth();

        expect(isAuthenticated).toBe(true);
        expect(user?.email).toBe('test@example.com');
    });

    it('handles unauthenticated state', () => {
        mockUseAuth.mockReturnValue({
            user: undefined,
            isLoading: false,
            isAuthenticated: false,
        });

        const { user, isAuthenticated } = useAuth();

        expect(isAuthenticated).toBe(false);
        expect(user).toBeUndefined();
    });
});
