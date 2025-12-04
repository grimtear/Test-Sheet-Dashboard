/**
 * useNotifications Hook
 * 
 * Custom React hooks for email notifications and preferences
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from './use-toast';

/**
 * Send test sheet completed notification
 */
export function useSendCompletedNotification() {
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (testSheetId: string) => {
            const res = await fetch(`/api/notifications/test-sheet/${testSheetId}/completed`, {
                method: 'POST',
                credentials: 'include',
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to send notification');
            }

            return res.json();
        },
        onSuccess: () => {
            toast({
                title: 'Notification Sent',
                description: 'Test sheet completed notification has been sent.',
            });
        },
        onError: (error: Error) => {
            toast({
                variant: 'destructive',
                title: 'Notification Failed',
                description: error.message,
            });
        },
    });
}

/**
 * Send test sheet failed notification
 */
export function useSendFailedNotification() {
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (testSheetId: string) => {
            const res = await fetch(`/api/notifications/test-sheet/${testSheetId}/failed`, {
                method: 'POST',
                credentials: 'include',
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to send notification');
            }

            return res.json();
        },
        onSuccess: () => {
            toast({
                title: 'Notification Sent',
                description: 'Test sheet failed notification has been sent.',
            });
        },
        onError: (error: Error) => {
            toast({
                variant: 'destructive',
                title: 'Notification Failed',
                description: error.message,
            });
        },
    });
}

/**
 * Send admin approval notification
 */
export function useSendApprovalNotification() {
    const { toast } = useToast();

    return useMutation({
        mutationFn: async ({ testSheetId, adminEmail }: { testSheetId: string; adminEmail: string }) => {
            const res = await fetch(`/api/notifications/test-sheet/${testSheetId}/approval`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ adminEmail }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to send notification');
            }

            return res.json();
        },
        onSuccess: () => {
            toast({
                title: 'Notification Sent',
                description: 'Admin approval notification has been sent.',
            });
        },
        onError: (error: Error) => {
            toast({
                variant: 'destructive',
                title: 'Notification Failed',
                description: error.message,
            });
        },
    });
}

/**
 * Send test email
 */
export function useSendTestEmail() {
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (email: string) => {
            const res = await fetch('/api/notifications/test-email', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to send test email');
            }

            return res.json();
        },
        onSuccess: (data) => {
            toast({
                title: 'Test Email Sent',
                description: data.previewUrl
                    ? `Check your email or view at: ${data.previewUrl}`
                    : 'Check your email inbox.',
            });
        },
        onError: (error: Error) => {
            toast({
                variant: 'destructive',
                title: 'Test Email Failed',
                description: error.message,
            });
        },
    });
}

/**
 * Get notification preferences for a user
 */
export function useNotificationPreferences(userId: string | undefined) {
    return useQuery({
        queryKey: ['notificationPreferences', userId],
        queryFn: async () => {
            if (!userId) {
                throw new Error('User ID is required');
            }

            const res = await fetch(`/api/notifications/preferences/${userId}`, {
                credentials: 'include',
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to fetch preferences');
            }

            const data = await res.json();
            return data.preferences;
        },
        enabled: !!userId,
    });
}

/**
 * Update notification preferences
 */
export function useUpdateNotificationPreferences() {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            userId,
            preferences
        }: {
            userId: string;
            preferences: Record<string, boolean>;
        }) => {
            const res = await fetch(`/api/notifications/preferences/${userId}`, {
                method: 'PUT',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ preferences }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to update preferences');
            }

            return res.json();
        },
        onSuccess: (_, variables) => {
            // Invalidate and refetch preferences
            queryClient.invalidateQueries({
                queryKey: ['notificationPreferences', variables.userId]
            });

            toast({
                title: 'Preferences Updated',
                description: 'Your notification preferences have been saved.',
            });
        },
        onError: (error: Error) => {
            toast({
                variant: 'destructive',
                title: 'Update Failed',
                description: error.message,
            });
        },
    });
}

/**
 * Automatic notification helper
 * 
 * Call this when submitting a test sheet to automatically send
 * the appropriate notification based on the test result
 */
export function useAutoNotify() {
    const sendCompleted = useSendCompletedNotification();
    const sendFailed = useSendFailedNotification();

    return {
        notifyTestSheet: (testSheetId: string, testResult: string) => {
            if (testResult === 'Test OK') {
                sendCompleted.mutate(testSheetId);
            } else if (testResult === 'Failed') {
                sendFailed.mutate(testSheetId);
            }
        },
        isLoading: sendCompleted.isPending || sendFailed.isPending,
    };
}
