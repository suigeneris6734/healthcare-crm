# Healthcare Outreach CRM Dashboard

Local-first Version 1 CRM dashboard for outreach to Marmara-region OSGB organizations and private hospitals across Turkey.

## Tech Stack
- Frontend: React, Vite, TailwindCSS, React Router
- Backend: Node.js, Express, SQLite, better-sqlite3, node-cron, multer, csv-parser

## Folder Structure
- `backend/` Express API and SQLite database
- `frontend/` React dashboard
- `backend/database/healthcare-crm.db` SQLite DB
- `backend/backups/` local DB backups

## Install
```bash
cd 01_SOURCE-CODE/healthcare-crm-dashboard/backend
npm install
npm run seed
npm start

cd ../frontend
npm install
npm run dev
```

## API
Backend runs on `http://localhost:4000`. Frontend expects `VITE_API_BASE` or defaults to `http://localhost:4000/api`.

## Seed Data
Run `npm run seed` in backend. It creates 15 fake OSGB and 15 fake private hospital records. No real personal data.

## CSV Import
Sample files are in `03_SAMPLE-DATA/` at project root:
- `osgb_marmara_sample.csv`
- `private_hospitals_turkey_sample.csv`

## Backup / Restore
Use the Backups page or API endpoints. Restore creates an automatic safety backup first. Backup filenames are strictly validated.

## Version 1 Limitations
- No automatic email sending.
- Gmail/Outlook providers are placeholders only.
- PDF report export is not implemented.
- Organization form UI is minimal; API supports CRUD.

## Roadmap
- Gmail/Outlook OAuth and email matching.
- Rich organization form UX.
- HTML/PDF reports.
- Role-based local authentication if needed.


## Run Verification Fix

Date: 2026-05-25

### Actual Project Location

The project is stored in the Google Drive synced folder:

```bash
/Users/sahincarsanbali/Library/CloudStorage/GoogleDrive-sahincarsanbalide@gmail.com/Meine Ablage/Healthcare-Outreach-CRM
```

A convenience symlink was created so this path also works from the macOS home folder:

```bash
~/Healthcare-Outreach-CRM
```

Therefore the documented relative commands work if your terminal is in:

```bash
cd ~
```

### Backend Path

```bash
~/Healthcare-Outreach-CRM/01_SOURCE-CODE/healthcare-crm-dashboard/backend
```

### Frontend Path

```bash
~/Healthcare-Outreach-CRM/01_SOURCE-CODE/healthcare-crm-dashboard/frontend
```

### Working Backend Commands

```bash
cd ~/Healthcare-Outreach-CRM/01_SOURCE-CODE/healthcare-crm-dashboard/backend
npm install
npm run init-db
npm run seed
npm start
```

Available backend scripts:

- `npm start`
- `npm run dev`
- `npm run seed`
- `npm run init-db`

### Working Frontend Commands

Open a second terminal:

```bash
cd ~/Healthcare-Outreach-CRM/01_SOURCE-CODE/healthcare-crm-dashboard/frontend
npm install
npm run dev
```

Available frontend scripts:

- `npm run dev`
- `npm run build`
- `npm run preview`

### Tailwind/PostCSS Fix Applied

The frontend was stabilized on the simpler Tailwind v3 configuration:

- `tailwindcss` pinned to `^3.4.17`
- `postcss` and `autoprefixer` configured normally
- `postcss.config.js` uses `tailwindcss` + `autoprefixer`
- `tailwind.config.js` includes `index.html` and `src/**/*.{js,jsx}`
- removed the Tailwind v4 PostCSS plugin dependency from `package.json`

This fixes the Vite overlay error:

```text
It looks like you're trying to use tailwindcss directly as a PostCSS plugin
```

### Verification Results

Verified commands:

```bash
cd ~/Healthcare-Outreach-CRM/01_SOURCE-CODE/healthcare-crm-dashboard/backend
npm install
npm run init-db
npm run seed
npm start
```

Backend verification:

```bash
curl http://localhost:4000/api/health
# {"ok":true}
```

Frontend verification:

```bash
cd ~/Healthcare-Outreach-CRM/01_SOURCE-CODE/healthcare-crm-dashboard/frontend
npm install
npm run build
npm run dev
```

`http://localhost:5173/` returns HTTP 200 and no Tailwind/PostCSS error overlay was present in the Vite output.

### Remaining Known Limitations

- V1 still does not send real emails.
- Gmail/Outlook integration remains placeholder-only.
- Organization form UI is minimal; do not start V1.1 until V1 run path is confirmed by the user.


## V1.2 — UI/UX, Excel Import, SMTP Sending

### What changed

- Improved Turkish UI labels and non-technical dashboard wording.
- Dashboard task rows now show completed state as `Gönderildi ✓` and disable completed buttons.
- Added user-friendly empty/loading states and simple notifications.
- Improved `Kurumlar` page with:
  - search by name/email/city
  - filters by type/status/city
  - add/edit/delete/detail actions
  - full create/edit form
- Added Excel/CSV import preview and save flow.
- Added SMTP settings and controlled manual sending.
- Improved `Mail Geçmişi` with date, organization, action type, subject, from, to, status, note.
- Improved `Takipler` page with due follow-up list, days since first email and compose action.

### Excel / CSV Import

Supported file types:

- `.xlsx`
- `.xls`
- `.csv`

Go to `Kurumlar` → `Excel / CSV İçe Aktar`.

Choose list type:

- `Marmara OSGB Listesi`
- `Türkiye Özel Hastaneler Listesi`

Accepted English columns:

```text
name, city, district, email, phone, website, contact_person, notes
```

Accepted Turkish columns:

```text
Kurum Adı, Şehir, İlçe, E-posta, Telefon, Web Sitesi, Yetkili Kişi, Notlar
```

Flow:

1. Select file.
2. Click `Önizle`.
3. Review total/invalid/duplicate rows.
4. Click `Kaydet`.

Duplicate detection is based on email when possible.

### SMTP Setup

Go to `Ayarlar`.

Fill:

- Sender Name
- Sender Email
- SMTP Host
- SMTP Port
- SMTP Secure
- SMTP Username
- SMTP Password / App Password

Click `Kaydet`.

Click `Test Mail Ayarları` to send a test email to the sender email.

Security note: SMTP password is stored locally in SQLite for V1.2 local-first use. It is not returned to the frontend after saving; the frontend shows a masked value. Use an app password where possible.

### Sending Email from Dashboard

1. Go to `Dashboard`.
2. Generate today's tasks if needed.
3. Click `Mail Hazırla` on a row.
4. Review recipient, subject and body.
5. Click final `Gönder`.

The app does not send bulk email automatically. Email is sent only after the user clicks `Gönder`.

On successful send:

- `email_actions` record is created.
- Organization status is updated.
- Daily task is completed if linked.
- First email sets follow-up date to today + 15 days.
- Activity log is created.

### V1.2 Run Commands

Backend:

```bash
cd ~/Healthcare-Outreach-CRM/01_SOURCE-CODE/healthcare-crm-dashboard/backend
npm install
npm run init-db
npm run seed
npm start
```

Frontend:

```bash
cd ~/Healthcare-Outreach-CRM/01_SOURCE-CODE/healthcare-crm-dashboard/frontend
npm install
npm run dev
```

Open:

```text
http://localhost:5173
```

### V1.2 Limitations

- Gmail/Outlook OAuth is not implemented; it remains future roadmap.
- SMTP is the practical V1.2 sending solution.
- No automatic/bulk sending.
- `xlsx` dependency may report npm audit advisories; review before exposing the app beyond local use.
- Local-first app has no authentication yet; keep it on trusted localhost/private machine.


## V1.2 Usability / Bug-fix Pass

Date: 2026-05-25

This pass does not add a new architecture and does not remove V1/V1.2 features. It improves usability and fixes observed issues.

### Mail Compose Fixes

- `Mail Hazırla` now pre-fills the recipient from `organization.email` or the task row email.
- If no email exists, the modal shows: `Bu kurum için e-posta adresi kayıtlı değil.`
- Sending is blocked when the recipient field is empty.
- SMTP failures show a friendly message: `Mail gönderilemedi. Lütfen SMTP ayarlarını kontrol edin.`
- Failed SMTP sending does not mark the task or organization as sent.

### Manual Sent Confirmation

`Gönderildi İşaretle` is for emails sent outside the system. It now asks for confirmation:

```text
Bu işlem mailin sistem dışından gönderildiğini işaretler. Devam etmek istiyor musunuz?
```

If confirmed, the task becomes `Gönderildi ✓`, KPIs update, an `email_actions` record is created and an activity log is created.

### Healthcare UI Improvements

- Softer healthcare style: light blue background, white cards, healthcare blue accents.
- Larger readable section titles.
- Clearer status badges.
- Completed task rows are green-tinted and muted.
- Today tasks table now shows: `Kurum`, `E-posta`, `Tür`, `Görev`, `Durum`, `Aksiyonlar`.

### Data Collection Folder Note

If files are placed under `data_collection_healthcare`, they are source files only. They are not automatically imported into SQLite.

To import them into the app database:

```text
Kurumlar → Excel/CSV İçe Aktar → Liste tipi seç → Dosya seç → Önizle → Kaydet
```

The UI now includes this helper text.

### SMTP Settings Helper

The Settings page now explains that SMTP is needed for sending through the user's mail account and that Gmail may require an App Password. Saved SMTP passwords are not exposed back to the frontend.

### Verification

- Frontend build succeeded.
- Backend `/api/health` returned `{ok:true}`.
- SMTP missing-settings error returns clearly and does not mark sent.
- Frontend dev server returned HTTP 200 at `localhost:5173`.


## V1.2 Usability Fixes

Date: 2026-05-25

### Bugs Fixed

- `Mail Hazırla` recipient field now uses the organization/task email.
- Empty recipient is blocked with: `Bu kurum için e-posta adresi kayıtlı değil.`
- SMTP missing/failed configuration does not mark a task or organization as sent.
- SMTP failure shows: `Mail gönderilemedi. Lütfen SMTP ayarlarını kontrol edin.`
- Manual `Gönderildi İşaretle` now asks confirmation before marking external/manual sending.
- Completed task rows become green-tinted and show `Gönderildi ✓`.
- KPI counts update after successful manual sent marking or successful SMTP sending.

### UI/UX Changes

- Applied healthcare-style UI: light blue background, white soft cards, blue accent buttons and clearer spacing.
- Today task table columns are now: Kurum, E-posta, Tür, Görev, Durum, Aksiyonlar.
- Main UI avoids raw technical enum values and uses Turkish labels.
- Import panel now explains that `data_collection_healthcare` files are source files only; files must be imported through the UI.
- Sidebar pages include explanatory text or useful empty states for non-technical users.

### QA Verification

Verified:

- Dashboard opens at `http://localhost:5173`.
- Backend health endpoint returns `{ok:true}`.
- Compose modal source contains recipient prefill + empty recipient guard.
- Empty recipient cannot be sent from the modal.
- SMTP missing config returns an error and does not mark sent.
- Manual sent confirmation exists in UI source.
- Manual sent backend flow creates an email action and updates KPI/task completion.
- Healthcare theme CSS is applied.
- No obvious raw enum option rendering remains in main UI source.
- Import helper text is visible in source.

### Commands

Backend:

```bash
cd ~/Healthcare-Outreach-CRM/01_SOURCE-CODE/healthcare-crm-dashboard/backend
npm install
npm run init-db
npm run seed
npm start
```

Frontend:

```bash
cd ~/Healthcare-Outreach-CRM/01_SOURCE-CODE/healthcare-crm-dashboard/frontend
npm install
npm run dev
```

### Excel Import

Go to:

```text
Kurumlar → Excel/CSV İçe Aktar → Liste tipi seç → Dosya seç → Önizle → Kaydet
```

Files in `data_collection_healthcare` are source files only. Putting files in the folder does not import them into SQLite automatically.

### SMTP Requirement

Real email sending still requires valid SMTP credentials in `Ayarlar`. Gmail may require an App Password. Gmail/Outlook OAuth remains future roadmap only.

## V1.2 Demo Stabilization Fixes

Date: 2026-05-25

### Daily Task Idempotency

`Bugünün 10 Mail Görevi Oluştur` is now guarded in both backend and frontend.

- Backend `/api/tasks/generate-today` checks whether today's `daily_tasks` already exist before generating.
- If tasks already exist, it returns `alreadyCreated: true`, `created: 0`, the existing task list and the message `Bugünün görevleri zaten oluşturulmuş.`
- The frontend disables the button when today's tasks already exist and shows `Bugünün Görevleri Oluşturuldu ✓`.
- Existing completed tasks remain visible.
- Repeated clicks no longer create 20/30/40-task batches for the same date.

### Backup Restore UI

The Backup page now exposes backend restore safely from the frontend.

- Each backup row includes `Geri Yükle`.
- Restore uses a custom in-app confirmation modal, not browser `confirm()`.
- Confirmation text:

```text
Bu yedeği geri yüklemek üzeresiniz. Mevcut veritabanı önce güvenlik yedeği alınarak değiştirilecektir. Devam etmek istiyor musunuz?
```

- Success message: `Yedek başarıyla geri yüklendi.`
- Errors are shown in Turkish.
- Existing backend filename validation remains in place; arbitrary path access is not exposed.

### Project-Folder Import Workflow

The import panel now supports safe file selection from:

```bash
~/Healthcare-Outreach-CRM/data_collection_healthcare
```

- Backend lists only `.xlsx`, `.xls`, `.csv` files from that folder.
- Frontend section: `Proje Klasöründen Veri Al`.
- User must select list type and one file, then click `Önizle`.
- No automatic bulk import occurs.
- Preview shows:
  - Toplam satır
  - Aktarılabilir
  - Tekrar
  - Hatalı
  - İlk 10 örnek satır
- Save/import still requires explicit `Kaydet / İçe Aktar`.
- Manual file upload remains available.

Helper text shown in UI:

```text
Bu klasördeki dosyalar kaynak dosyalardır. Veritabanına eklemek için dosyayı seçip Önizle ve Kaydet adımlarını tamamlayın.
```

### Seed Warning

After real import, do not run `npm run seed` unless intentionally resetting/demo-filling the local database. Seed data is fake demo data and can pollute real imported lists.

## V1.2 Import Validation and Organization Add Fix

Date: 2026-05-25

### Import Validation Rules

Email is now required for outreach imports.

- Rows with empty email are not importable.
- Empty email reason: `E-posta adresi eksik` / status `E-posta Eksik`.
- Invalid email format reason: `E-posta formatı geçersiz` / status `E-posta Geçersiz`.
- Duplicate detection checks both:
  - existing database email
  - duplicate email inside the same uploaded/imported file
- Preview counts now show:
  - Toplam satır
  - Aktarılabilir
  - Tekrar
  - E-posta Eksik
  - Hatalı
- Save/import skips invalid, no-email and duplicate rows and reports skipped counts.

If rows without email exist, the UI shows:

```text
E-posta adresi olmayan kurumlar mail gönderim listesine alınamaz. Bu satırlar içe aktarılmayacak.
```

### Organization Add UX

`Kurum Ekle` is now clearly separated from import.

- `Kurum Ekle` opens only the manual organization form.
- `Excel/CSV İçe Aktar` opens the import panel.
- The manual form includes: Kurum Adı, Tür, Bölge, Şehir, İlçe, E-posta, Telefon, Web Sitesi, Yetkili Kişi, Durum, Kaynak, Notlar.
- Save creates one organization; Cancel closes the form.

### Manual Sent Confirmation

`Gönderildi İşaretle` no longer uses browser `confirm()`.

- It now opens a custom in-app confirmation modal.
- After confirmation, the green toast `Gönderildi olarak işaretlendi` is shown.

## V1.2 Import Path and Preview Validation Fix

Date: 2026-05-25

- Project-folder import now resolves `data_collection_healthcare` through robust local fallbacks.
- During development, the backend logs the resolved import folder path when `/api/import/project-files` is requested.
- If the UI finds no files, it shows the checked folder path to help diagnose the problem.
- Manual upload preview and project-folder preview share the same backend validation rules: email is required, invalid email is rejected, duplicates are skipped.

## Import payload size fix

Date: 2026-05-25

- Backend JSON and URL-encoded body limits are configured to `50mb`.
- Multer Excel/CSV upload limit is configured to `50mb`.
- Manual upload preview continues to use `multipart/form-data` with multer.
- Project-folder preview sends only `filename` and `listType`; the backend reads the file locally from `data_collection_healthcare`.
- Import save now sends only validated/importable preview rows back to the backend, reducing JSON payload size.
- Oversized upload/body errors return a clean Turkish message instead of an HTML stack trace:

```text
Dosya çok büyük. Lütfen daha küçük bir Excel/CSV dosyası deneyin veya dosyayı parçalara bölün.
```
