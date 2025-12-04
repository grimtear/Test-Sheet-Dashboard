import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, Download, Eye, Search, Filter } from "lucide-react";
import { useLocation } from "wouter";
import type { TestSheet } from "@shared/schema";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import * as XLSX from "xlsx";

export default function AllTestSheets() {
    const [, setLocation] = useLocation();
    const [searchTerm, setSearchTerm] = useState("");
    const [filterPlant, setFilterPlant] = useState("");

    // Fetch all test sheets from all users
    const { data: allSheets, isLoading: sheetsLoading } = useQuery<TestSheet[]>({
        queryKey: ["/api/test-sheets/all"],
    });

    // Get unique plants for filter
    const plants = useMemo(
        () => Array.from(new Set(allSheets?.map(s => s.plantName) || [])).sort(),
        [allSheets]
    );

    // Filter and search
    const filteredSheets = useMemo(() => {
        let results = allSheets || [];

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            results = results.filter(
                s =>
                    s.techReference?.toLowerCase().includes(term) ||
                    s.adminReference?.toLowerCase().includes(term) ||
                    s.customer?.toLowerCase().includes(term) ||
                    s.plantName?.toLowerCase().includes(term)
            );
        }

        if (filterPlant) {
            results = results.filter(s => s.plantName === filterPlant);
        }

        return results.sort((a, b) => (b.startTime || 0) - (a.startTime || 0));
    }, [allSheets, searchTerm, filterPlant]);

    // Export to Excel
    const exportToExcel = () => {
        if (!filteredSheets.length) {
            alert("No sheets to export");
            return;
        }

        const data = filteredSheets.map(sheet => ({
            "Admin Reference": sheet.adminReference,
            "Tech Reference": sheet.techReference,
            "Customer": sheet.customer,
            "Plant": sheet.plantName,
            "Form Type": sheet.formType,
            "Instruction": sheet.instruction,
            "Vehicle Make": sheet.vehicleMake,
            "Vehicle Model": sheet.vehicleModel,
            "Serial (ESN)": sheet.serialEsn,
            "SIM-ID": sheet.simId,
            "Administrator": sheet.administrator,
            "Technician": sheet.technicianName,
            "Start Time": sheet.startTime ? format(new Date(sheet.startTime), "dd-MM-yyyy HH:mm") : "",
            "End Time": sheet.endTime ? format(new Date(sheet.endTime), "dd-MM-yyyy HH:mm") : "",
            "Status": sheet.isDraft ? "Draft" : "Submitted",
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Test Sheets");
        XLSX.writeFile(wb, `test-sheets-${format(new Date(), "yyyy-MM-dd")}.xlsx`);
    };

    return (
        <div className="p-6 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-4">
                    <img src="/NAE logo.jpg" alt="NAE Logo" className="w-12 h-12 object-contain" />
                    <div>
                        <h1 className="text-3xl font-bold">All Test Sheets</h1>
                        <p className="text-muted-foreground mt-1">
                            View and manage test sheets from all users
                        </p>
                    </div>
                </div>
                <Button
                    onClick={exportToExcel}
                    disabled={!filteredSheets.length}
                    variant="outline"
                    className="gap-2"
                >
                    <Download className="h-4 w-4" />
                    Export Excel
                </Button>
            </div>

            {/* Search and Filter */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Search & Filter</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by reference, customer, or plant..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <select
                            value={filterPlant}
                            onChange={(e) => setFilterPlant(e.target.value)}
                            className="px-3 py-2 border border-input rounded-md bg-background text-foreground"
                        >
                            <option value="">All Plants</option>
                            {plants.map(plant => (
                                <option key={plant} value={plant}>{plant}</option>
                            ))}
                        </select>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Showing {filteredSheets.length} of {allSheets?.length || 0} test sheets
                    </p>
                </CardContent>
            </Card>

            {/* Test Sheets Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Test Sheets</CardTitle>
                    <CardDescription>Complete list of all test sheets from all users</CardDescription>
                </CardHeader>
                <CardContent>
                    {sheetsLoading ? (
                        <div className="space-y-3">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <Skeleton key={i} className="h-12 w-full" />
                            ))}
                        </div>
                    ) : filteredSheets.length > 0 ? (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Admin Ref</TableHead>
                                        <TableHead>Tech Ref</TableHead>
                                        <TableHead>Customer</TableHead>
                                        <TableHead>Plant</TableHead>
                                        <TableHead>Admin</TableHead>
                                        <TableHead>Technician</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredSheets.map((sheet) => (
                                        <TableRow key={sheet.id} className="hover:bg-muted/50">
                                            <TableCell className="font-mono text-sm">{sheet.adminReference || "-"}</TableCell>
                                            <TableCell className="font-mono text-sm">{sheet.techReference || "-"}</TableCell>
                                            <TableCell>{sheet.customer}</TableCell>
                                            <TableCell>{sheet.plantName}</TableCell>
                                            <TableCell>{sheet.administrator || "-"}</TableCell>
                                            <TableCell>{sheet.technicianName || "-"}</TableCell>
                                            <TableCell className="text-sm">
                                                {sheet.startTime ? format(new Date(sheet.startTime), "dd-MM-yyyy") : "-"}
                                            </TableCell>
                                            <TableCell>
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${sheet.isDraft
                                                        ? "bg-yellow-100 text-yellow-800"
                                                        : "bg-green-100 text-green-800"
                                                    }`}>
                                                    {sheet.isDraft ? "Draft" : "Submitted"}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => setLocation(`/test-sheet/${sheet.id}`)}
                                                        title="View details"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        title="Export as PDF"
                                                    >
                                                        <Download className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">No test sheets found</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
