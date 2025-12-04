/**
 * AuditLogViewer Component
 * 
 * UI for viewing and filtering audit logs
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import {
    useAuditLogs,
    useAuditStats,
    useAuditActions,
    useAuditEntities,
    formatAuditTimestamp,
    getSeverityColor,
    getActionIcon,
    parseAuditLogChanges,
    type AuditLogFilters,
    type AuditLog,
} from '../hooks/useAudit';
import {
    FileText,
    Filter,
    ChevronLeft,
    ChevronRight,
    Search,
    Calendar,
    BarChart3,
} from 'lucide-react';

export default function AuditLogViewer() {
    const [filters, setFilters] = useState<AuditLogFilters>({
        page: 1,
        limit: 20,
    });

    const [showFilters, setShowFilters] = useState(false);

    const { data, isLoading, error } = useAuditLogs(filters);
    const { data: stats } = useAuditStats();
    const { data: actions } = useAuditActions();
    const { data: entities } = useAuditEntities();

    const updateFilter = (key: keyof AuditLogFilters, value: any) => {
        setFilters(prev => ({
            ...prev,
            [key]: value === '' ? undefined : value,
            page: key !== 'page' ? 1 : prev.page, // Reset to page 1 when filter changes
        }));
    };

    const nextPage = () => {
        if (data?.pagination?.hasMore) {
            updateFilter('page', (filters.page || 1) + 1);
        }
    };

    const prevPage = () => {
        if ((filters.page || 1) > 1) {
            updateFilter('page', (filters.page || 1) - 1);
        }
    };

    const resetFilters = () => {
        setFilters({ page: 1, limit: 20 });
    };

    return (
        <div className="space-y-6">
            {/* Statistics Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium">Total Logs</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.stats.total.toLocaleString()}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium">Actions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-1">
                                {stats.stats.byAction.slice(0, 3).map((item: any) => (
                                    <div key={item.action} className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">{item.action}</span>
                                        <span className="font-medium">{item.count}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium">Entities</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-1">
                                {stats.stats.byEntity.slice(0, 3).map((item: any) => (
                                    <div key={item.entity} className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">{item.entity}</span>
                                        <span className="font-medium">{item.count}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium">Top User</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {stats.stats.topUsers[0] && (
                                <div>
                                    <div className="text-sm font-medium truncate">
                                        {stats.stats.topUsers[0].name || stats.stats.topUsers[0].email}
                                    </div>
                                    <div className="text-2xl font-bold">{stats.stats.topUsers[0].count}</div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Main Audit Log Card */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                Audit Logs
                            </CardTitle>
                            <CardDescription>
                                Complete history of all system activities and data changes
                            </CardDescription>
                        </div>
                        <Button
                            variant="outline"
                            onClick={() => setShowFilters(!showFilters)}
                        >
                            <Filter className="h-4 w-4 mr-2" />
                            {showFilters ? 'Hide Filters' : 'Show Filters'}
                        </Button>
                    </div>
                </CardHeader>

                <CardContent className="space-y-4">
                    {/* Filters */}
                    {showFilters && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Search</label>
                                <Input
                                    placeholder="Search by email, name, or description..."
                                    value={filters.search || ''}
                                    onChange={(e) => updateFilter('search', e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Action</label>
                                <Select
                                    value={filters.action || ''}
                                    onValueChange={(value) => updateFilter('action', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="All actions" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">All actions</SelectItem>
                                        {actions?.map((action: string) => (
                                            <SelectItem key={action} value={action}>
                                                {getActionIcon(action as any)} {action}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Entity</label>
                                <Select
                                    value={filters.entity || ''}
                                    onValueChange={(value) => updateFilter('entity', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="All entities" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">All entities</SelectItem>
                                        {entities?.map((entity: string) => (
                                            <SelectItem key={entity} value={entity}>
                                                {entity}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Severity</label>
                                <Select
                                    value={filters.severity || ''}
                                    onValueChange={(value) => updateFilter('severity', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="All severities" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">All severities</SelectItem>
                                        <SelectItem value="info">Info</SelectItem>
                                        <SelectItem value="warning">Warning</SelectItem>
                                        <SelectItem value="error">Error</SelectItem>
                                        <SelectItem value="critical">Critical</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="md:col-span-2 flex items-end gap-2">
                                <Button onClick={resetFilters} variant="outline" className="flex-1">
                                    Reset Filters
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Audit Log List */}
                    <ScrollArea className="h-[600px]">
                        {isLoading && (
                            <div className="text-center py-8 text-muted-foreground">
                                Loading audit logs...
                            </div>
                        )}

                        {error && (
                            <div className="text-center py-8 text-destructive">
                                Error loading audit logs
                            </div>
                        )}

                        {data?.logs && data.logs.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground">
                                No audit logs found
                            </div>
                        )}

                        <div className="space-y-3">
                            {data?.logs?.map((log: AuditLog) => (
                                <AuditLogItem key={log.id} log={log} />
                            ))}
                        </div>
                    </ScrollArea>

                    {/* Pagination */}
                    {data?.pagination && (
                        <div className="flex items-center justify-between pt-4 border-t">
                            <div className="text-sm text-muted-foreground">
                                Page {data.pagination.page} of {data.pagination.totalPages} (
                                {data.pagination.total} total)
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={prevPage}
                                    disabled={(filters.page || 1) === 1}
                                >
                                    <ChevronLeft className="h-4 w-4 mr-1" />
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={nextPage}
                                    disabled={!data.pagination.hasMore}
                                >
                                    Next
                                    <ChevronRight className="h-4 w-4 ml-1" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

/**
 * Individual Audit Log Item
 */
function AuditLogItem({ log }: { log: AuditLog }) {
    const [expanded, setExpanded] = useState(false);
    const { changes, oldValues, newValues } = parseAuditLogChanges(log);

    const severityColor = getSeverityColor(log.severity);
    const actionIcon = getActionIcon(log.action);

    return (
        <div
            className="border rounded-lg p-4 hover:bg-muted/50 cursor-pointer transition-colors"
            onClick={() => setExpanded(!expanded)}
        >
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                    <span className="text-2xl">{actionIcon}</span>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant={severityColor === 'red' ? 'destructive' : 'default'}>
                                {log.action}
                            </Badge>
                            <Badge variant="outline">{log.entity}</Badge>
                            {log.severity !== 'info' && (
                                <Badge variant="secondary">{log.severity}</Badge>
                            )}
                        </div>
                        <p className="text-sm font-medium mt-2">
                            {log.description || `${log.action} ${log.entity}`}
                        </p>
                        <div className="text-xs text-muted-foreground mt-1 space-y-1">
                            <div>
                                By: <span className="font-medium">{log.userName || log.userEmail}</span>
                            </div>
                            <div>
                                When: <span className="font-medium">{formatAuditTimestamp(log.timestamp)}</span>
                            </div>
                            {log.ipAddress && (
                                <div>
                                    From: <span className="font-medium">{log.ipAddress}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Expanded Details */}
            {expanded && (
                <div className="mt-4 pt-4 border-t space-y-4">
                    {/* Request Info */}
                    {(log.endpoint || log.method) && (
                        <div className="text-xs space-y-1">
                            <div className="font-medium text-muted-foreground">Request:</div>
                            {log.method && log.endpoint && (
                                <div className="font-mono bg-muted px-2 py-1 rounded">
                                    {log.method} {log.endpoint}
                                </div>
                            )}
                            {log.userAgent && (
                                <div className="text-muted-foreground truncate">
                                    {log.userAgent}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Changes */}
                    {changes && Object.keys(changes).length > 0 && (
                        <div className="text-xs space-y-1">
                            <div className="font-medium text-muted-foreground">Changes:</div>
                            <div className="bg-muted px-2 py-2 rounded space-y-1">
                                {Object.entries(changes).map(([key, value]: [string, any]) => (
                                    <div key={key} className="flex items-start gap-2">
                                        <span className="font-medium">{key}:</span>
                                        <div className="flex-1">
                                            <div className="text-red-600">
                                                - {JSON.stringify(value.from)}
                                            </div>
                                            <div className="text-green-600">
                                                + {JSON.stringify(value.to)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* New Values (for CREATE) */}
                    {newValues && log.action === 'CREATE' && (
                        <div className="text-xs space-y-1">
                            <div className="font-medium text-muted-foreground">Created Data:</div>
                            <pre className="bg-muted px-2 py-2 rounded overflow-x-auto text-xs">
                                {JSON.stringify(newValues, null, 2)}
                            </pre>
                        </div>
                    )}

                    {/* Old Values (for DELETE) */}
                    {oldValues && log.action === 'DELETE' && (
                        <div className="text-xs space-y-1">
                            <div className="font-medium text-muted-foreground">Deleted Data:</div>
                            <pre className="bg-muted px-2 py-2 rounded overflow-x-auto text-xs">
                                {JSON.stringify(oldValues, null, 2)}
                            </pre>
                        </div>
                    )}

                    {/* Entity ID */}
                    {log.entityId && (
                        <div className="text-xs">
                            <span className="font-medium text-muted-foreground">Entity ID:</span>
                            <span className="ml-2 font-mono">{log.entityId}</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
