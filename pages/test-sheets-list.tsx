import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, Download, Trash2, Eye, Search } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";
import type { TestSheet } from "@shared/schema";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function TestSheetsList() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: sheets, isLoading } = useQuery<TestSheet[]>({
    queryKey: ["/api/test-sheets"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/test-sheets/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/test-sheets"] });
      toast({
        title: "Deleted",
        description: "Test sheet deleted successfully",
      });
      setDeleteId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredSheets = sheets?.filter((sheet) => {
    const q = searchQuery.toLowerCase();
    const techRef = (sheet.techReference || "").toLowerCase();
    const customer = (sheet.customer || "").toLowerCase();
    const plant = (sheet.plantName || "").toLowerCase();
    return techRef.includes(q) || customer.includes(q) || plant.includes(q);
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">My Test Sheets</h1>
        <p className="text-muted-foreground mt-1">
          View and manage all your test sheets
        </p>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by reference, customer, or plant name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search"
            />
          </div>
        </CardContent>
      </Card>

      {/* Test Sheets List */}
      <Card>
        <CardHeader>
          <CardTitle>All Test Sheets</CardTitle>
          <CardDescription>
            {filteredSheets?.length || 0} test sheet(s) found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : filteredSheets && filteredSheets.length > 0 ? (
            <div className="space-y-2">
              {filteredSheets.map((sheet) => (
                <div
                  key={sheet.id}
                  className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 border rounded-lg hover-elevate"
                  data-testid={`sheet-item-${sheet.id}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-mono text-sm font-semibold text-primary">
                        {sheet.techReference}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Customer:</span>{" "}
                        <span className="font-medium">{sheet.customer}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Plant:</span>{" "}
                        <span className="font-medium">{sheet.plantName}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Admin Ref:</span>{" "}
                        <span className="font-mono text-xs">{sheet.adminReference}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Date:</span>{" "}
                        <span>
                          {(() => {
                            const d = new Date(sheet.startTime || 0);
                            return isNaN(d.getTime()) || d.getFullYear() < 2000
                              ? "N/A"
                              : format(d, "PPP");
                          })()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setLocation(`/test-sheet/${sheet.id}`)}
                      data-testid={`button-view-sheet-${sheet.id}`}
                    >
                      <Eye className="h-4 w-4 md:mr-2" />
                      <span className="hidden md:inline">View</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      data-testid={`button-export-sheet-${sheet.id}`}
                    >
                      <Download className="h-4 w-4 md:mr-2" />
                      <span className="hidden md:inline">Export</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setDeleteId(sheet.id)}
                      data-testid={`button-delete-sheet-${sheet.id}`}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                {searchQuery ? "No test sheets match your search" : "No test sheets yet"}
              </p>
              {!searchQuery && (
                <Button onClick={() => setLocation('/test-sheet/new')} data-testid="button-create-new">
                  Create Your First Test Sheet
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Test Sheet</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this test sheet? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
