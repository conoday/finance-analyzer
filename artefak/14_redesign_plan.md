# Redesign Plan — UI/UX

> Last updated: 2026-04-10
> Status: Planning — belum diimplementasi
> Trigger: "Saya kurang suka designnya saat ini"

---

## Masalah Desain Saat Ini

| Masalah | Detail |
|---|---|
| Dark theme terlalu gelap & berat | Glassmorphism overdone, terasa "gloomy" |
| Chart terlalu padat di satu halaman | 5 tab sekaligus membingungkan first-time user |
| Tidak ada empty state | Saat belum upload file, halaman terasa kosong/broken |
| Typography monoton | Semua teks ukuran sama, hierarchy kurang jelas |
| Tidak ada onboarding | User baru langsung dilempar ke dashboard kosong |
| Mobile responsiveness kurang | Komponen terlalu lebar di layar kecil |

---

## Referensi Desain yang Bagus

| App / Site | Elemen yang bisa ditiru | Link |
|---|---|---|
| **Linear.app** | Clean sidebar, typography hierarchy, subtle animations | linear.app |
| **Vercel Dashboard** | Minimal, data-dense tapi tidak padat, stat cards elegan | vercel.com |
| **Raycast** | Dark theme yang nyaman, spacing konsisten | raycast.com |
| **Clerk.com** | Onboarding flow yang smooth, empty states informatif | clerk.com |
| **Monzo** (bank app) | Color-coded categories, spending pulse, friendly tone | monzo.com |
| **Fey.com** (portfolio) | Beautiful finance charts, dark & clean | fey.com |

---

## Design Direction Baru

### Warna

**Saat ini:** Pure black (#0a0a0a) + glassmorphism blur berat + gradient mesh
**Baru:** Dark tapi lebih "warm" — nuansa slate/zinc, bukan cold black

```
Background:  #0f1117  (bukan pure black, lebih hangat)
Surface:     #1a1d27  (card background)
Border:      #2a2d3a  (subtle divider)
Primary:     #6366f1  (indigo — tetap, sudah bagus)
Success:     #22c55e  (green — income)
Danger:      #ef4444  (red — expense)
Text primary:  #f1f5f9
Text secondary: #94a3b8
Text muted:    #475569
```

### Typography

```
Font: Inter (tetap) + DM Mono untuk angka keuangan

H1 (page title):   24px / font-bold
H2 (section):      18px / font-semibold
H3 (card title):   14px / font-medium / text-muted
Body:              14px / font-normal
Number (amount):   DM Mono, tabular-nums
Caption:           12px / text-muted
```

### Layout Baru (Web)

```
┌────────────────────────────────────────────────────┐
│  SIDEBAR (64px collapsed / 240px expanded)         │
│  Logo | Nav items | User avatar + tier badge       │
├────────────────────────────────────────────────────┤
│  TOPBAR                                            │
│  Page title | Period picker (bulan) | Upload btn   │
├───────────────────────────────────────────────────┤
│  CONTENT AREA                                      │
│                                                    │
│  [KPI Row: net cashflow, income, expense, health]  │
│                                                    │
│  [Monthly Trend Chart]    [Spending Pie]           │
│                                                    │
│  [Transaction List]       [Top Merchants]          │
└────────────────────────────────────────────────────┘
```

**Tidak ada lagi tab** — semua ada di satu scrollable halaman (seperti Linear / Vercel dashboard).
Forecast dan Simulator pindah ke halaman terpisah (route `/forecast` dan `/simulator`).

---

## Page Structure Baru

```
/ (redirect ke /dashboard jika login)
/login              ← Google OAuth login page
/dashboard          ← Main overview (KPI + charts + recent transactions)
/transactions       ← Full transaction list + filter + manual entry
/forecast           ← AI/forecast view
/simulator          ← What-if simulator
/settings           ← User settings, tier info, billing
/admin              ← Admin console (role=admin)
```

---

## Component Redesign Priority

### 1. KPI Cards (Priority: High)
**Saat ini:** 4 cards sejajar, style seragam
**Baru:**
- Card utama (net cashflow) lebih besar, di kiri
- 3 card kecil kanan: income, expense, health score
- Angka pakai DM Mono
- Badge perubahan vs bulan lalu (hijau naik / merah turun)

### 2. Transaction List (Priority: High)
**Saat ini:** Tidak ada (hanya chart)
**Baru:**
- List dengan group by date
- Icon per kategori (emoji atau SVG kecil)
- Warna amount: hijau = income, merah = expense
- Swipe action di mobile (edit / delete)
- Quick filter: Semua | Income | Expense | [kategori]

### 3. Upload / Onboarding (Priority: High)
**Saat ini:** Hanya dropzone polos
**Baru:**
- Jika belum ada data: tampilkan onboarding card
  ```
  "Mulai tracking keuangan kamu 👋
   Upload mutasi rekening atau tambah transaksi manual"
  [Upload File]  [+ Tambah Manual]
  ```
- Progress indicator saat processing
- Konfirmasi sukses dengan summary singkat

### 4. Charts (Priority: Medium)
**Saat ini:** Recharts default styling
**Baru:**
- Warna chart: indigo (income) + rose (expense) + slate (forecast)
- Tooltip redesign: lebih besar, ada context
- Monthly chart: bar chart + line overlay (dual axis)
- Spending heatmap kalender (fitur baru A01)

### 5. Sidebar Navigation (Priority: Medium)
**Baru komponen:**
```typescript
// Collapsed: hanya icon 64px
// Expanded: icon + label 240px
// Mobile: bottom tab bar (4 item utama)

items = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Receipt, label: "Transaksi", href: "/transactions" },
  { icon: TrendingUp, label: "Forecast", href: "/forecast" },
  { icon: Sliders, label: "Simulator", href: "/simulator" },
  { icon: Settings, label: "Pengaturan", href: "/settings" },
]
```

---

## Implementasi Step-by-Step

### Step 1 — Design Tokens (1 hari)
- Update `tailwind.config.ts` dengan color palette baru
- Update `globals.css` dengan CSS variables
- Update `lib/utils.ts` dengan warna chart constants

### Step 2 — Layout Shell (1-2 hari)
- Buat `components/layout/Sidebar.tsx`
- Buat `components/layout/Topbar.tsx`
- Update `app/layout.tsx` dengan shell baru
- Tambah responsive: sidebar collapse + mobile bottom bar

### Step 3 — KPI Cards Redesign (0.5 hari)
- Update `KPICards.tsx`

### Step 4 — Transaction List (1-2 hari)
- Buat `components/TransactionList.tsx` (baru)
- Buat `components/TransactionForm.tsx` (modal baru — belum ada)
- Integrasikan ke `/transactions` page baru

### Step 5 — Onboarding & Empty States (0.5 hari)
- Buat `components/EmptyState.tsx`
- Update `UploadZone.tsx` dengan onboarding view

### Step 6 — Chart Polish (1 hari)
- Update warna Recharts di semua chart components
- Tambah SpendingHeatmap calendar (fitur A01 dari 13_feature_ideas)

**Total estimasi: 5-8 hari kerja**

---

## Tools / Resources Design

| Resource | Gunakan untuk |
|---|---|
| [Figma.com](https://figma.com) | Mockup sebelum code (opsional) |
| [shadcn/ui](https://ui.shadcn.com) | Component primitives yang sudah rapi |
| [Radix UI](https://radix-ui.com) | Accessible primitives (sudah via shadcn) |
| [Lucide Icons](https://lucide.dev) | Icon set — sudah terpasang |
| [Recharts](https://recharts.org) | Chart — sudah terpasang, perlu restyling |
| [Framer Motion](https://framer.com/motion) | Animasi — sudah terpasang |

---

## Notes untuk Agent

Ketika melanjutkan redesign, mulai dari **Step 1 (Design Tokens)** karena merupakan fondasi semua lainnya.
File yang pertama diubah: `tailwind.config.ts` dan `globals.css`.
Jangan sentuh logic/pipeline — hanya UI layer.
