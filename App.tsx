import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { RouteErrorBoundary } from "@/components/ErrorBoundaryVariants";

// Pages
import Landing from "@/pages/landing";
import ProfileSetup from "@/pages/profile-setup";
import Dashboard from "@/pages/dashboard";
import AllTestSheets from "@/pages/all-test-sheets";
import TestSheetForm from "@/pages/test-sheet-form";
import TestSheetsList from "@/pages/test-sheets-list";
import AdminPanel from "@/pages/admin-panel";
import TestSheetEditor from "@/pages/test-sheet-editor";
import NotFound from "@/pages/not-found";
import ReviewPage from "@/pages/review";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { toast } = useToast();

  // Check if profile is complete
  const needsProfileSetup = isAuthenticated && user && (!user.firstName || !user.lastName);

  // Redirect to profile setup if needed
  useEffect(() => {
    if (needsProfileSetup) {
      const currentPath = window.location.pathname;
      if (currentPath !== '/profile-setup') {
        toast({
          title: "Complete Your Profile",
          description: "Please provide your name to continue",
        });
      }
    }
  }, [needsProfileSetup, toast]);

  return (
    <Switch>
      {/* Publicly accessible routes */}
      <Route path="/test-sheet/new">
        {() => <RouteErrorBoundary><TestSheetForm /></RouteErrorBoundary>}
      </Route>
      <Route path="/test-sheet">
        {() => <RouteErrorBoundary><TestSheetForm /></RouteErrorBoundary>}
      </Route>
      <Route path="/test-sheet/:sheetId">
        {(params) => <RouteErrorBoundary><TestSheetForm sheetId={params.sheetId} /></RouteErrorBoundary>}
      </Route>
      {isLoading || !isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          {/* When not authenticated, send all routes to Landing so deep links work after login */}
          <Route path="*" component={Landing} />
        </>
      ) : needsProfileSetup ? (
        <>
          <Route path="/profile-setup" component={ProfileSetup} />
          <Route path="*" component={ProfileSetup} />
        </>
      ) : (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/all-sheets">
            {() => <RouteErrorBoundary><AllTestSheets /></RouteErrorBoundary>}
          </Route>
          <Route path="/review">
            {() => <RouteErrorBoundary><ReviewPage /></RouteErrorBoundary>}
          </Route>
          <Route path="/test-sheets">
            {() => <RouteErrorBoundary><TestSheetsList /></RouteErrorBoundary>}
          </Route>
          <Route path="/admin">
            {() => <RouteErrorBoundary><AdminPanel /></RouteErrorBoundary>}
          </Route>
          <Route path="/editor">
            {() => <RouteErrorBoundary><TestSheetEditor /></RouteErrorBoundary>}
          </Route>
          <Route component={NotFound} />
        </>
      )}
    </Switch>
  );
}

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();

  // Custom sidebar width for better content display
  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  } as React.CSSProperties;

  return (
    <TooltipProvider>
      {isLoading || !isAuthenticated ? (
        <Router />
      ) : (
        <SidebarProvider style={sidebarStyle}>
          <div className="flex h-screen w-full">
            <AppSidebar />
            <div className="flex flex-col flex-1 overflow-hidden">
              <header className="flex items-center gap-4 p-4 border-b bg-background">
                <SidebarTrigger data-testid="button-sidebar-toggle" />
                <div className="flex-1" />
              </header>
              <main className="flex-1 overflow-auto">
                <Router />
              </main>
            </div>
          </div>
        </SidebarProvider>
      )}
      <Toaster />
    </TooltipProvider>
  );
}

export default function App() {
  return (
    <ErrorBoundary showDetails={import.meta.env.DEV}>
      <QueryClientProvider client={queryClient}>
        <AppContent />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
