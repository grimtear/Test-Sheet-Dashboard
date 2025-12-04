import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";

type Draft = Record<string, any> | null;

export default function ReviewPage() {
    const [, setLocation] = useLocation();
    const [draft, setDraft] = useState<Draft>(null);

    useEffect(() => {
        try {
            const saved = localStorage.getItem("nae-tech-form-draft");
            if (saved) setDraft(JSON.parse(saved));
        } catch {
            setDraft(null);
        }
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 p-6">
            <div className="max-w-4xl mx-auto">
                <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur">
                    <CardHeader>
                        <CardTitle>Review</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {!draft ? (
                            <div className="text-muted-foreground">No draft found. Please fill out the form first.</div>
                        ) : (
                            <div className="space-y-2">
                                <div><span className="text-sm text-muted-foreground">Admin Reference:</span> <span className="font-mono">{draft.adminReference || "(not set)"}</span></div>
                                <div><span className="text-sm text-muted-foreground">Customer:</span> {draft.customer || "-"}</div>
                                <div><span className="text-sm text-muted-foreground">Plant Name:</span> {draft.plantName || "-"}</div>
                                <div><span className="text-sm text-muted-foreground">Technician:</span> {draft.technicianName || "-"}</div>
                                <div><span className="text-sm text-muted-foreground">Start Time:</span> {draft.startTime || "-"}</div>
                                <div><span className="text-sm text-muted-foreground">End Time:</span> {draft.endTime || "-"}</div>
                            </div>
                        )}
                        <div className="flex gap-3">
                            <Button variant="outline" onClick={() => setLocation('/test-sheet/new')}>Back to Form</Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
