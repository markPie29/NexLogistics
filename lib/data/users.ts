import type { User } from "@/lib/types";

export const seedUsers: User[] = [
  {
    id: "u-001",
    name: "Admin User",
    email: "admin@nexlogistics.demo",
    role: "super_admin",
    password: "Admin123!",
    phone: "+63 917 000 0001",
  },
  {
    id: "u-002",
    name: "Operations Lead",
    email: "operations@nexlogistics.demo",
    role: "company_admin",
    password: "Ops123!",
    phone: "+63 917 000 0002",
  },
  {
    id: "u-003",
    name: "Dispatch Center",
    email: "dispatcher@nexlogistics.demo",
    role: "dispatcher",
    password: "Dispatch123!",
    phone: "+63 917 000 0003",
  },
  {
    id: "u-004",
    name: "Mark Santos",
    email: "driver.mark@nexlogistics.demo",
    role: "driver",
    password: "Driver123!",
    phone: "0917 123 4567",
    driverId: "d-001",
  },
  {
    id: "u-005",
    name: "Finance Officer",
    email: "finance@nexlogistics.demo",
    role: "accounting",
    password: "Finance123!",
    phone: "+63 917 000 0005",
  },
  {
    id: "u-006",
    name: "ABC Construction",
    email: "client@abcconstruction.demo",
    role: "client",
    password: "Client123!",
    phone: "(02) 8888 1100",
    clientId: "c-001",
  },
];

export const demoCompany = {
  id: "co-001",
  name: "NEX Logistics Inc.",
  code: "NEX-2024-001",
};
