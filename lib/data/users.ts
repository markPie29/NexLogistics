import type { User } from "@/lib/types";

export const seedUsers: User[] = [
  {
    id: "u-001",
    name: "Admin User",
    email: "admin@nexlogistics.demo",
    role: "super_admin",
    _demoPassword: "Admin123!",
    phone: "+63 917 000 0001",
  },
  {
    id: "u-002",
    name: "Operations Lead",
    email: "operations@nexlogistics.demo",
    role: "company_admin",
    _demoPassword: "Ops123!",
    phone: "+63 917 000 0002",
  },
  {
    id: "u-003",
    name: "Dispatch Center",
    email: "dispatcher@nexlogistics.demo",
    role: "dispatcher",
    _demoPassword: "Dispatch123!",
    phone: "+63 917 000 0003",
  },
  {
    id: "u-004",
    name: "Mark Santos",
    email: "driver.mark@nexlogistics.demo",
    role: "driver",
    _demoPassword: "Driver123!",
    phone: "0917 123 4567",
    driverId: "d-001",
  },
  {
    id: "u-005",
    name: "Finance Officer",
    email: "finance@nexlogistics.demo",
    role: "accounting",
    _demoPassword: "Finance123!",
    phone: "+63 917 000 0005",
  },
  {
    id: "u-007",
    name: "Roberto Lim",
    email: "helper.roberto@nexlogistics.demo",
    role: "helper",
    _demoPassword: "Helper123!",
    phone: "0917 555 0101",
    helperId: "h-001",
  },
  {
    id: "u-006",
    name: "ABC Construction",
    email: "client@abcconstruction.demo",
    role: "client",
    _demoPassword: "Client123!",
    phone: "(02) 8888 1100",
    clientId: "c-001",
  },
  {
    id: "u-008",
    name: "Northbound Trucking",
    email: "partner@nexlogistics.demo",
    role: "partner",
    _demoPassword: "Partner123!",
    phone: "0917 234 5678",
    partnerId: "ptn-001",
  },
  // ⚠️  PLATFORM OWNER — not shown in login UI, accessed via direct email login only
  {
    id: "u-999",
    name: "Platform Owner",
    email: "platform@nex.internal",
    role: "super_admin" as const,
    _demoPassword: "NexPlatform@2025!",
    isPlatformOwner: true,
    phone: "+63 999 000 0000",
  },
];

export const demoCompany = {
  id: "co-001",
  name: "NEX Logistics Inc.",
  code: "NEX-2024-001",
};
