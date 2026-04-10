// Mock data — replace with real API calls after Phase 2 (Auth + DB)

export const MOCK_STATS = {
  totalUsers: 128,
  activeToday: 23,
  uploadsToday: 47,
  totalUploads: 892,
  errorRate: 2.1,
  avgHealthScore: 68,
  freeTierUsers: 112,
  proTierUsers: 16,
  revenue: 0, // Phase 6
};

export const MOCK_USERS = [
  { id: "u001", email: "demo@gmail.com",       tier: "free",    uploads: 12, lastActive: "2026-04-10", status: "active",   healthScore: 72 },
  { id: "u002", email: "andi.budi@gmail.com",  tier: "free",    uploads: 3,  lastActive: "2026-04-09", status: "active",   healthScore: 55 },
  { id: "u003", email: "sari.finance@mail.id", tier: "pro",     uploads: 31, lastActive: "2026-04-10", status: "active",   healthScore: 84 },
  { id: "u004", email: "ahmad@company.co.id",  tier: "pro",     uploads: 8,  lastActive: "2026-04-08", status: "active",   healthScore: 91 },
  { id: "u005", email: "test_user5@gmail.com", tier: "free",    uploads: 1,  lastActive: "2026-04-07", status: "inactive", healthScore: 43 },
  { id: "u006", email: "rizki.wahyu@gmail.com",tier: "free",    uploads: 6,  lastActive: "2026-04-10", status: "active",   healthScore: 62 },
  { id: "u007", email: "nadia@startup.id",     tier: "pro",     uploads: 22, lastActive: "2026-04-10", status: "active",   healthScore: 78 },
  { id: "u008", email: "fauzi123@gmail.com",   tier: "free",    uploads: 0,  lastActive: "2026-04-05", status: "inactive", healthScore: null },
];

export const MOCK_ISSUES = [
  { id: "i001", user: "demo@gmail.com",       type: "parse_error",   message: "Failed to parse BCA CSV row 45 — unexpected format", timestamp: "2026-04-10 14:32", severity: "medium", status: "open"     },
  { id: "i002", user: "sari.finance@mail.id", type: "timeout",       message: "Analysis timeout after 30s — file too large (8MB)", timestamp: "2026-04-10 11:15", severity: "high",   status: "resolved" },
  { id: "i003", user: "andi.budi@gmail.com",  type: "invalid_file",  message: "Uploaded .xlsx with empty transactions sheet",       timestamp: "2026-04-09 18:44", severity: "low",    status: "open"     },
  { id: "i004", user: "rizki.wahyu@gmail.com",type: "forecast_error","message": "Forecast failed — not enough data points (< 30 days)", timestamp: "2026-04-09 09:20", severity: "low", status: "open"   },
  { id: "i005", user: "nadia@startup.id",     type: "health_error",  message: "Health score NaN — division by zero in income=0",    timestamp: "2026-04-08 16:00", severity: "medium", status: "resolved" },
];

export const MOCK_DAILY_UPLOADS = [
  { date: "Apr 4",  uploads: 28 },
  { date: "Apr 5",  uploads: 35 },
  { date: "Apr 6",  uploads: 22 },
  { date: "Apr 7",  uploads: 41 },
  { date: "Apr 8",  uploads: 55 },
  { date: "Apr 9",  uploads: 63 },
  { date: "Apr 10", uploads: 47 },
];

export const MOCK_TIER_DISTRIBUTION = [
  { name: "Free",     value: 112, color: "#64748b" },
  { name: "Pro",      value: 14,  color: "#fbbf24" },
  { name: "Business", value: 2,   color: "#818cf8" },
];

export const MOCK_REPORTS = [
  { id: "r001", title: "Laporan Mingguan Apr W1", generated: "2026-04-07", records: 892,  status: "ready"   },
  { id: "r002", title: "Error Summary Apr 1-10",  generated: "2026-04-10", records: 5,    status: "ready"   },
  { id: "r003", title: "User Growth Apr 2026",    generated: "2026-04-10", records: 128,  status: "ready"   },
  { id: "r004", title: "Revenue Report Q1 2026",  generated: "—",          records: 0,    status: "pending" },
];
