/**
 * NotificationPreferences Component
 * 
 * UI for managing email notification preferences
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Alert, AlertDescription } from './ui/alert';
import {
    useNotificationPreferences,
    useUpdateNotificationPreferences,
    useSendTestEmail
} from '../hooks/useNotifications';
import { useAuth } from '../hooks/useAuth';
import { Bell, Mail, Save, Send } from 'lucide-react';

interface NotificationPreference {
    id: string;
    label: string;
    description: string;
}

const notificationTypes: NotificationPreference[] = [
    {
        id: 'test_sheet_completed',
        label: 'Test Sheet Completed',
        description: 'Receive emails when test sheets are successfully completed',
    },
    {
        id: 'test_sheet_draft_saved',
        label: 'Draft Saved',
        description: 'Receive emails when test sheet drafts are saved',
    },
    {
        id: 'test_sheet_failed',
        label: 'Test Sheet Failed',
        description: 'Receive emails when test sheets fail',
    },
    {
        id: 'admin_approval_required',
        label: 'Approval Required (Admin)',
        description: 'Receive emails when test sheets require admin approval',
    },
    {
        id: 'daily_summary',
        label: 'Daily Summary',
        description: 'Receive daily summary of all test sheet activities',
    },
    {
        id: 'weekly_report',
        label: 'Weekly Report',
        description: 'Receive weekly reports with statistics and insights',
    },
];

export default function NotificationPreferences() {
    const { user } = useAuth();
    const { data: preferences, isLoading } = useNotificationPreferences(user?.id);
    const updatePreferences = useUpdateNotificationPreferences();
    const sendTestEmail = useSendTestEmail();

    const [localPreferences, setLocalPreferences] = useState<Record<string, boolean>>({});
    const [testEmail, setTestEmail] = useState(user?.email || '');
    const [hasChanges, setHasChanges] = useState(false);

    // Initialize local state when preferences load
    useEffect(() => {
        if (preferences) {
            setLocalPreferences(preferences);
        }
    }, [preferences]);

    // Track changes
    useEffect(() => {
        if (preferences) {
            const changed = Object.keys(localPreferences).some(
                key => localPreferences[key] !== preferences[key]
            );
            setHasChanges(changed);
        }
    }, [localPreferences, preferences]);

    const handleToggle = (preferenceId: string) => {
        setLocalPreferences(prev => ({
            ...prev,
            [preferenceId]: !prev[preferenceId],
        }));
    };

    const handleSave = () => {
        if (!user?.id) return;

        updatePreferences.mutate({
            userId: user.id,
            preferences: localPreferences,
        });
        setHasChanges(false);
    };

    const handleSendTest = () => {
        if (testEmail) {
            sendTestEmail.mutate(testEmail);
        }
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        Notification Preferences
                    </CardTitle>
                    <CardDescription>Loading preferences...</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Email Preferences */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        Email Notification Preferences
                    </CardTitle>
                    <CardDescription>
                        Choose which email notifications you want to receive
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Notification toggles */}
                    <div className="space-y-4">
                        {notificationTypes.map((type) => (
                            <div
                                key={type.id}
                                className="flex items-start justify-between space-x-4 pb-4 border-b last:border-0 last:pb-0"
                            >
                                <div className="flex-1 space-y-1">
                                    <Label htmlFor={type.id} className="text-sm font-medium">
                                        {type.label}
                                    </Label>
                                    <p className="text-sm text-muted-foreground">
                                        {type.description}
                                    </p>
                                </div>
                                <Switch
                                    id={type.id}
                                    checked={localPreferences[type.id] || false}
                                    onCheckedChange={() => handleToggle(type.id)}
                                />
                            </div>
                        ))}
                    </div>

                    {/* Save button */}
                    {hasChanges && (
                        <Alert>
                            <AlertDescription className="flex items-center justify-between">
                                <span>You have unsaved changes</span>
                                <Button
                                    onClick={handleSave}
                                    disabled={updatePreferences.isPending}
                                    size="sm"
                                >
                                    <Save className="h-4 w-4 mr-2" />
                                    {updatePreferences.isPending ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </AlertDescription>
                        </Alert>
                    )}
                </CardContent>
            </Card>

            {/* Test Email */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Mail className="h-5 w-5" />
                        Test Email Delivery
                    </CardTitle>
                    <CardDescription>
                        Send a test email to verify your email configuration
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-2">
                        <Input
                            type="email"
                            placeholder="Enter email address"
                            value={testEmail}
                            onChange={(e) => setTestEmail(e.target.value)}
                            className="flex-1"
                        />
                        <Button
                            onClick={handleSendTest}
                            disabled={!testEmail || sendTestEmail.isPending}
                        >
                            <Send className="h-4 w-4 mr-2" />
                            {sendTestEmail.isPending ? 'Sending...' : 'Send Test'}
                        </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                        If using development mode (Ethereal), check the console for the preview URL
                    </p>
                </CardContent>
            </Card>

            {/* Email Status Info */}
            <Card>
                <CardHeader>
                    <CardTitle>Email Configuration</CardTitle>
                    <CardDescription>Current email service status</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Email Address:</span>
                            <span className="font-medium">{user?.email || 'Not set'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Service Status:</span>
                            <span className="font-medium text-green-600">Active</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Mode:</span>
                            <span className="font-medium">
                                {import.meta.env.PROD ? 'Production' : 'Development (Ethereal)'}
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
