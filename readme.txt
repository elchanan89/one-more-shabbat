# Technical Design Document

## "One More Shabbat" (עוד שבת)

### Version 1.0

---

# 1. Project Overview

**One More Shabbat** is a lightweight family-oriented web application designed to help users plan and organize upcoming Shabbat events.

The application provides a clean, modern, and mobile-friendly interface displaying upcoming Shabbatot as cards. Each card presents basic information such as the weekly Torah portion, Hebrew and Gregorian dates, and a short summary of the planned activities.

Users can click a card to view detailed information and edit the content.

The initial implementation prioritizes:

* Simplicity
* Fast development
* Minimal infrastructure
* Clean Material Design UI
* Local JSON file storage (no database)

---

# 2. Goals

### Primary Goals

* Display upcoming Shabbat events
* Present information in a visually appealing card layout
* Support detailed planning per Shabbat
* Allow editing of existing plans
* Automatically calculate Hebrew dates
* Automatically calculate weekly Torah portions
* Support both desktop and mobile devices

### Non-Goals (Phase 1)

* Authentication
* User management
* Database integration
* Notifications
* Multi-user collaboration

---

# 3. Technology Stack

## Frontend

| Technology                    | Purpose              |
| ----------------------------- | -------------------- |
| Angular (latest stable)       | Frontend framework   |
| Angular Material (Material 3) | UI components        |
| TypeScript                    | Development language |
| RxJS                          | Reactive programming |
| SCSS                          | Styling              |

## Backend

| Technology       | Purpose          |
| ---------------- | ---------------- |
| Node.js          | Runtime          |
| Express.js       | REST API         |
| File System (fs) | JSON persistence |

## Data Storage

```text
/data
   shabbatot.json
```

No database in Phase 1.

---

# 4. User Experience

## Homepage

Page title:

```text
One More Shabbat
```

Subtitle:

```text
All upcoming Shabbat plans in one place
```

### Layout

Responsive card grid:

```text
┌────────────────────┐
│ Parashat Naso      │
│                    │
│ May 23, 2026       │
│ 6 Sivan 5786       │
│                    │
│ Visiting Dobi      │
│                    │
│ [Family]           │
└────────────────────┘
```

---

# 5. Shabbat Card

Each card contains:

| Field          | Description                 |
| -------------- | --------------------------- |
| Parasha        | Weekly Torah portion        |
| Gregorian Date | Standard date               |
| Hebrew Date    | Hebrew calendar date        |
| Summary        | Short description           |
| Category       | Optional tag                |
| Image          | Optional future enhancement |

---

# 6. Shabbat Details View

Clicking a card opens an Angular Material Dialog.

### Content

```text
Parashat Naso

Date:
May 23, 2026
6 Sivan 5786

Summary:
Visiting Dobi

Details:
Leaving Friday morning.
Family lunch.
Staying overnight.

Attendees:
- Dad
- Mom
- Kids

Checklist:
☐ Challah
☐ Wine
☐ Candles

Notes:
Additional planning notes.
```

---

# 7. Editing

Users can edit:

* Summary
* Detailed description
* Attendees
* Notes
* Category
* Checklist items

Changes are persisted immediately to the JSON file through the backend API.

---

# 8. Data Model

```typescript
export interface ShabbatEvent {
  id: string;

  parasha: string;

  gregorianDate: string;

  hebrewDate: string;

  summary: string;

  details: string;

  category?: string;

  attendees?: string[];

  checklist?: ChecklistItem[];

  notes?: string;

  imageUrl?: string;

  createdAt: string;

  updatedAt: string;
}
```

Checklist:

```typescript
export interface ChecklistItem {
  text: string;
  completed: boolean;
}
```

---

# 9. Sample JSON

```json
[
  {
    "id": "2026-05-23",
    "parasha": "Naso",
    "gregorianDate": "2026-05-23",
    "hebrewDate": "6 Sivan 5786",
    "summary": "Visiting Dobi",
    "details": "Leaving Friday morning and staying overnight.",
    "category": "Family",
    "attendees": [
      "Dad",
      "Mom",
      "Kids"
    ],
    "checklist": [
      {
        "text": "Challah",
        "completed": false
      },
      {
        "text": "Wine",
        "completed": true
      }
    ],
    "notes": "",
    "createdAt": "2026-01-01T00:00:00Z",
    "updatedAt": "2026-05-20T12:00:00Z"
  }
]
```

---

# 10. REST API

## Get All Shabbatot

```http
GET /api/shabbatot
```

Response:

```json
[
  ...
]
```

---

## Get Single Shabbat

```http
GET /api/shabbatot/:id
```

---

## Create Shabbat

```http
POST /api/shabbatot
```

---

## Update Shabbat

```http
PUT /api/shabbatot/:id
```

---

## Delete Shabbat

```http
DELETE /api/shabbatot/:id
```

---

# 11. Automatic Jewish Calendar Support

The backend should automatically generate:

* Hebrew Date
* Weekly Torah Portion

Based on the Gregorian date.

Recommended package:

```bash
npm install hebcal
```

or

```bash
npm install @hebcal/core
```

Example:

```typescript
import { HDate } from '@hebcal/core';
```

This removes the need for manual maintenance.

---

# 12. Design System

## Style Direction

Modern, minimalist, family-oriented.

Avoid:

* Enterprise dashboards
* Heavy tables
* Complex administration UI

Inspired by:

* Google Material 3
* Apple Calendar
* Family organizer applications

---

## Typography

Recommended:

```text
Heebo
Assistant
```

---

## Color Palette

Primary:

```text
Warm Blue
```

Secondary:

```text
Soft Gold
```

Background:

```text
Very Light Gray
```

Cards:

```text
White
```

---

## UI Components

Angular Material:

* MatToolbar
* MatCard
* MatDialog
* MatChip
* MatButton
* MatIcon
* MatFormField
* MatInput
* MatCheckbox
* MatMenu

---

# 13. Responsive Behavior

### Desktop

3–4 cards per row.

### Tablet

2 cards per row.

### Mobile

Single-column layout.

All dialogs become full-screen on mobile devices.

---

# 14. Future Enhancements (Phase 2)

### Family Collaboration

Multiple users per household.

### Photos

Upload images for each Shabbat.

### WhatsApp Integration

Share upcoming Shabbat plans.

### Google Calendar Integration

Export to:

* Google Calendar
* Outlook
* Apple Calendar

### Notifications

Upcoming Shabbat reminders.

### Search

Search by:

* Parasha
* Date
* Category

### Timeline View

Chronological display of all future Shabbatot.

### Statistics

Display:

* Number of hosted Shabbatot
* Number of guests
* Most common locations

---

# 15. Suggested Folder Structure

```text
frontend/
└── src
    └── app
        ├── core
        │   ├── services
        │   └── models
        │
        ├── features
        │   └── shabbat
        │       ├── pages
        │       ├── components
        │       ├── dialogs
        │       └── services
        │
        └── shared

backend/
├── data
│   └── shabbatot.json
│
├── routes
├── services
├── controllers
├── middleware
└── app.ts
```

---

# 16. Success Criteria

Phase 1 is considered successful when:

* Users can view upcoming Shabbatot.
* Users can open detailed views.
* Users can edit content.
* Data persists in JSON files.
* Hebrew dates are generated automatically.
* Weekly Torah portions are generated automatically.
* UI is responsive, clean, and visually appealing.
* No database dependency exists.

**Guiding Principle:** Keep the application intentionally simple, elegant, family-friendly, and easy to maintain while providing a delightful planning experience for upcoming Shabbat gatherings.
