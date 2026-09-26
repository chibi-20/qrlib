# QR Library Borrow/Return System

A librarian-operated web app for logging book borrows and returns with QR codes — built as the working system behind the research paper *"Impact of QR Code Technology Usage in Library Borrowing and Returning Services among Senior High School Students."*

- **Frontend/Backend**: Next.js (App Router, TypeScript), deployed on **Vercel**
- **Database/Auth**: **Supabase** (Postgres + Auth)
- **QR**: `qrcode` for generating printable student ID / book labels, `html5-qrcode` for camera-based scanning (with a manual code-entry fallback)

## How it works

- Each **student** gets a printable QR ID card. Each **book title** gets a printable QR label.
- The librarian logs in, then uses **Borrow** (scan student → scan book → confirm) or **Return** (scan book → pick the borrower → confirm) to record transactions.
- **Dashboard**, **Transactions**, and **Reports** give the counts, logs, and charts (transaction volume, average scan-to-confirm time, on-time return rate) needed for the research paper's data analysis. CSV export is available on both Transactions and Reports.

## 1. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** → run [`supabase/schema.sql`](supabase/schema.sql). This creates the `students`, `books`, and `transactions` tables, enables Row Level Security (only logged-in users can read/write — no public access), and sets up a trigger that keeps each book's `available_copies` in sync automatically.
3. (Optional demo data) Run [`supabase/seed.sql`](supabase/seed.sql) to add a few sample students and books.
4. Go to **Authentication → Users → Add user** and create a login (email + password) for the librarian. This is the account used to sign in to the app — there's no public sign-up page.
5. Go to **Project Settings → API** and copy the **Project URL** and **anon public** key.

## 2. Configure environment variables

Copy `.env.example` to `.env.local` (already created for you, just fill it in) and paste in the values from step 1:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
```

## 3. Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), sign in with the librarian account you created, and:

1. Add a student under **Students**, then open its **QR** page to view/print the ID card (or use **Print all QR IDs** to batch-print).
2. Add a book under **Books**, same idea for the **QR** label.
3. Use **Borrow**/**Return** to scan the printed codes with your webcam (or paste the code value manually — each QR encodes a plain string like `LIBQR:STUDENT:STU-0001` or `LIBQR:BOOK:BK-0001`, visible via manual entry for testing without a printer/camera).

Camera access works over `http://localhost` in development. In production it requires HTTPS, which Vercel provides automatically.

## 4. Deploy to Vercel

1. Push this project to a GitHub repo.
2. Import the repo in [Vercel](https://vercel.com/new).
3. Add the same two environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) in the Vercel project's **Settings → Environment Variables**.
4. Deploy. The librarian signs in with the same Supabase Auth account created in step 1.

## Project structure

- `supabase/schema.sql` — database schema, RLS policies, and the availability-sync trigger
- `supabase/seed.sql` — optional sample data
- `src/app/login` — librarian sign-in
- `src/app/(app)` — everything behind login: dashboard, students, books, borrow, return, transactions, reports
- `src/lib/supabase` — Supabase client setup (browser, server, middleware)
- `src/lib/qr.ts` — QR payload encoding/decoding and image generation
- `middleware.ts` — redirects signed-out visitors to `/login` and refreshes the auth session
