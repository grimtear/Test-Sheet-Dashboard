import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Plus, Download, Trash2, Eye, Calendar } from "lucide-react";
import { useLocation } from "wouter";
import type { TestSheet } from "@shared/schema";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer } from "recharts";
import { ChartContainer } from "@/components/ui/chart";

export default function Dashboard() {
  const [, setLocation] = useLocation();

  const { data: stats, isLoading: statsLoading } = useQuery<{
    total: number;
    thisMonth: number;
    recent: number;
  }>({
    queryKey: ["/api/test-sheets/stats"],
  });

  // Auto-save dashboard UI state and scroll so refresh restores where you were
  const DASHBOARD_STATE_KEY = "nae-dashboard-state";
  const [state, setState] = useState<{ selectedPlant?: string | null }>({ selectedPlant: null });
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DASHBOARD_STATE_KEY);
      if (saved) setState(JSON.parse(saved));
      const savedScroll = Number(localStorage.getItem(`${DASHBOARD_STATE_KEY}:scroll`) || 0);
      if (!Number.isNaN(savedScroll)) requestAnimationFrame(() => window.scrollTo(0, savedScroll));
    } catch { }
    const onScroll = () => localStorage.setItem(`${DASHBOARD_STATE_KEY}:scroll`, String(window.scrollY));
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => { localStorage.setItem(DASHBOARD_STATE_KEY, JSON.stringify(state)); }, [state]);
  const { data: recentSheets, isLoading: sheetsLoading } = useQuery<TestSheet[]>({
    queryKey: ["/api/test-sheets/recent"],
  });

  // Google Sheets summary for totals and per-plant counts
  const { data: sheetsSummary } = useQuery<{ total: number; byPlant: { plantName: string; count: number }[] }>({
    queryKey: ["/api/google-sheets/summary"],
  });
  const barData = useMemo(
    () => (sheetsSummary?.byPlant || []).slice(0, 12).map(r => ({ name: r.plantName, value: r.count })),
    [sheetsSummary]
  );

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <img src="/NAE logo.jpg" alt="NAE Logo" className="w-12 h-12 object-contain" />
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Overview of your test sheet activity
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => setLocation('/all-sheets')}
            data-testid="button-all-sheets"
          >
            View All Sheets
          </Button>
          <Button
            size="lg"
            onClick={() => setLocation('/test-sheet/new')}
            data-testid="button-new-test-sheet"
          >
            <Plus className="h-5 w-5 mr-2" />
            New Test Sheet
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Test Sheets</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-3xl font-bold" data-testid="stat-total">
                {stats?.total ?? sheetsSummary?.total ?? 0}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              All time completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-3xl font-bold" data-testid="stat-month">
                {stats?.thisMonth || 0}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Sheets created this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-3xl font-bold" data-testid="stat-recent">
                {stats?.recent || 0}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              This Week
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Test Sheets */}
      <Card>
        <CardHeader>
          <CardTitle>Sheets per Plant (Google Sheets)</CardTitle>
          <CardDescription>Top plants by total test sheets</CardDescription>
        </CardHeader>
        <CardContent>
          {!barData?.length ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <ChartContainer config={{ value: { label: "Count", color: "#00F0FF" } }} className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                  <CartesianGrid stroke="rgba(0,240,255,0.18)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: "#06b6d4" }} interval={0} angle={-20} textAnchor="end" height={60} />
                  <YAxis tick={{ fill: "#06b6d4" }} allowDecimals={false} />
                  <RTooltip contentStyle={{ background: "#0b1220", borderColor: "#00F0FF", color: "#d1fae5" }} cursor={{ fill: "rgba(0,240,255,0.06)" }} />
                  <Bar dataKey="value" stroke="#00F0FF" fill="#00F0FF" fillOpacity={0.9} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Recent Test Sheets */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Test Sheets</CardTitle>
          <CardDescription>
            Your most recently created test sheets
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sheetsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : recentSheets && recentSheets.length > 0 ? (
            <div className="space-y-2">
              {recentSheets.map((sheet) => (
                <div
                  key={sheet.id}
                  className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 border rounded-lg hover-elevate"
                  data-testid={`sheet-${sheet.id}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm font-semibold text-primary">
                        {sheet.techReference}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {sheet.customer} - {sheet.plantName}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {(() => {
                        const date = new Date(sheet.startTime);
                        return isNaN(date.getTime()) ? "N/A" : format(date, "PPP 'at' p");
                      })()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setLocation(`/test-sheet/${sheet.id}`)}
                      data-testid={`button-view-${sheet.id}`}
                    >
                      <Eye className="h-4 w-4 md:mr-2" />
                      <span className="hidden md:inline">View</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      data-testid={`button-download-${sheet.id}`}
                    >
                      <Download className="h-4 w-4 md:mr-2" />
                      <span className="hidden md:inline">Export</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No test sheets yet</p>
              <Button onClick={() => setLocation('/test-sheet/new')} data-testid="button-create-first">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Test Sheet
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
