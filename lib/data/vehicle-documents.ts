import type { VehicleDocument, VehiclePermit } from "@/lib/types";

// Seed data for first 4 vehicles: v-101, v-102, v-103, v-104
// Mix of expiry statuses, realistic PH issuing authorities, and file attachments on ≥50%

export const seedVehicleDocuments: VehicleDocument[] = [
  // ── v-101 (NEX-101, Isuzu FTR 24ft) ──────────────────────
  {
    id: "vd-seed-001",
    vehicleId: "v-101",
    category: "OR/CR",
    documentNumber: "MV-2024-78451",
    issuedDate: "2024-01-15",
    expiryDate: "2025-01-15", // Expired
    issuingAuthority: "Land Transportation Office (LTO)",
    notes: "Original copy stored in admin office.",
    fileAttachment: { fileName: "OR-CR-NEX101-2024.pdf", fileSize: 2_450_000, uploadedAt: "2024-01-20T08:00:00.000Z" },
    createdAt: "2024-01-20T08:00:00.000Z",
    updatedAt: "2024-01-20T08:00:00.000Z",
  },
  {
    id: "vd-seed-002",
    vehicleId: "v-101",
    category: "Insurance",
    documentNumber: "PI-2024-003221",
    issuedDate: "2024-03-01",
    expiryDate: "2025-03-01", // Expired
    issuingAuthority: "Pioneer Insurance & Surety Corp.",
    notes: "Comprehensive + CTPL coverage",
    fileAttachment: { fileName: "insurance-cert-NEX101-2024.pdf", fileSize: 1_850_000, uploadedAt: "2024-03-05T10:00:00.000Z" },
    createdAt: "2024-03-05T10:00:00.000Z",
    updatedAt: "2024-03-05T10:00:00.000Z",
  },
  {
    id: "vd-seed-003",
    vehicleId: "v-101",
    category: "LTFRB Franchise",
    documentNumber: "CPC-2024-000451",
    issuedDate: "2024-06-01",
    expiryDate: "2027-06-01", // Valid
    issuingAuthority: "Land Transportation Franchising and Regulatory Board (LTFRB)",
    fileAttachment: { fileName: "ltfrb-franchise-CPC-000451.pdf", fileSize: 3_200_000, uploadedAt: "2024-06-10T09:00:00.000Z" },
    createdAt: "2024-06-10T09:00:00.000Z",
    updatedAt: "2024-06-10T09:00:00.000Z",
  },
  {
    id: "vd-seed-004",
    vehicleId: "v-101",
    category: "LTO Registration",
    documentNumber: "REG-2025-NEX101",
    issuedDate: "2025-01-10",
    expiryDate: "2026-01-10", // Valid
    issuingAuthority: "Land Transportation Office (LTO)",
    createdAt: "2025-01-12T07:30:00.000Z",
    updatedAt: "2025-01-12T07:30:00.000Z",
  },

  // ── v-102 (NEX-102, Hino 500 Series) ─────────────────────
  {
    id: "vd-seed-005",
    vehicleId: "v-102",
    category: "OR/CR",
    documentNumber: "MV-2024-82310",
    issuedDate: "2024-02-20",
    expiryDate: "2026-02-20", // Valid
    issuingAuthority: "Land Transportation Office (LTO)",
    fileAttachment: { fileName: "OR-CR-NEX102-2024.pdf", fileSize: 2_100_000, uploadedAt: "2024-02-25T08:00:00.000Z" },
    createdAt: "2024-02-25T08:00:00.000Z",
    updatedAt: "2024-02-25T08:00:00.000Z",
  },
  {
    id: "vd-seed-006",
    vehicleId: "v-102",
    category: "Insurance",
    documentNumber: "MI-2025-045678",
    issuedDate: "2025-01-15",
    expiryDate: "2026-01-15", // Valid
    issuingAuthority: "Malayan Insurance Co., Inc.",
    notes: "Third-party liability only",
    createdAt: "2025-01-18T10:00:00.000Z",
    updatedAt: "2025-01-18T10:00:00.000Z",
  },
  {
    id: "vd-seed-007",
    vehicleId: "v-102",
    category: "LTFRB Franchise",
    documentNumber: "CPC-2023-000892",
    issuedDate: "2023-08-15",
    expiryDate: "2026-08-15", // Valid
    issuingAuthority: "Land Transportation Franchising and Regulatory Board (LTFRB)",
    fileAttachment: { fileName: "ltfrb-franchise-CPC-000892.pdf", fileSize: 2_980_000, uploadedAt: "2023-08-20T09:00:00.000Z" },
    createdAt: "2023-08-20T09:00:00.000Z",
    updatedAt: "2023-08-20T09:00:00.000Z",
  },

  // ── v-103 (NEX-103) ───────────────────────────────────────
  {
    id: "vd-seed-008",
    vehicleId: "v-103",
    category: "OR/CR",
    documentNumber: "MV-2025-10234",
    issuedDate: "2025-03-01",
    expiryDate: "2026-03-01", // Valid
    issuingAuthority: "Land Transportation Office (LTO)",
    fileAttachment: { fileName: "OR-CR-NEX103-2025.pdf", fileSize: 2_300_000, uploadedAt: "2025-03-05T08:00:00.000Z" },
    createdAt: "2025-03-05T08:00:00.000Z",
    updatedAt: "2025-03-05T08:00:00.000Z",
  },
  {
    id: "vd-seed-009",
    vehicleId: "v-103",
    category: "Insurance",
    documentNumber: "SC-2024-991122",
    issuedDate: "2024-07-01",
    expiryDate: "2025-07-01", // Expiring soon (within 30 days of reference)
    issuingAuthority: "Standard Insurance Co., Inc.",
    notes: "Comprehensive coverage",
    fileAttachment: { fileName: "insurance-NEX103-2024.pdf", fileSize: 1_750_000, uploadedAt: "2024-07-05T09:00:00.000Z" },
    createdAt: "2024-07-05T09:00:00.000Z",
    updatedAt: "2024-07-05T09:00:00.000Z",
  },
  {
    id: "vd-seed-010",
    vehicleId: "v-103",
    category: "LTO Registration",
    documentNumber: "REG-2025-NEX103",
    issuedDate: "2025-04-01",
    expiryDate: "2026-04-01", // Valid
    issuingAuthority: "Land Transportation Office (LTO)",
    createdAt: "2025-04-05T07:00:00.000Z",
    updatedAt: "2025-04-05T07:00:00.000Z",
  },

  // ── v-104 (NEX-104) ───────────────────────────────────────
  {
    id: "vd-seed-011",
    vehicleId: "v-104",
    category: "OR/CR",
    documentNumber: "MV-2024-55612",
    issuedDate: "2024-05-10",
    expiryDate: "2026-05-10", // Valid
    issuingAuthority: "Land Transportation Office (LTO)",
    createdAt: "2024-05-15T08:00:00.000Z",
    updatedAt: "2024-05-15T08:00:00.000Z",
  },
  {
    id: "vd-seed-012",
    vehicleId: "v-104",
    category: "Insurance",
    documentNumber: "BPI-2025-112233",
    issuedDate: "2025-02-01",
    expiryDate: "2026-02-01", // Valid
    issuingAuthority: "BPI/MS Insurance Corporation",
    fileAttachment: { fileName: "insurance-NEX104-2025.pdf", fileSize: 1_600_000, uploadedAt: "2025-02-05T10:00:00.000Z" },
    createdAt: "2025-02-05T10:00:00.000Z",
    updatedAt: "2025-02-05T10:00:00.000Z",
  },
  {
    id: "vd-seed-013",
    vehicleId: "v-104",
    category: "LTFRB Franchise",
    documentNumber: "CPC-2024-001567",
    issuedDate: "2024-09-01",
    expiryDate: "2027-09-01", // Valid
    issuingAuthority: "Land Transportation Franchising and Regulatory Board (LTFRB)",
    fileAttachment: { fileName: "ltfrb-franchise-CPC-001567.pdf", fileSize: 3_100_000, uploadedAt: "2024-09-10T09:00:00.000Z" },
    createdAt: "2024-09-10T09:00:00.000Z",
    updatedAt: "2024-09-10T09:00:00.000Z",
  },
];

export const seedVehiclePermits: VehiclePermit[] = [
  // ── v-101 ─────────────────────────────────────────────────
  {
    id: "vp-seed-001",
    vehicleId: "v-101",
    category: "City Permit",
    permitNumber: "CP-MNL-2024-1122",
    issuedDate: "2024-01-05",
    expiryDate: "2025-01-05", // Expired
    issuingAuthority: "City of Manila",
    coverageArea: "City of Manila",
    fileAttachment: { fileName: "city-permit-manila-NEX101.pdf", fileSize: 980_000, uploadedAt: "2024-01-10T08:00:00.000Z" },
    createdAt: "2024-01-10T08:00:00.000Z",
    updatedAt: "2024-01-10T08:00:00.000Z",
  },
  {
    id: "vp-seed-002",
    vehicleId: "v-101",
    category: "Mayor's Permit",
    permitNumber: "MP-MKT-2025-0045",
    issuedDate: "2025-01-10",
    expiryDate: "2026-01-10", // Valid
    issuingAuthority: "City of Makati",
    fileAttachment: { fileName: "mayors-permit-makati-NEX101.pdf", fileSize: 1_200_000, uploadedAt: "2025-01-15T09:00:00.000Z" },
    createdAt: "2025-01-15T09:00:00.000Z",
    updatedAt: "2025-01-15T09:00:00.000Z",
  },
  {
    id: "vp-seed-003",
    vehicleId: "v-101",
    category: "Barangay Clearance",
    permitNumber: "BP-2025-001",
    issuedDate: "2025-02-01",
    expiryDate: "2026-02-01", // Valid
    issuingAuthority: "Barangay Ugong, Pasig City",
    createdAt: "2025-02-05T07:00:00.000Z",
    updatedAt: "2025-02-05T07:00:00.000Z",
  },

  // ── v-102 ─────────────────────────────────────────────────
  {
    id: "vp-seed-004",
    vehicleId: "v-102",
    category: "City Permit",
    permitNumber: "CP-QC-2025-0789",
    issuedDate: "2025-01-20",
    expiryDate: "2026-01-20", // Valid
    issuingAuthority: "Quezon City LGU",
    coverageArea: "Quezon City",
    fileAttachment: { fileName: "city-permit-qc-NEX102.pdf", fileSize: 870_000, uploadedAt: "2025-01-25T08:00:00.000Z" },
    createdAt: "2025-01-25T08:00:00.000Z",
    updatedAt: "2025-01-25T08:00:00.000Z",
  },
  {
    id: "vp-seed-005",
    vehicleId: "v-102",
    category: "Mayor's Permit",
    permitNumber: "MP-PSG-2024-0332",
    issuedDate: "2024-02-01",
    expiryDate: "2025-02-01", // Expired
    issuingAuthority: "City of Pasig",
    createdAt: "2024-02-05T09:00:00.000Z",
    updatedAt: "2024-02-05T09:00:00.000Z",
  },
  {
    id: "vp-seed-006",
    vehicleId: "v-102",
    category: "Barangay Clearance",
    permitNumber: "BP-2025-012",
    issuedDate: "2025-03-01",
    expiryDate: "2026-03-01", // Valid
    issuingAuthority: "Barangay Kapitolyo, Pasig City",
    fileAttachment: { fileName: "brgy-clearance-NEX102.pdf", fileSize: 650_000, uploadedAt: "2025-03-05T07:00:00.000Z" },
    createdAt: "2025-03-05T07:00:00.000Z",
    updatedAt: "2025-03-05T07:00:00.000Z",
  },

  // ── v-103 ─────────────────────────────────────────────────
  {
    id: "vp-seed-007",
    vehicleId: "v-103",
    category: "Special Permit (Hazmat)",
    permitNumber: "SP-HAZ-2025-0011",
    issuedDate: "2025-01-15",
    expiryDate: "2025-07-15", // Expiring soon
    issuingAuthority: "Department of Transportation (DOTr)",
    notes: "Authorized for Class 3 flammable liquids transport",
    fileAttachment: { fileName: "hazmat-permit-NEX103.pdf", fileSize: 1_450_000, uploadedAt: "2025-01-20T10:00:00.000Z" },
    createdAt: "2025-01-20T10:00:00.000Z",
    updatedAt: "2025-01-20T10:00:00.000Z",
  },
  {
    id: "vp-seed-008",
    vehicleId: "v-103",
    category: "City Permit",
    permitNumber: "CP-MNL-2025-2234",
    issuedDate: "2025-02-01",
    expiryDate: "2026-02-01", // Valid
    issuingAuthority: "City of Manila",
    coverageArea: "City of Manila",
    createdAt: "2025-02-05T08:00:00.000Z",
    updatedAt: "2025-02-05T08:00:00.000Z",
  },
  {
    id: "vp-seed-009",
    vehicleId: "v-103",
    category: "Mayor's Permit",
    permitNumber: "MP-MNL-2025-0101",
    issuedDate: "2025-01-05",
    expiryDate: "2026-01-05", // Valid
    issuingAuthority: "City of Manila",
    createdAt: "2025-01-08T09:00:00.000Z",
    updatedAt: "2025-01-08T09:00:00.000Z",
  },

  // ── v-104 ─────────────────────────────────────────────────
  {
    id: "vp-seed-010",
    vehicleId: "v-104",
    category: "Special Permit (Overweight)",
    permitNumber: "SP-OW-2025-0088",
    issuedDate: "2025-03-01",
    expiryDate: "2025-09-01", // Valid (far future)
    issuingAuthority: "Department of Public Works and Highways (DPWH)",
    notes: "Authorized up to 15,000 kg gross vehicle weight",
    fileAttachment: { fileName: "overweight-permit-NEX104.pdf", fileSize: 1_100_000, uploadedAt: "2025-03-05T10:00:00.000Z" },
    createdAt: "2025-03-05T10:00:00.000Z",
    updatedAt: "2025-03-05T10:00:00.000Z",
  },
  {
    id: "vp-seed-011",
    vehicleId: "v-104",
    category: "Barangay Clearance",
    permitNumber: "BP-2025-045",
    issuedDate: "2025-02-15",
    expiryDate: "2026-02-15", // Valid
    issuingAuthority: "Barangay San Antonio, Makati City",
    createdAt: "2025-02-20T07:00:00.000Z",
    updatedAt: "2025-02-20T07:00:00.000Z",
  },
  {
    id: "vp-seed-012",
    vehicleId: "v-104",
    category: "Mayor's Permit",
    permitNumber: "MP-MKT-2025-0112",
    issuedDate: "2025-01-20",
    expiryDate: "2026-01-20", // Valid
    issuingAuthority: "City of Makati",
    fileAttachment: { fileName: "mayors-permit-makati-NEX104.pdf", fileSize: 920_000, uploadedAt: "2025-01-25T09:00:00.000Z" },
    createdAt: "2025-01-25T09:00:00.000Z",
    updatedAt: "2025-01-25T09:00:00.000Z",
  },
];
