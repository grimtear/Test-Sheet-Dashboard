import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import type { TestSheet, TestItem } from "@shared/schema";
import { format } from "date-fns";

export function exportToPDF(sheet: TestSheet, testItems: TestItem[], adminName: string) {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("NAE IT Technology FORM", 105, 15, { align: "center" });

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Technology Reference No", 20, 30);
  doc.setFont("helvetica", "bold");
  doc.text(sheet.techReference, 20, 36);

  doc.setFont("helvetica", "normal");
  doc.text("Form Type", 130, 30);
  doc.setFont("helvetica", "bold");
  doc.text(sheet.formType, 130, 36);

  // Times and Customer Info
  let yPos = 50;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  doc.text("Start Time", 20, yPos);
  doc.text(format(new Date(sheet.startTime), "dd-MM-yyyy HH:mm"), 50, yPos);

  doc.text("Customer", 110, yPos);
  doc.text(sheet.customer, 140, yPos);

  yPos += 6;
  if (sheet.endTime) {
    doc.text("End Time", 20, yPos);
    doc.text(format(new Date(sheet.endTime), "dd-MM-yyyy HH:mm"), 50, yPos);
  }

  doc.text("Plant Name", 110, yPos);
  doc.text(sheet.plantName, 140, yPos);

  // Vehicle Details
  yPos += 10;
  doc.setFont("helvetica", "bold");
  doc.text("Plant Details", 20, yPos);
  yPos += 6;

  const vehicleData = [
    ["Vehicle", sheet.vehicleMake || "N/A", sheet.vehicleModel || "N/A", sheet.voltage?.toString() || "N/A"],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [["", "Make", "Model", "Voltage"]],
    body: vehicleData,
    theme: "grid",
    styles: { fontSize: 8 },
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Serial Numbers
  const serialData = [
    ["Serial (ESN)", sheet.serialEsn || ""],
    ["SIM-ID", sheet.simId || ""],
    ["IZWI Serial", sheet.izwiSerial || ""],
    ["EPS Serial", sheet.epsSerial || ""],
  ];

  autoTable(doc, {
    startY: yPos,
    body: serialData,
    theme: "grid",
    styles: { fontSize: 8 },
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Test Items
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Tests", 20, yPos);
  yPos += 6;

  const testData = testItems.map(item => [
    item.testName,
    item.status,
    item.comment || "",
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [["Test", "Status", "Comment"]],
    body: testData,
    theme: "grid",
    styles: { fontSize: 8 },
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Add new page if needed
  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }

  // Additional Info
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  doc.text(`PDU Installed: ${sheet.pduInstalled || "N/A"}`, 20, yPos);
  doc.text(`EPS Linked: ${sheet.epsLinked || "N/A"}`, 110, yPos);

  yPos += 10;
  doc.text(`Administrator: ${adminName}`, 20, yPos);
  doc.text(`Technician: ${sheet.technicianName || "N/A"}`, 110, yPos);

  yPos += 6;
  doc.text(`Admin Reference: ${sheet.adminReference}`, 20, yPos);

  yPos += 6;
  if (sheet.technicianJobCardNo) {
    doc.text(`Technician Job Card No: ${sheet.technicianJobCardNo}`, 20, yPos);
  }

  if (sheet.notes) {
    yPos += 10;
    doc.setFont("helvetica", "bold");
    doc.text("Notes:", 20, yPos);
    yPos += 6;
    doc.setFont("helvetica", "normal");
    const splitNotes = doc.splitTextToSize(sheet.notes, 170);
    doc.text(splitNotes, 20, yPos);
  }

  // Footer
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.text("Powered by NAE IT Technology", 105, 285, { align: "center" });

  // Download
  doc.save(`Test_Sheet_${sheet.techReference}.pdf`);
}

export function exportToExcel(sheet: TestSheet, testItems: TestItem[], adminName: string) {
  // Create workbook
  const wb = XLSX.utils.book_new();

  // Sheet Info
  const infoData = [
    ["NAE IT Technology TEST SHEET"],
    [""],
    ["Technology Reference", sheet.techReference],
    ["Form Type", sheet.formType],
    ["Admin Reference", sheet.adminReference],
    [""],
    ["Start Time", format(new Date(sheet.startTime), "dd-MM-yyyy HH:mm")],
    ["End Time", sheet.endTime ? format(new Date(sheet.endTime), "dd-MM-yyyy HH:mm") : "In Progress"],
    [""],
    ["Customer", sheet.customer],
    ["Plant Name", sheet.plantName],
    ["Instruction", sheet.instruction || "N/A"],
    [""],
    ["VEHICLE DETAILS"],
    ["Make", sheet.vehicleMake || "N/A"],
    ["Model", sheet.vehicleModel || "N/A"],
    ["Voltage", sheet.voltage?.toString() || "N/A"],
    [""],
    ["SERIAL NUMBERS"],
    ["Serial (ESN)", sheet.serialEsn || ""],
    ["SIM-ID", sheet.simId || ""],
    ["IZWI Serial", sheet.izwiSerial || ""],
    ["EPS Serial", sheet.epsSerial || ""],
    [""],
    ["Units Replaced", sheet.unitsReplaced || "N/A"],
    [""],
  ];

  // Test Results
  infoData.push(["TEST RESULTS"]);
  infoData.push(["Test Name", "Status", "Comment"]);
  testItems.forEach(item => {
    infoData.push([item.testName, item.status, item.comment || ""]);
  });

  infoData.push([""]);
  infoData.push(["ADDITIONAL INFORMATION"]);
  infoData.push(["PDU Installed", sheet.pduInstalled || "N/A"]);
  infoData.push(["EPS Linked", sheet.epsLinked || "N/A"]);
  infoData.push([""]);
  infoData.push(["Administrator", adminName]);
  infoData.push(["Technician", sheet.technicianName || "N/A"]);
  infoData.push(["Technician Job Card No", sheet.technicianJobCardNo || ""]);
  infoData.push(["Odometer/Engine Hours", sheet.odometerEngineHours || ""]);
  infoData.push([""]);
  infoData.push(["NOTES"]);
  infoData.push([sheet.notes || "No notes"]);

  const ws = XLSX.utils.aoa_to_sheet(infoData);

  // Set column widths
  ws['!cols'] = [
    { wch: 25 },
    { wch: 40 },
    { wch: 30 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Test Sheet");

  // Download
  XLSX.writeFile(wb, `Test_Sheet_${sheet.techReference}.xlsx`);
}
