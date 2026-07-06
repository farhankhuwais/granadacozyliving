import { db } from "./index";
import {
  profiles,
  properties,
  rooms,
  tenants,
  transactions,
  requests,
} from "./schema";
import { v4 as uuidv4 } from "uuid";

async function seed() {
  console.log("🌱 Seeding database...");

  // 1. Create super admin profile
  const superAdminId = uuidv4();
  await db.insert(profiles).values({
    id: superAdminId,
    email: "admin@cozyliving.com",
    fullName: "Super Admin",
    role: "super_admin",
    propertyId: null,
  });

  console.log("✅ Super admin created");

  // 2. Create property
  const propertyId = uuidv4();
  await db.insert(properties).values({
    id: propertyId,
    name: "Cozy Living by Granada",
    location: "Granada, Spain",
    totalRooms: 8,
    investmentScheme: "hybrid",
    description: "Co-living property with 8 rooms (4 monthly, 4 daily)",
  });

  console.log("✅ Property created");

  // 3. Create investor account
  const investorId = uuidv4();
  await db.insert(profiles).values({
    id: investorId,
    email: "investor@cozyliving.com",
    fullName: "Budi Santoso",
    role: "investor_only",
    propertyId: propertyId,
  });

  // 4. Create manager account
  const managerId = uuidv4();
  await db.insert(profiles).values({
    id: managerId,
    email: "manager@cozyliving.com",
    fullName: "Siti Nurhaliza",
    role: "manager_only",
    propertyId: propertyId,
  });

  console.log("✅ Investor and manager accounts created");

  // 5. Create rooms (K1-K4 monthly, K5-K8 daily)
  const roomsData = [];
  for (let i = 1; i <= 8; i++) {
    roomsData.push({
      id: uuidv4(),
      propertyId: propertyId,
      roomNumber: i,
      type: i <= 4 ? "bulanan" : "harian",
      status: i <= 3 ? "terisi" : "tersedia",
      monthlyPrice: i <= 4 ? 1500000 : null,
      dailyPrice: i > 4 ? 200000 : null,
    });
  }
  await db.insert(rooms).values(roomsData);

  console.log("✅ 8 rooms created");

  // 6. Create sample tenants (K1, K2, K3)
  const tenantsData = [
    {
      id: uuidv4(),
      roomId: roomsData[0].id,
      name: "Budi Santoso",
      phone: "081234567890",
      email: "budi@example.com",
      leaseStart: "2026-01-15",
      leaseEnd: "2026-12-31",
      status: "active",
      idType: "KTP",
      idNumber: "3201234567890001",
    },
    {
      id: uuidv4(),
      roomId: roomsData[1].id,
      name: "Siti Nurhaliza",
      phone: "081234567891",
      email: "siti@example.com",
      leaseStart: "2026-03-01",
      leaseEnd: "2027-02-28",
      status: "active",
      idType: "KTP",
      idNumber: "3201234567890002",
    },
    {
      id: uuidv4(),
      roomId: roomsData[2].id,
      name: "Ahmad Rahman",
      phone: "081234567892",
      email: "ahmad@example.com",
      leaseStart: "2026-02-10",
      leaseEnd: "2026-08-10",
      status: "active",
      idType: "KTP",
      idNumber: "3201234567890003",
    },
  ];
  await db.insert(tenants).values(tenantsData);

  console.log("✅ 3 tenants created");

  // 7. Create sample transactions (June 2026)
  const transactionsData = [
    // Income - Monthly rent
    {
      id: uuidv4(),
      propertyId: propertyId,
      roomId: roomsData[0].id,
      type: "income",
      category: "monthly_rent",
      amount: 1500000,
      description: "Sewa bulanan K1 - Januari 2026",
      transactionDate: "2026-01-01",
      createdBy: managerId,
    },
    {
      id: uuidv4(),
      propertyId: propertyId,
      roomId: roomsData[1].id,
      type: "income",
      category: "monthly_rent",
      amount: 1500000,
      description: "Sewa bulanan K2 - Januari 2026",
      transactionDate: "2026-01-01",
      createdBy: managerId,
    },
    {
      id: uuidv4(),
      propertyId: propertyId,
      roomId: roomsData[2].id,
      type: "income",
      category: "monthly_rent",
      amount: 1500000,
      description: "Sewa bulanan K3 - Januari 2026",
      transactionDate: "2026-01-01",
      createdBy: managerId,
    },
    // Income - Daily rent
    {
      id: uuidv4(),
      propertyId: propertyId,
      roomId: roomsData[4].id,
      type: "income",
      category: "daily_rent",
      amount: 4400000,
      description: "Sewa harian K5 - 22 hari",
      transactionDate: "2026-01-15",
      createdBy: managerId,
    },
    {
      id: uuidv4(),
      propertyId: propertyId,
      roomId: roomsData[5].id,
      type: "income",
      category: "daily_rent",
      amount: 4000000,
      description: "Sewa harian K6 - 20 hari",
      transactionDate: "2026-01-15",
      createdBy: managerId,
    },
    // Expense - Property tax
    {
      id: uuidv4(),
      propertyId: propertyId,
      type: "expense",
      category: "property_tax",
      amount: 1440000,
      description: "IPL Januari 2026",
      transactionDate: "2026-01-05",
      createdBy: managerId,
    },
    // Expense - Management fees
    {
      id: uuidv4(),
      propertyId: propertyId,
      type: "expense",
      category: "management_fees",
      amount: 1080000,
      description: "Management fee 5% - Januari 2026",
      transactionDate: "2026-01-10",
      createdBy: managerId,
    },
  ];
  await db.insert(transactions).values(transactionsData);

  console.log("✅ Sample transactions created");

  // 8. Create sample requests
  const requestsData = [
    {
      id: uuidv4(),
      propertyId: propertyId,
      roomId: roomsData[2].id,
      type: "maintenance",
      title: "Perbaikan AC",
      status: "proses",
      estimatedCost: 350000,
      notes: "AC tidak dingin, perlu isi freon",
      createdBy: managerId,
    },
    {
      id: uuidv4(),
      propertyId: propertyId,
      roomId: roomsData[5].id,
      type: "maintenance",
      title: "Penggantian Lampu",
      status: "selesai",
      estimatedCost: 75000,
      notes: "Lampu kamar mati",
      createdBy: managerId,
      approvedBy: investorId,
    },
    {
      id: uuidv4(),
      propertyId: propertyId,
      roomId: roomsData[1].id,
      type: "inventory",
      title: "Tambahan Meja",
      status: "menunggu",
      estimatedCost: 450000,
      notes: "Tenant minta meja belajar tambahan",
      createdBy: managerId,
    },
  ];
  await db.insert(requests).values(requestsData);

  console.log("✅ Sample requests created");

  console.log("🎉 Seed completed successfully!");
  console.log("\n📋 Demo accounts:");
  console.log("  Super Admin: admin@cozyliving.com");
  console.log("  Investor: investor@cozyliving.com");
  console.log("  Manager: manager@cozyliving.com");
  console.log("  Password: demo1234 (set via Supabase Auth)");
}

seed().catch((error) => {
  console.error("❌ Seed failed:", error);
  process.exit(1);
});
