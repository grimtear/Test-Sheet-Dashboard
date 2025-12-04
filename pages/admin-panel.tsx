import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, Plus, Users, FileText, Clock, Activity, BarChart2, LineChart, TrendingUp, PieChart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { format, subDays, eachDayOfInterval } from "date-fns";
import { Bar, Line, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface UserActivity {
  email: string;
  displayName: string;
  lastLogin: number;
  loginCount: number;
  lastTestSheet: number | null;
  testSheetCount: number;
  sheetsLast30Days?: number;
  sheetsByDay?: { date: string; count: number }[];
}

export default function AdminPanel() {
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch user activity statistics
  const { data: userActivity, isLoading: loadingActivity } = useQuery<UserActivity[]>({
    queryKey: ["user-activity"],
    queryFn: async () => {
      const res = await fetch("/api/admin/user-activity", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch user activity");
      return res.json();
    },
  });

  // Fetch test sheet statistics
  const { data: testSheetStats, isLoading: loadingStats } = useQuery({
    queryKey: ["test-sheets-stats"],
    queryFn: async () => {
      const res = await fetch("/api/admin/test-sheets-stats", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch test sheet stats");
      return res.json();
    },
  });

  // Fetch login statistics
  const { data: loginStats } = useQuery({
    queryKey: ["/api/admin/login-stats"],
    queryFn: async () => {
      const response = await fetch("/api/admin/login-stats", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch login stats");
      return response.json();
    },
  });

  // Calculate statistics from testSheetStats
  const totalTestSheets = testSheetStats?.totalSheets || 0;
  const sheetsLast30Days = testSheetStats?.last30Days || 0;
  const sheetsByUser = testSheetStats?.byUser || [];
  const sheetsByDay = testSheetStats?.byDay || [];
  const activeUsers = userActivity?.filter(u => u.loginCount > 0).length || 0;
  const avgSheetsPerUser = sheetsByUser.length > 0 ? (totalTestSheets / sheetsByUser.length).toFixed(1) : 0;

  // Prepare data for charts
  const sheetsByUserData = {
    labels: sheetsByUser.map((u: any) => u.email || u.name || "Unknown"),
    datasets: [
      {
        label: 'Total Sheets',
        data: sheetsByUser.map((u: any) => u.total),
        backgroundColor: 'rgba(79, 70, 229, 0.8)',
        borderColor: 'rgba(79, 70, 229, 1)',
        borderWidth: 1,
      },
    ],
  };

  // Generate last 30 days for the time series
  const last30Days = eachDayOfInterval({
    start: subDays(new Date(), 29),
    end: new Date(),
  });

  const timeSeriesData = {
    labels: last30Days.map(date => format(date, 'MMM d')),
    datasets: [
      {
        label: 'Sheets Created',
        data: last30Days.map(date => {
          const dayStr = format(date, 'yyyy-MM-dd');
          const dayData = sheetsByDay.find((d: any) => d.date === dayStr);
          return dayData?.count || 0;
        }),
        borderColor: 'rgba(79, 70, 229, 1)',
        tension: 0.3,
        fill: false,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    }
  };

  const formatDate = (timestamp: number | null) => {
    if (!timestamp || !isFinite(timestamp) || timestamp < 1000000000) return "Never";
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime()) || date.getFullYear() < 2000) return "Never";
      return format(date, "MMM dd, yyyy 'at' HH:mm");
    } catch {
      return "Never";
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
          <Settings className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Admin Panel</h1>
          <p className="text-muted-foreground mt-1">
            Manage test sheet templates and system settings
          </p>
        </div>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeUsers}</div>
            <p className="text-xs text-muted-foreground">
              {userActivity?.length || 0} total registered
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Test Sheets</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTestSheets}</div>
            <p className="text-xs text-muted-foreground">
              {sheetsLast30Days} in last 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Sheets/User</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgSheetsPerUser}</div>
            <p className="text-xs text-muted-foreground">
              Average per active user
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activity Today</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loginStats?.todayCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              {loginStats?.todayUniqueUsers || 0} unique users
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <LineChart className="h-5 w-5 text-primary" />
              <CardTitle>Test Sheets Created (Last 30 Days)</CardTitle>
            </div>
            <CardDescription>Daily test sheet creation trend</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <Line data={timeSeriesData} options={chartOptions} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart2 className="h-5 w-5 text-primary" />
              <CardTitle>Sheets by User</CardTitle>
            </div>
            <CardDescription>Top contributors by test sheets created</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <Bar
              data={sheetsByUserData}
              options={{
                ...chartOptions,
                indexAxis: 'y',
                plugins: {
                  ...chartOptions.plugins,
                  legend: {
                    display: false
                  }
                }
              }}
            />
          </CardContent>
        </Card>
      </div>

      {/* User Activity Table */}
      <Card>
        <CardHeader>
          <CardTitle>User Activity</CardTitle>
          <CardDescription>
            View login history and test sheet creation activity
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingActivity ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : userActivity && userActivity.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">User</th>
                    <th className="text-left py-3 px-4 font-medium">Email</th>
                    <th className="text-left py-3 px-4 font-medium">Last Login</th>
                    <th className="text-center py-3 px-4 font-medium">Total Logins</th>
                    <th className="text-left py-3 px-4 font-medium">Last Test Sheet</th>
                    <th className="text-center py-3 px-4 font-medium">Total Sheets</th>
                    <th className="text-center py-3 px-4 font-medium">Last 30 Days</th>
                    <th className="text-center py-3 px-4 font-medium">Activity</th>
                  </tr>
                </thead>
                <tbody>
                  {userActivity.map((activity) => (
                    <tr key={activity.email} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <div className="font-medium">{activity.displayName}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm text-muted-foreground">{activity.email}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center text-sm">
                          <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                          {formatDate(activity.lastLogin)}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          {activity.loginCount}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm text-muted-foreground">
                          {formatDate(activity.lastTestSheet)}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          {activity.testSheetCount}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          {activity.sheetsLast30Days || 0}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{
                              width: `${Math.min(100, (activity.testSheetCount / Math.max(1, totalTestSheets)) * 100)}%`
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No user activity data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Templates Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Test Sheet Templates</CardTitle>
              <CardDescription>
                Manage test categories and default templates
              </CardDescription>
            </div>
            <Button data-testid="button-add-template">
              <Plus className="h-4 w-4 mr-2" />
              Add Template
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/50 p-8 rounded-lg text-center">
            <p className="text-muted-foreground">
              Template management feature coming soon
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Currently using default NAE IT Technology test items
            </p>
          </div>
        </CardContent>
      </Card>

      {/* User Management */}
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>
            View and manage system users
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/50 p-8 rounded-lg text-center">
            <p className="text-muted-foreground">
              User management feature coming soon
            </p>
          </div>
        </CardContent>
      </Card>

      {/* System Settings */}
      <Card>
        <CardHeader>
          <CardTitle>System Settings</CardTitle>
          <CardDescription>
            Configure system-wide preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">Email Domain Restrictions</p>
                <p className="text-sm text-muted-foreground">
                  Currently restricted to: @NAE.co.za, @gmail.com
                </p>
              </div>
              <Button variant="outline" size="sm" disabled>
                Configure
              </Button>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">Auto-numbering Format</p>
                <p className="text-sm text-muted-foreground">
                  Format: UserInitials + Number - PlantName - SiteCode + Timestamp
                </p>
              </div>
              <Button variant="outline" size="sm" disabled>
                Configure
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}