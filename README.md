# 🏷️ Hardware Management System

An enterprise-grade **Hardware Asset Management & Machine Label Scanner System** built with **Node.js, Express, SQLite, React, Vite, Tailwind CSS, and Tesseract.js OCR**.

---

## 🚀 Key Features

1. **📷 Live Camera Label Scanner & AI OCR**
   - Live Webcam Feed (`navigator.mediaDevices.getUserMedia`) with device switching (rear/front/USB webcams).
   - High-contrast visual reticle viewfinder with laser scanline animation.
   - Client-side AI OCR powered by **Tesseract.js** with contrast pre-processing for crisp industrial label extraction.
   - File upload option for existing label photos.
   - **1-Click Demo Labels** for instant testing without needing physical hardware at hand.

2. **🏷️ Automatic Serial No. & Model Extraction**
   - Automatically detects and parses **Serial Number** (e.g. `GS3762838`, `S/N:`, `SN:`) and **Model Number** (e.g. `DS-KIT302EFWX`, `Model:`, `M/N:`).
   - Stores the high-resolution scanned label photo in the database archive.

3. **👤 Authorised Person Assignment**
   - Captures who is handling / commissioning the machine (e.g., "Aditya").
   - Displayed in the table and specification card with custom avatar.

4. **📍 Destination Plant with Autocomplete Suggestion**
   - Searchable autocomplete dropdown for plant locations.
   - Suggests previously recorded plants (e.g., "Gujarat", "Maharashtra", "Karnataka").
   - Entering a new plant location dynamically registers it for all future scans.

5. **⏳ Warranty Tracking & Live Pending Days Calculation**
   - Select warranty duration (1 Yr, 2 Yrs, 3 Yrs, 5 Yrs) or pick custom date via calendar.
   - Displays **Date Uploaded** and dynamically computed **Pending Days of Warranty**:
     - 🟢 **Active Warranty**: (e.g. `424 days left`)
     - 🟡 **Expiring Soon**: (e.g. `14 days left` when &le; 30 days)
     - 🔴 **Expired**: (e.g. `Expired 15 days ago`)

6. **📅 Purchasing Date**
   - Calendar date picker for accurate procurement tracking.

7. **📊 Professional Dashboard & Table**
   - Real-time asset metrics cards (Total Assets, Active, Expiring Soon, Expired, Active Plants).
   - Comprehensive data table with thumbnail lightboxes, 1-click serial number copying, search filters, and plant filters.
   - Asset specification inspection card with print layout.
   - CSV export for reporting.

---

## 🛠️ Technology Stack

- **Backend**: Node.js, Express, SQLite (`better-sqlite3` with WAL mode), Multer
- **Frontend**: React 19, Vite, Tailwind CSS v4, Lucide Icons, Canvas Confetti
- **OCR Engine**: Tesseract.js (WebAssembly / Web Worker OCR) + Canvas Contrast Binarization

---

## 🏃 Running the Application

### 1. Install Dependencies
```bash
# In the root folder:
npm install

# In backend folder:
cd backend && npm install

# In frontend folder:
cd ../frontend && npm install
```

### 2. Start the Backend API Server
```bash
cd backend
node server.js
```
The backend server runs on `http://localhost:5000`.

### 3. Start the Frontend Development Server
```bash
cd frontend
npm run dev
```
The frontend UI is accessible at `http://localhost:3000` (or `http://localhost:3001`).

---

## 🧪 Testing the Camera Scanner

1. Open `http://localhost:3001` in your browser.
2. Click **"Scan Label with Camera"** or **"Launch Camera Scanner"**.
3. You can:
   - Use your **Live Webcam** and point it at a physical label or barcode.
   - Upload an image file of a machine label.
   - Click the **"Demo Labels (1-Click Test)"** tab and select the **Hikvision Access Terminal** sample (`Model: DS-KIT302EFWX`, `S/N: GS3762838`).
4. The confirmation modal will pop up with:
   - Serial No. and Model pre-filled!
   - Scanned physical label photo attached!
   - Enter your name as **Authorised Person** (e.g. `Aditya`).
   - Select or search **Destination Plant** (e.g. `Gujarat`).
   - Pick **Purchasing Date** and **Warranty Period**.
   - See the live calculation of **Date Uploaded** and **Pending Days of Warranty**!
5. Click **"Save Machine to Database"**.
