import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '..', 'data');
const CALENDAR_MOCK_PATH = path.join(DATA_DIR, 'calendar-mock.json');
const SHEETS_MOCK_PATH = path.join(DATA_DIR, 'sheets-mock.json');

// Ensure data folder exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Global Google Auth and Clients
let auth: any = null;
let calendar: any = null;
let sheets: any = null;

const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
const calendarId = process.env.GOOGLE_CALENDAR_ID;
const sheetId = process.env.GOOGLE_SHEET_ID;

const isGoogleConfigured = !!(serviceAccountKey && calendarId && sheetId);

if (isGoogleConfigured) {
  try {
    const credentials = JSON.parse(serviceAccountKey!);
    auth = new google.auth.JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/spreadsheets'
      ]
    });
    calendar = google.calendar({ version: 'v3', auth });
    sheets = google.sheets({ version: 'v4', auth });
    console.log("SUCCESS: Google API client initialized successfully using Service Account.");
  } catch (error) {
    console.error("ERROR: Failed to initialize Google API clients. Falling back to local file mocks.", error);
    auth = null;
  }
} else {
  console.log("INFO: Google API credentials missing from environment. Using local file mocks (Sprint 3 developer mode).");
}

// -------------------------------------------------------------
// 1. Google Calendar Operations
// -------------------------------------------------------------

export const createCalendarEvent = async (
  occasion: string,
  date: string, // YYYY-MM-DD
  time: string, // HH:MM
  code: string
): Promise<any> => {
  const summary = `Dining Hold — ${occasion} — ${code}`;
  
  // Combine date and time to ISO format (assume IST offset +05:30)
  // e.g. "2026-05-25" and "19:00" -> "2026-05-25T19:00:00+05:30"
  const startDateTime = `${date}T${time}:00+05:30`;
  
  // Default reservation duration is 2 hours
  const endHour = parseInt(time.split(':')[0], 10) + 2;
  const endHourStr = String(endHour).padStart(2, '0');
  const endDateTime = `${date}T${endHourStr}:${time.split(':')[1]}:00+05:30`;

  if (auth && calendar) {
    try {
      const response = await calendar.events.insert({
        calendarId,
        requestBody: {
          summary,
          description: `Voice Reservation Code: ${code}. Occasion: ${occasion}. Booking timezone: IST. We will hold the table for 15 minutes past the start time.`,
          start: { dateTime: startDateTime, timeZone: 'Asia/Kolkata' },
          end: { dateTime: endDateTime, timeZone: 'Asia/Kolkata' },
          status: 'tentative'
        }
      });
      return { eventId: response.data.id, live: true };
    } catch (error) {
      console.error("Google Calendar Insert Error:", error);
      throw error;
    }
  } else {
    // Write to local file mock
    const events = fs.existsSync(CALENDAR_MOCK_PATH) 
      ? JSON.parse(fs.readFileSync(CALENDAR_MOCK_PATH, 'utf-8'))
      : [];
      
    const newEvent = {
      eventId: `mock_event_${Math.random().toString(36).substring(7)}`,
      summary,
      start: startDateTime,
      end: endDateTime,
      code,
      live: false
    };
    
    events.push(newEvent);
    fs.writeFileSync(CALENDAR_MOCK_PATH, JSON.stringify(events, null, 2));
    console.log(`[MOCK CALENDAR] Event created: "${summary}" at ${startDateTime}`);
    return newEvent;
  }
};

export const updateCalendarEvent = async (
  code: string,
  newDate: string,
  newTime: string
): Promise<any> => {
  const startDateTime = `${newDate}T${newTime}:00+05:30`;
  const endHour = parseInt(newTime.split(':')[0], 10) + 2;
  const endHourStr = String(endHour).padStart(2, '0');
  const endDateTime = `${newDate}T${endHourStr}:${newTime.split(':')[1]}:00+05:30`;

  if (auth && calendar) {
    try {
      // Find event first (by querying code in the calendar)
      const list = await calendar.events.list({
        calendarId,
        q: code
      });
      
      const event = list.data.items?.[0];
      if (!event || !event.id) {
        throw new Error(`Calendar event not found for code: ${code}`);
      }
      
      const response = await calendar.events.update({
        calendarId,
        eventId: event.id,
        requestBody: {
          ...event,
          start: { dateTime: startDateTime, timeZone: 'Asia/Kolkata' },
          end: { dateTime: endDateTime, timeZone: 'Asia/Kolkata' }
        }
      });
      return { eventId: response.data.id, updated: true, live: true };
    } catch (error) {
      console.error("Google Calendar Update Error:", error);
      throw error;
    }
  } else {
    // Mock Update
    if (!fs.existsSync(CALENDAR_MOCK_PATH)) return null;
    const events = JSON.parse(fs.readFileSync(CALENDAR_MOCK_PATH, 'utf-8'));
    const index = events.findIndex((e: any) => e.code === code);
    
    if (index !== -1) {
      events[index].start = startDateTime;
      events[index].end = endDateTime;
      fs.writeFileSync(CALENDAR_MOCK_PATH, JSON.stringify(events, null, 2));
      console.log(`[MOCK CALENDAR] Event rescheduled for ${code}: ${startDateTime}`);
      return { eventId: events[index].eventId, updated: true, live: false };
    }
    return null;
  }
};

export const deleteCalendarEvent = async (code: string): Promise<any> => {
  if (auth && calendar) {
    try {
      const list = await calendar.events.list({
        calendarId,
        q: code
      });
      
      const event = list.data.items?.[0];
      if (!event || !event.id) {
        throw new Error(`Calendar event not found for code: ${code}`);
      }
      
      await calendar.events.delete({
        calendarId,
        eventId: event.id
      });
      return { deleted: true, live: true };
    } catch (error) {
      console.error("Google Calendar Delete Error:", error);
      throw error;
    }
  } else {
    // Mock Delete
    if (!fs.existsSync(CALENDAR_MOCK_PATH)) return null;
    const events = JSON.parse(fs.readFileSync(CALENDAR_MOCK_PATH, 'utf-8'));
    const filtered = events.filter((e: any) => e.code !== code);
    fs.writeFileSync(CALENDAR_MOCK_PATH, JSON.stringify(filtered, null, 2));
    console.log(`[MOCK CALENDAR] Event cancelled/removed for code ${code}`);
    return { deleted: true, live: false };
  }
};

// -------------------------------------------------------------
// 2. Google Sheets Operations
// -------------------------------------------------------------

export const appendSheetRow = async (
  timestamp: string,
  date: string,
  time: string, // format "19:00 IST"
  occasion: string,
  partySize: number,
  code: string,
  status: 'Confirmed' | 'Cancelled' | 'Rescheduled',
  sessionId: string
): Promise<any> => {
  const row = [timestamp, date, `${time} (IST)`, occasion, partySize, code, status, sessionId];

  if (auth && sheets) {
    try {
      const response = await sheets.spreadsheets.values.append({
        spreadsheetId: sheetId,
        range: 'A:H',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [row]
        }
      });
      return { spreadsheet: response.data, live: true };
    } catch (error) {
      console.error("Google Sheets Append Error:", error);
      throw error;
    }
  } else {
    // Mock Write to JSON
    const rows = fs.existsSync(SHEETS_MOCK_PATH)
      ? JSON.parse(fs.readFileSync(SHEETS_MOCK_PATH, 'utf-8'))
      : [];
      
    const newRow = {
      Timestamp: timestamp,
      ReservationDate: date,
      ReservationTime: `${time} (IST)`,
      Occasion: occasion,
      PartySize: partySize,
      ReservationCode: code,
      Status: status,
      SessionId: sessionId,
      live: false
    };
    
    rows.push(newRow);
    fs.writeFileSync(SHEETS_MOCK_PATH, JSON.stringify(rows, null, 2));
    console.log(`[MOCK SHEET] Appended Row for ${code}: Status=${status}`);
    return newRow;
  }
};

export const updateSheetRowStatus = async (
  code: string,
  status: 'Cancelled' | 'Rescheduled',
  newDate?: string,
  newTime?: string // format "19:00"
): Promise<any> => {
  if (auth && sheets) {
    try {
      // Find row index containing reservation code
      const list = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: 'A:H'
      });
      
      const rows = list.data.values || [];
      const rowIndex = rows.findIndex((row: any) => row[5] === code); // Col 6 (0-indexed 5) is Code
      
      if (rowIndex === -1) {
        throw new Error(`Reservation row not found in Sheet for code: ${code}`);
      }
      
      const rowNum = rowIndex + 1; // 1-indexed row number
      
      if (status === 'Cancelled') {
        // Update column G (Status, index 6)
        await sheets.spreadsheets.values.update({
          spreadsheetId: sheetId,
          range: `G${rowNum}`,
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [[status]]
          }
        });
      } else if (status === 'Rescheduled' && newDate && newTime) {
        // Update ReservationDate (Col 2 -> B), ReservationTime (Col 3 -> C), and Status (Col 7 -> G)
        await sheets.spreadsheets.values.update({
          spreadsheetId: sheetId,
          range: `B${rowNum}:C${rowNum}`,
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [[newDate, `${newTime} (IST)`]]
          }
        });
        await sheets.spreadsheets.values.update({
          spreadsheetId: sheetId,
          range: `G${rowNum}`,
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [[status]]
          }
        });
      }
      
      return { updated: true, live: true };
    } catch (error) {
      console.error("Google Sheets Update Error:", error);
      throw error;
    }
  } else {
    // Mock Update
    if (!fs.existsSync(SHEETS_MOCK_PATH)) return null;
    const rows = JSON.parse(fs.readFileSync(SHEETS_MOCK_PATH, 'utf-8'));
    const index = rows.findIndex((r: any) => r.ReservationCode === code);
    
    if (index !== -1) {
      rows[index].Status = status;
      if (status === 'Rescheduled' && newDate && newTime) {
        rows[index].ReservationDate = newDate;
        rows[index].ReservationTime = `${newTime} (IST)`;
      }
      fs.writeFileSync(SHEETS_MOCK_PATH, JSON.stringify(rows, null, 2));
      console.log(`[MOCK SHEET] Updated Row for ${code}: Status=${status}`);
      return { updated: true, live: false };
    }
    return null;
  }
};
