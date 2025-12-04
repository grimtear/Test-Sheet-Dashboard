// Test Sheet Statistics for Admin Analytics
export async function getTestSheetStats() {
    const rows = await fetchAllRows();
    console.log(`[getTestSheetStats] Fetched ${rows.length} rows from Google Sheets`);
    if (rows.length > 0) {
        console.log('[getTestSheetStats] First row:', rows[0]);
        if (rows.length > 1) console.log('[getTestSheetStats] Second row:', rows[1]);
    }

    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

    const stats = {
        last30Days: 0,
        byUser: new Map<string, { email?: string; name?: string; total: number; last30Days: number; lastActivity: number }>(),
        byDay: new Map<string, number>()
    };

    let processedCount = 0;

    const parseStartTime = (s: string | number | undefined): number | null => {
        if (typeof s === 'number') return s;
        if (!s || typeof s !== 'string') return null;
        const m = s.match(/^(\d{2})-(\d{2})-(\d{4})\s+(\d{2}):(\d{2})/);
        if (!m) return null;
        const [, dd, mm, yyyy, HH, MM] = m;
        const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd), Number(HH), Number(MM));
        const t = d.getTime();
        return isNaN(t) ? null : t;
    };

    for (const row of rows) {
        if (!row || row.length === 0) continue;
        const startStr = row[6]; // formatted start time "DD-MM-YYYY HH:mm"
        const startTime = parseStartTime(startStr);
        if (startTime == null) continue;
        processedCount++;

        const adminName = row[20] || 'Unknown'; // administrator
        const userEmail = ''; // not available in sheet data
        const isRecent = startTime >= thirtyDaysAgo;

        if (!stats.byUser.has(adminName)) {
            stats.byUser.set(adminName, {
                email: userEmail,
                name: adminName,
                total: 0,
                last30Days: 0,
                lastActivity: 0
            });
        }
        const userStats = stats.byUser.get(adminName)!;
        userStats.total++;
        if (isRecent) {
            userStats.last30Days++;
            stats.last30Days++;
        }
        if (startTime > userStats.lastActivity) {
            userStats.lastActivity = startTime;
        }

        if (isRecent) {
            const date = new Date(startTime).toISOString().split('T')[0];
            stats.byDay.set(date, (stats.byDay.get(date) || 0) + 1);
        }
    }

    return {
        totalSheets: processedCount,
        last30Days: stats.last30Days,
        byUser: Array.from(stats.byUser.values()),
        byDay: Array.from(stats.byDay.entries()).map(([date, count]) => ({ date, count }))
    };
}
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type ServiceAccount = {
    client_email: string;
    private_key: string;
};

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const SHEETS_APPEND_URL = (sheetId: string, range: string, valueInputOption = "USER_ENTERED") =>
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=${valueInputOption}`;

function base64url(input: Buffer | string): string {
    const buf = Buffer.isBuffer(input) ? input : Buffer.from(input);
    return buf
        .toString("base64")
        .replace(/=/g, "")
        .replace(/\+/g, "-")
        .replace(/\//g, "_");
}

async function getAccessToken(sa: ServiceAccount, scope: string): Promise<string> {
    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + 3600; // 1 hour
    const header = { alg: "RS256", typ: "JWT" };
    const payload = {
        iss: sa.client_email,
        scope,
        aud: GOOGLE_TOKEN_URL,
        iat,
        exp,
    };

    const encHeader = base64url(JSON.stringify(header));
    const encPayload = base64url(JSON.stringify(payload));
    const toSign = `${encHeader}.${encPayload}`;

    const { createSign } = await import("crypto");
    const signer = createSign("RSA-SHA256");
    signer.update(toSign);
    signer.end();
    const signature = signer.sign(sa.private_key);
    const jwt = `${toSign}.${base64url(signature)}`;

    const res = await fetch(GOOGLE_TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
            assertion: jwt,
        }),
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Google token error ${res.status}: ${text}`);
    }
    const json = (await res.json()) as { access_token: string };
    return json.access_token;
}

function loadServiceAccount(): ServiceAccount {
    const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || path.resolve(__dirname, "credentials.json");
    const raw = fs.readFileSync(credPath, "utf8");
    const json = JSON.parse(raw);
    return { client_email: json.client_email, private_key: json.private_key };
}

function formatTs(ts?: number): string {
    if (!ts) return "";
    try {
        const d = new Date(ts);
        const pad = (n: number) => String(n).padStart(2, "0");
        return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch {
        return "";
    }
}

function formatTsSeconds(ts: number): string {
    try {
        const d = new Date(ts);
        const pad = (n: number) => String(n).padStart(2, "0");
        return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    } catch {
        return "";
    }
}

function formatDateOnly(ts: number): string {
    try {
        const d = new Date(ts);
        const pad = (n: number) => String(n).padStart(2, "0");
        return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
    } catch {
        return "";
    }
}

function asVoltageNumber(v?: string): number | string {
    if (!v) return "";
    const m = v.match(/\d+/);
    return m ? Number(m[0]) : v;
}

async function getSheetTitles(sheetId: string, token: string): Promise<string[]> {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?fields=sheets.properties.title`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Sheets metadata error ${res.status}: ${text}`);
    }
    const json = await res.json();
    const titles: string[] = (json.sheets || []).map((s: any) => s?.properties?.title).filter(Boolean);
    return titles;
}

export async function appendTestSheetRow(testSheet: any): Promise<void> {
    const SHEET_ID = process.env.GOOGLE_SHEET_ID || "1_GpYih_KpE4N0OpmY231780v9aga5DaqtLh68xoX6KE";
    const PROVIDED_RANGE = process.env.GOOGLE_SHEET_RANGE;

    const sa = loadServiceAccount();
    const token = await getAccessToken(sa, "https://www.googleapis.com/auth/spreadsheets");

    // Order aligned to provided sample for the first columns, then remaining fields appended
    const nowTs = Date.now();
    const values: (string | number | null)[] = [
        formatTsSeconds(nowTs),
        "", // blank spacer column
        testSheet.adminReference || "",
        testSheet.formType || "",
        formatDateOnly(nowTs),
        testSheet.instruction || "",
        formatTs(testSheet.startTime || 0),
        testSheet.customer || "",
        testSheet.plantName || "",
        testSheet.vehicleMake || "",
        testSheet.vehicleModel || "",
        asVoltageNumber(testSheet.vehicleVoltage || ""),
        testSheet.serialEsn || "",
        testSheet.technicianJobCardNo || "",
        testSheet.userId || "",
        formatTs(testSheet.endTime || 0),
        testSheet.simId || "",
        testSheet.izwiSerial || "",
        testSheet.epsSerial || "",
        testSheet.administrator || "",
        testSheet.technicianName || "",
        (testSheet.notes || "").toString().slice(0, 2000),
        testSheet.isDraft ? "draft" : "submitted",
        testSheet.administratorSignature ? "Y" : "",
        testSheet.Test || "",
        testSheet.StatusComment || "",
        testSheet.GPS || "",
        testSheet.GSM || "",
        testSheet.Ignition || "",
        testSheet.InternalBattery || "",
        testSheet.MainBattery || "",
        testSheet.Buzzer || "",
        testSheet.SeatBelt || "",
        testSheet.TagAuthentication || "",
        testSheet.Panic || "",
        testSheet.EPS || "",
        testSheet.IZWI || "",
        testSheet.BinTip || "",
        testSheet.TPMS || "",
        testSheet.ServiceBrake || "",
        testSheet.GPSComment || "",
        testSheet.GSMComment || "",
        testSheet.IgnitionComment || "",
        testSheet.InternalBatteryComment || "",
        testSheet.MainBatteryComment || "",
        testSheet.BuzzerComment || "",
        testSheet.SeatBeltComment || "",
        testSheet.TagAuthenticationComment || "",
        testSheet.PanicComment || "",
        testSheet.EPSComment || "",
        testSheet.IZWIComment || "",
        testSheet.BinTipComment || "",
        testSheet.TPMSComment || "",
        testSheet.ServiceBrakeComment || "",
        testSheet.pduInstalled || "",
        testSheet.epsLinked || "",
        testSheet.pduVoltageParked || "",
        testSheet.pduVoltageIgnition || "",
        testSheet.pduVoltageIdle || "",
        testSheet.epsPowerOnStatus || "",
        testSheet.epsPowerOnComment || "",
        testSheet.epsTrip1Status || "",
        testSheet.epsTrip1Comment || "",
        testSheet.epsLockCancel1Status || "",
        testSheet.epsLockCancel1Comment || "",
        testSheet.epsTrip2Status || "",
        testSheet.epsTrip2Comment || "",
        testSheet.epsLockCancel2Status || "",
        testSheet.epsLockCancel2Comment || "",
        testSheet.administratorSelect || "",
        testSheet.technicianSelect || "",
    ];

    // Resolve target sheet name
    let sheetName = "Test Sheets"; // Default
    if (PROVIDED_RANGE) {
        if (PROVIDED_RANGE.includes("!")) {
            sheetName = PROVIDED_RANGE.split("!")[0];
        } else {
            sheetName = PROVIDED_RANGE;
        }
    } else {
        try {
            const titles = await getSheetTitles(SHEET_ID, token);
            const preferred = ["Test Sheets", "Test Sheet", "Sheet1"];
            const found = preferred.find((p) => titles.includes(p));
            if (found) sheetName = found;
            else if (titles.length > 0) sheetName = titles[0];
        } catch (err) {
            console.error("Error detecting sheet name, using default:", err);
        }
    }

    // Always append starting from column A, ONLY in column A going down
    // Use A2:A to ensure it only appends in column A vertically
    const RANGE = `${sheetName}!A2:A`;

    console.log("Appending data to Google Sheets at:", {
        range: RANGE,
        values: [values],
    });

    const res = await fetch(SHEETS_APPEND_URL(SHEET_ID, RANGE), {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            range: RANGE,
            majorDimension: "ROWS",
            values: [values],
        }),
    });

    if (res.ok) {
        console.log(`Sheets append success on range: ${RANGE}`);
        return;
    } else {
        const text = await res.text();
        console.error(`Sheets append error ${res.status} for range '${RANGE}': ${text}`);
        throw new Error(`Failed to append to Google Sheets: ${text}`);
    }
}

// Fetch all rows from the selected sheet tab and return raw values
export async function fetchAllRows(): Promise<string[][]> {
    const SHEET_ID = process.env.GOOGLE_SHEET_ID || "1_GpYih_KpE4N0OpmY231780v9aga5DaqtLh68xoX6KE";
    const PROVIDED_RANGE = process.env.GOOGLE_SHEET_RANGE;

    const sa = loadServiceAccount();
    const token = await getAccessToken(sa, "https://www.googleapis.com/auth/spreadsheets.readonly");

    let candidateRanges: string[] = [];
    if (PROVIDED_RANGE) {
        candidateRanges = [PROVIDED_RANGE.includes("!") ? PROVIDED_RANGE : `${PROVIDED_RANGE}!A:ZZ`];
    } else {
        try {
            const titles = await getSheetTitles(SHEET_ID, token);
            const preferred = ["Test Sheets", "Test Sheets"];
            const ordered = [
                ...preferred.filter((p) => titles.includes(p)),
                ...titles.filter((t) => !preferred.includes(t)),
            ];
            candidateRanges = ordered.map((t) => `${t}!A:ZZ`);
        } catch {
            candidateRanges = ["Test Sheets!A:ZZ", "Test Sheets!A:ZZ"];
        }
    }

    let lastErr: Error | undefined;
    for (const RANGE of candidateRanges) {
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(RANGE)}?majorDimension=ROWS`;
        const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
            const json = await res.json();
            const values: string[][] = json.values || [];
            return values;
        }
        const text = await res.text();
        lastErr = new Error(`Sheets read error ${res.status} for range '${RANGE}': ${text}`);
    }
    throw lastErr || new Error("Failed to read sheet values");
}


export async function getSheetsSummary() {
    const rows = await fetchAllRows();
    // rows is array of arrays; we appended without header so assume all data rows; but
    // some spreadsheets may have a header — detect if the third column (adminReference) looks like a header
    const dataRows = rows;
    const total = dataRows.length;
    const plantIndex = 8; // based on append order
    const counts = new Map<string, number>();
    for (const r of dataRows) {
        const plant = (r[plantIndex] || "").toString().trim();
        if (!plant) continue;
        counts.set(plant, (counts.get(plant) || 0) + 1);
    }
    const byPlant = Array.from(counts.entries()).map(([plantName, count]) => ({ plantName, count }));
    // Sort by count desc
    byPlant.sort((a, b) => b.count - a.count);
    return { total, byPlant };
}
