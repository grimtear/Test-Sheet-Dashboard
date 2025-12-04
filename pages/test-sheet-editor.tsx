import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Edit3, Save, AlertCircle, Lock, CheckCircle, Plus, ChevronsUpDown, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

// Restricted editors - only these emails can save changes
const ALLOWED_EDITORS = ["collen@nae.co.za", "bianco@nae.co.za"];

// Form options - matching test-sheet-form.tsx
const FORM_TYPES = [
    "Test Sheet (Stock/Repair)",
    "Test Sheet (Pump/Plant)",
    "Test Sheet (Installation)",
    "Test Sheet (Inspection)",
    "Test Sheet (Breakdown)",
    "Test Sheet (Repair)",
];

const VEHICLE_MAKES = [
    "Mercedes Benz", "Ford", "GMC", "Chevrolet", "Volvo", "Scania",
    "MAN", "DAF", "Iveco", "Freightliner", "Peterbilt", "Kenworth",
    "Mack", "International"
];

const CUSTOMERS = [
    "Anglo American",
    "Assmang",
    "Caliber",
    "Columbus Stainless (Pty)Ltd",
    "DIG",
    "Emalahleni Water Treatment Plant",
    "Epiroc",
    "Exxaro",
    "First Quantum Minerals",
    "Glencore",
    "Glosam Mine",
    "Goedehoop",
    "Greenside",
    "Inceku",
    "Inmine",
    "Isambane Mining",
    "Isibonelo",
    "Khwezela",
    "KleenOil",
    "KSMM Trading",
    "Lee's Dozers (Pty) Ltd",
    "Lubrigard",
    "Mafube",
    "Mbuyelo Mining",
    "Mogalakwena Mine",
    "Moolmans",
    "NAE",
    "Nkomati",
    "Pentalin Processing",
    "Rampart Loading Terminal",
    "Richards Bay Minerals",
    "Scaw Metals Group",
    "Seriti",
    "Spectrum Technical Metals & Minerals Proc",
    "Team Acid Holdings",
    "Thungela Operations",
    "Tokata Group",
    "Transalloys (PTY) LTD",
    "West Reef Plant Hire(PTY)LTD",
    "Zibulo",
];

const ADMINISTRATORS = ["Collen", "Riaan", "Promise", "Melissa", "Rendani", "Bianco"];

const TECHNICIANS = [
    "Cousin", "Doctor", "Dudley", "Eric", "Freedom", "Jeofrey",
    "Kyle", "Micheal", "Mike", "N/A", "Patrick", "Riaan", "Vikesh", "Zondo",
];

const TEST_ITEM_OPTIONS = ["Working", "Faulty", "N/A", "Not Tested"];

const COMMENT_TYPE_OPTIONS = [
    "In Working Order",
    "Not Detected / Faulty",
    "Was not tested by Technician",
    "Bypassed",
    "N/A",
];

const UNITS_REPLACED_OPTIONS = ["Yes", "N/A"];
const PDU_INSTALLED_OPTIONS = ["Installed", "N/A"];

const TEST_ITEMS = [
    { key: "GPS", label: "GPS" },
    { key: "GSM", label: "GSM" },
    { key: "Ignition", label: "Ignition" },
    { key: "InternalBattery", label: "Internal Battery" },
    { key: "MainBattery", label: "Main Battery" },
    { key: "IZWI", label: "IZWI" },
    { key: "BinTip", label: "Bin Tip" },
    { key: "Buzzer", label: "Buzzer" },
    { key: "SeatBelt", label: "Seat Belt" },
    { key: "TagAuthentication", label: "Tag Authentication" },
    { key: "Panic", label: "Panic" },
    { key: "EPS", label: "EPS" },
    { key: "TPMS", label: "TPMS" },
    { key: "ServiceBrake", label: "Service Brake" },
];

interface TestSheetData {
    id?: number;
    formType: string;
    startTime?: string;
    customer: string;
    plantName: string;
    vehicleMake: string;
    vehicleModel: string;
    vehicleVoltage: string;
    serialEsn: string;
    simId: string;
    izwiSerial: string;
    epsSerial: string;
    pduInstalled: string;
    unitsReplaced: string;
    notes: string;
    administrator: string;
    technicianName: string;
    technicianJobCardNo: string;
    odometerEngineHours: string;
    pduVoltageParked: string;
    pduVoltageIgnition: string;
    pduVoltageIdle: string;
    // Test statuses
    GPS: string;
    GSM: string;
    Ignition: string;
    InternalBattery: string;
    MainBattery: string;
    IZWI: string;
    BinTip: string;
    Buzzer: string;
    SeatBelt: string;
    TagAuthentication: string;
    Panic: string;
    EPS: string;
    TPMS: string;
    ServiceBrake: string;
    // Test comments
    GPSComment: string;
    GSMComment: string;
    IgnitionComment: string;
    InternalBatteryComment: string;
    MainBatteryComment: string;
    IZWIComment: string;
    BinTipComment: string;
    BuzzerComment: string;
    SeatBeltComment: string;
    TagAuthenticationComment: string;
    PanicComment: string;
    EPSComment: string;
    TPMSComment: string;
    ServiceBrakeComment: string;
    [key: string]: any;
}

export default function TestSheetEditor() {
    const { toast } = useToast();
    const { user } = useAuth();
    const [selectedSheetId, setSelectedSheetId] = useState<number | null>(null);
    const [editedData, setEditedData] = useState<TestSheetData | null>(null);
    const [hasChanges, setHasChanges] = useState(false);
    const [isCreatingNew, setIsCreatingNew] = useState(false);
    const [openCustomer, setOpenCustomer] = useState(false);
    const [openAdmin, setOpenAdmin] = useState(false);
    const [openTech, setOpenTech] = useState(false);

    const canSave = user?.email && ALLOWED_EDITORS.includes(user.email.toLowerCase());

    const { data: testSheets, isLoading } = useQuery({
        queryKey: ["/api/test-sheets"],
        queryFn: async () => {
            const response = await fetch("/api/test-sheets", { credentials: "include" });
            if (!response.ok) throw new Error("Failed to fetch test sheets");
            return response.json();
        },
    });

    const { data: currentSheet } = useQuery({
        queryKey: ["/api/test-sheets", selectedSheetId],
        enabled: !!selectedSheetId && !isCreatingNew,
        queryFn: async () => {
            const response = await fetch(`/api/test-sheets/${selectedSheetId}`, { credentials: "include" });
            if (!response.ok) throw new Error("Failed to fetch test sheet");
            return response.json();
        },
    });

    const updateMutation = useMutation({
        mutationFn: async (data: TestSheetData) => {
            const response = await fetch(`/api/test-sheets/${selectedSheetId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(data),
            });
            if (!response.ok) throw new Error("Failed to update test sheet");
            return response.json();
        },
        onSuccess: () => {
            toast({ title: "Success", description: "Test sheet updated successfully" });
            setHasChanges(false);
            queryClient.invalidateQueries({ queryKey: ["/api/test-sheets"] });
        },
        onError: (error) => {
            toast({ title: "Error", description: error instanceof Error ? error.message : "Failed to update test sheet", variant: "destructive" });
        },
    });

    const createMutation = useMutation({
        mutationFn: async (data: TestSheetData) => {
            const response = await fetch("/api/test-sheets", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(data),
            });
            if (!response.ok) throw new Error("Failed to create test sheet");
            return response.json();
        },
        onSuccess: (newSheet) => {
            toast({ title: "Success", description: "Test sheet created successfully" });
            setIsCreatingNew(false);
            setHasChanges(false);
            queryClient.invalidateQueries({ queryKey: ["/api/test-sheets"] });
            setSelectedSheetId(newSheet.id);
        },
        onError: (error) => {
            toast({ title: "Error", description: error instanceof Error ? error.message : "Failed to create test sheet", variant: "destructive" });
        },
    });

    useEffect(() => {
        if (currentSheet && !isCreatingNew) {
            setEditedData(currentSheet);
            setHasChanges(false);
        }
    }, [currentSheet, isCreatingNew]);

    const handleFieldChange = (field: string, value: any) => {
        if (!editedData) return;
        setEditedData({ ...editedData, [field]: value });
        setHasChanges(true);
    };

    const handleSave = () => {
        if (!canSave) {
            toast({ title: "Permission Denied", description: "Only Collen and Bianco can save changes", variant: "destructive" });
            return;
        }
        if (!editedData) return;

        if (isCreatingNew) {
            createMutation.mutate(editedData);
        } else if (selectedSheetId) {
            updateMutation.mutate(editedData);
        }
    };

    const handleReset = () => {
        if (isCreatingNew) {
            setIsCreatingNew(false);
            setEditedData(null);
            setHasChanges(false);
        } else if (currentSheet) {
            setEditedData(currentSheet);
            setHasChanges(false);
        }
    };

    const handleCreateNew = () => {
        setIsCreatingNew(true);
        setSelectedSheetId(null);
        setEditedData({
            formType: "",
            customer: "",
            plantName: "",
            vehicleMake: "",
            vehicleModel: "",
            vehicleVoltage: "24V",
            serialEsn: "",
            simId: "",
            izwiSerial: "",
            epsSerial: "",
            pduInstalled: "N/A",
            unitsReplaced: "N/A",
            notes: "",
            administrator: user?.email || "",
            technicianName: `${user?.firstName || ""} ${user?.lastName || ""}`.trim(),
            technicianJobCardNo: "",
            odometerEngineHours: "",
            pduVoltageParked: "",
            pduVoltageIgnition: "",
            pduVoltageIdle: "",
            GPS: "Working",
            GSM: "Working",
            Ignition: "Working",
            InternalBattery: "Working",
            MainBattery: "Working",
            IZWI: "N/A",
            BinTip: "N/A",
            Buzzer: "Working",
            SeatBelt: "Working",
            TagAuthentication: "Working",
            Panic: "Working",
            EPS: "N/A",
            TPMS: "N/A",
            ServiceBrake: "N/A",
            GPSComment: "",
            GSMComment: "",
            IgnitionComment: "",
            InternalBatteryComment: "",
            MainBatteryComment: "",
            IZWIComment: "",
            BinTipComment: "",
            BuzzerComment: "",
            SeatBeltComment: "",
            TagAuthenticationComment: "",
            PanicComment: "",
            EPSComment: "",
            TPMSComment: "",
            ServiceBrakeComment: "",
        });
        setHasChanges(true);
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Edit3 className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold">Test Sheet Editor</h1>
                        <p className="text-muted-foreground mt-1">View and edit existing test sheets</p>
                    </div>
                </div>
                <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${canSave ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'}`}>
                    {canSave ? (<><CheckCircle className="h-4 w-4" /><span className="text-sm font-medium">Editor Access</span></>) : (<><Lock className="h-4 w-4" /><span className="text-sm font-medium">View Only</span></>)}
                </div>
            </div>

            {!canSave && (
                <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800">
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                            <div>
                                <p className="font-medium text-amber-900 dark:text-amber-100">View Only Mode</p>
                                <p className="text-sm text-amber-800 dark:text-amber-200 mt-1">You can view and explore test sheets, but only Collen and Bianco can save changes.</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Select Test Sheet</CardTitle>
                                <CardDescription>Choose a test sheet to view or edit</CardDescription>
                            </div>
                            {canSave && (<Button onClick={handleCreateNew} size="sm" variant="outline" className="shrink-0"><Plus className="h-4 w-4 mr-1" />Create New</Button>)}
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (<div className="text-center py-4 text-muted-foreground">Loading...</div>) : testSheets && testSheets.length > 0 ? (
                            <div className="space-y-2 max-h-[600px] overflow-y-auto">
                                {isCreatingNew && (<button onClick={() => { }} className="w-full text-left p-3 rounded-lg border border-primary bg-primary/10"><div className="font-medium text-sm text-primary">New Test Sheet</div><div className="text-xs text-muted-foreground mt-1">Currently editing</div></button>)}
                                {testSheets.map((sheet: any) => (<button key={sheet.id} onClick={() => { setIsCreatingNew(false); setSelectedSheetId(sheet.id); }} className={`w-full text-left p-3 rounded-lg border transition-colors ${selectedSheetId === sheet.id && !isCreatingNew ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted/50'}`}><div className="font-medium text-sm">{sheet.adminReference || `Sheet #${sheet.id}`}</div><div className="text-xs text-muted-foreground mt-1">{sheet.customer} - {sheet.plantName}</div><div className="text-xs text-muted-foreground">{sheet.formType}</div></button>))}
                            </div>
                        ) : (<div className="text-center py-8 text-muted-foreground"><p className="mb-4">No test sheets found</p>{canSave && (<Button onClick={handleCreateNew} variant="default" size="sm" className="mt-2"><Plus className="h-4 w-4 mr-2" />Create New Test Sheet</Button>)}</div>)}
                    </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>{isCreatingNew ? 'Creating New Test Sheet' : editedData ? `Editing: ${editedData.adminReference || `Sheet #${selectedSheetId}`}` : 'Select a test sheet'}</CardTitle>
                                <CardDescription>{editedData ? 'Make changes to the test sheet data' : 'Choose a test sheet from the list to begin'}</CardDescription>
                            </div>
                            {hasChanges && (<span className="text-sm text-amber-600 dark:text-amber-400 font-medium">Unsaved changes</span>)}
                        </div>
                    </CardHeader>
                    <CardContent>
                        {!editedData ? (<div className="text-center py-12 text-muted-foreground"><Edit3 className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>Select a test sheet to view or edit</p></div>) : (
                            <div className="space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto px-1 pb-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2"><Label>Form Type *</Label><Select value={editedData.formType || ''} onValueChange={(value) => handleFieldChange('formType', value)}><SelectTrigger><SelectValue placeholder="Select form type" /></SelectTrigger><SelectContent>{FORM_TYPES.map((type) => (<SelectItem key={type} value={type}>{type}</SelectItem>))}</SelectContent></Select></div>
                                    <div className="space-y-2"><Label>Start Time</Label><Input type="datetime-local" value={editedData.startTime || ''} onChange={(e) => handleFieldChange('startTime', e.target.value)} /></div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2"><Label>Customer *</Label><Popover open={openCustomer} onOpenChange={setOpenCustomer}><PopoverTrigger asChild><Button variant="outline" role="combobox" aria-expanded={openCustomer} className="w-full justify-between">{editedData.customer || "Select customer"}<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" /></Button></PopoverTrigger><PopoverContent className="w-[400px] p-0"><Command><CommandInput placeholder="Search customer..." /><CommandEmpty>No customer found.</CommandEmpty><CommandList><CommandGroup>{CUSTOMERS.map((customer) => (<CommandItem key={customer} value={customer} onSelect={(currentValue) => { handleFieldChange('customer', currentValue); setOpenCustomer(false); }}><Check className={cn("mr-2 h-4 w-4", editedData.customer?.toLowerCase() === customer.toLowerCase() ? "opacity-100" : "opacity-0")} />{customer}</CommandItem>))}</CommandGroup></CommandList></Command></PopoverContent></Popover></div>
                                    <div className="space-y-2"><Label>Plant Name *</Label><Input value={editedData.plantName || ''} onChange={(e) => handleFieldChange('plantName', e.target.value)} placeholder="Enter plant name" /></div>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-2"><Label>Vehicle Make</Label><Select value={editedData.vehicleMake || ''} onValueChange={(value) => handleFieldChange('vehicleMake', value)}><SelectTrigger><SelectValue placeholder="Select make" /></SelectTrigger><SelectContent>{VEHICLE_MAKES.map((make) => (<SelectItem key={make} value={make}>{make}</SelectItem>))}</SelectContent></Select></div>
                                    <div className="space-y-2"><Label>Vehicle Model</Label><Input value={editedData.vehicleModel || ''} onChange={(e) => handleFieldChange('vehicleModel', e.target.value)} placeholder="Enter model" /></div>
                                    <div className="space-y-2"><Label>Vehicle Voltage</Label><Input value={editedData.vehicleVoltage || ''} onChange={(e) => handleFieldChange('vehicleVoltage', e.target.value)} placeholder="e.g., 24V" /></div>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-2"><Label>Serial (ESN)</Label><Input value={editedData.serialEsn || ''} onChange={(e) => handleFieldChange('serialEsn', e.target.value)} placeholder="Enter serial number" /></div>
                                    <div className="space-y-2"><Label>SIM-ID</Label><Input value={editedData.simId || ''} onChange={(e) => handleFieldChange('simId', e.target.value)} placeholder="Enter SIM ID" /></div>
                                    <div className="space-y-2"><Label>IZWI Serial</Label><Input value={editedData.izwiSerial || ''} onChange={(e) => handleFieldChange('izwiSerial', e.target.value)} placeholder="Enter IZWI serial" /></div>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-2"><Label>EPS Serial</Label><Input value={editedData.epsSerial || ''} onChange={(e) => handleFieldChange('epsSerial', e.target.value)} placeholder="Enter EPS serial" /></div>
                                    <div className="space-y-2"><Label>Units Replaced</Label><Select value={editedData.unitsReplaced || 'N/A'} onValueChange={(value) => handleFieldChange('unitsReplaced', value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{UNITS_REPLACED_OPTIONS.map((option) => (<SelectItem key={option} value={option}>{option}</SelectItem>))}</SelectContent></Select></div>
                                    <div className="space-y-2"><Label>PDU Installed</Label><Select value={editedData.pduInstalled || 'N/A'} onValueChange={(value) => handleFieldChange('pduInstalled', value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PDU_INSTALLED_OPTIONS.map((option) => (<SelectItem key={option} value={option}>{option}</SelectItem>))}</SelectContent></Select></div>
                                </div>

                                <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
                                    <h3 className="font-semibold text-sm">Test Results</h3>
                                    <div className="space-y-2">
                                        <div className="grid grid-cols-7 gap-2 text-xs font-medium text-muted-foreground pb-2 border-b"><div className="col-span-2">Test</div><div className="col-span-2">Status</div><div className="col-span-3">Comment</div></div>
                                        {TEST_ITEMS.map((item) => (<div key={item.key} className="grid grid-cols-7 gap-2 items-center"><div className="col-span-2 text-sm">{item.label}</div><div className="col-span-2"><Select value={editedData[item.key] || 'N/A'} onValueChange={(value) => handleFieldChange(item.key, value)}><SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger><SelectContent>{TEST_ITEM_OPTIONS.map((option) => (<SelectItem key={option} value={option}>{option}</SelectItem>))}</SelectContent></Select></div><div className="col-span-3"><Select value={editedData[`${item.key}Comment`] || 'N/A'} onValueChange={(value) => handleFieldChange(`${item.key}Comment`, value)}><SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger><SelectContent>{COMMENT_TYPE_OPTIONS.map((option) => (<SelectItem key={option} value={option}>{option}</SelectItem>))}</SelectContent></Select></div></div>))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-2"><Label>PDU Voltage (Parked)</Label><Input value={editedData.pduVoltageParked || ''} onChange={(e) => handleFieldChange('pduVoltageParked', e.target.value)} placeholder="e.g., 24.2V" /></div>
                                    <div className="space-y-2"><Label>PDU Voltage (Ignition)</Label><Input value={editedData.pduVoltageIgnition || ''} onChange={(e) => handleFieldChange('pduVoltageIgnition', e.target.value)} placeholder="e.g., 24.5V" /></div>
                                    <div className="space-y-2"><Label>PDU Voltage (Idle)</Label><Input value={editedData.pduVoltageIdle || ''} onChange={(e) => handleFieldChange('pduVoltageIdle', e.target.value)} placeholder="e.g., 28.0V" /></div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2"><Label>Administrator</Label><Popover open={openAdmin} onOpenChange={setOpenAdmin}><PopoverTrigger asChild><Button variant="outline" role="combobox" aria-expanded={openAdmin} className="w-full justify-between">{editedData.administrator || "Select administrator"}<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" /></Button></PopoverTrigger><PopoverContent className="w-[250px] p-0"><Command><CommandInput placeholder="Search..." /><CommandEmpty>No administrator found.</CommandEmpty><CommandList><CommandGroup>{ADMINISTRATORS.map((admin) => (<CommandItem key={admin} value={admin} onSelect={(currentValue) => { handleFieldChange('administrator', currentValue); setOpenAdmin(false); }}><Check className={cn("mr-2 h-4 w-4", editedData.administrator?.toLowerCase() === admin.toLowerCase() ? "opacity-100" : "opacity-0")} />{admin}</CommandItem>))}</CommandGroup></CommandList></Command></PopoverContent></Popover></div>
                                    <div className="space-y-2"><Label>Technician Name</Label><Popover open={openTech} onOpenChange={setOpenTech}><PopoverTrigger asChild><Button variant="outline" role="combobox" aria-expanded={openTech} className="w-full justify-between">{editedData.technicianName || "Select technician"}<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" /></Button></PopoverTrigger><PopoverContent className="w-[250px] p-0"><Command><CommandInput placeholder="Search..." /><CommandEmpty>No technician found.</CommandEmpty><CommandList><CommandGroup>{TECHNICIANS.map((tech) => (<CommandItem key={tech} value={tech} onSelect={(currentValue) => { handleFieldChange('technicianName', currentValue); setOpenTech(false); }}><Check className={cn("mr-2 h-4 w-4", editedData.technicianName?.toLowerCase() === tech.toLowerCase() ? "opacity-100" : "opacity-0")} />{tech}</CommandItem>))}</CommandGroup></CommandList></Command></PopoverContent></Popover></div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2"><Label>Job Card No.</Label><Input value={editedData.technicianJobCardNo || ''} onChange={(e) => handleFieldChange('technicianJobCardNo', e.target.value)} placeholder="Enter job card number" /></div>
                                    <div className="space-y-2"><Label>Odometer/Engine Hours</Label><Input value={editedData.odometerEngineHours || ''} onChange={(e) => handleFieldChange('odometerEngineHours', e.target.value)} placeholder="Enter reading" /></div>
                                </div>

                                <div className="space-y-2"><Label>Notes</Label><Textarea value={editedData.notes || ''} onChange={(e) => handleFieldChange('notes', e.target.value)} rows={3} placeholder="Additional notes or comments..." /></div>

                                <div className="flex gap-3 pt-4 border-t">
                                    <Button onClick={handleSave} disabled={!canSave || !hasChanges || updateMutation.isPending || createMutation.isPending} className="flex-1"><Save className="h-4 w-4 mr-2" />{updateMutation.isPending || createMutation.isPending ? 'Saving...' : isCreatingNew ? 'Create Test Sheet' : 'Save Changes'}</Button>
                                    <Button onClick={handleReset} variant="outline" disabled={!hasChanges}>{isCreatingNew ? 'Cancel' : 'Reset'}</Button>
                                </div>

                                {!canSave && hasChanges && (<p className="text-sm text-amber-600 dark:text-amber-400 text-center">Your changes won't be saved. Only Collen and Bianco can save edits.</p>)}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}