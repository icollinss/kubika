"use server";

import { getCompanyId } from "@/lib/get-company-id";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";


async function nextEmployeeNumber(companyId: string): Promise<string> {
  const count = await prisma.employee.count({ where: { companyId } });
  return `EMP${String(count + 1).padStart(4, "0")}`;
}

async function nextPayslipNumber(companyId: string, period: string): Promise<string> {
  const count = await prisma.payslip.count({ where: { companyId, period } });
  return `PS/${period}/${String(count + 1).padStart(3, "0")}`;
}

// ─── Angola IRT Tax Brackets (2024) ──────────────────────────────────────────
// Monthly salary brackets in AOA
function calculateIRT(grossAfterINSS: number): number {
  if (grossAfterINSS <= 100000) return 0;
  if (grossAfterINSS <= 150000) return (grossAfterINSS - 100000) * 0.10;
  if (grossAfterINSS <= 200000) return 5000 + (grossAfterINSS - 150000) * 0.13;
  if (grossAfterINSS <= 300000) return 11500 + (grossAfterINSS - 200000) * 0.16;
  if (grossAfterINSS <= 500000) return 27500 + (grossAfterINSS - 300000) * 0.18;
  if (grossAfterINSS <= 1000000) return 63500 + (grossAfterINSS - 500000) * 0.19;
  if (grossAfterINSS <= 1500000) return 158500 + (grossAfterINSS - 1000000) * 0.20;
  if (grossAfterINSS <= 2000000) return 258500 + (grossAfterINSS - 1500000) * 0.21;
  if (grossAfterINSS <= 2500000) return 363500 + (grossAfterINSS - 2000000) * 0.22;
  if (grossAfterINSS <= 3000000) return 473500 + (grossAfterINSS - 2500000) * 0.23;
  if (grossAfterINSS <= 3500000) return 588500 + (grossAfterINSS - 3000000) * 0.24;
  if (grossAfterINSS <= 4000000) return 708500 + (grossAfterINSS - 3500000) * 0.245;
  if (grossAfterINSS <= 4500000) return 831000 + (grossAfterINSS - 4000000) * 0.25;
  return 956000 + (grossAfterINSS - 4500000) * 0.255;
}

// ─── Departments ──────────────────────────────────────────────────────────────

export async function getDepartments() {
  const companyId = await getCompanyId();
  return prisma.department.findMany({ where: { companyId }, orderBy: { name: "asc" } });
}

export async function createDepartment(data: { name: string; description?: string }) {
  const companyId = await getCompanyId();
  const dept = await prisma.department.create({ data: { ...data, companyId } });
  revalidatePath("/dashboard/hr/departments");
  return dept;
}

// ─── Employees ────────────────────────────────────────────────────────────────

export async function getEmployees() {
  const companyId = await getCompanyId();
  return prisma.employee.findMany({
    where: { companyId },
    include: {
      department: true,
      contracts: { where: { status: "ACTIVE" }, orderBy: { startDate: "desc" }, take: 1 },
    },
    orderBy: { firstName: "asc" },
  });
}

export async function getEmployee(id: string) {
  const companyId = await getCompanyId();
  return prisma.employee.findFirst({
    where: { id, companyId },
    include: {
      department: true,
      contracts: { orderBy: { startDate: "desc" } },
      payslips: { orderBy: { period: "desc" }, take: 12 },
    },
  });
}

export async function createEmployee(data: {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  nif?: string;
  inssNumber?: string;
  dateOfBirth?: string;
  hireDate: string;
  jobTitle?: string;
  departmentId?: string;
}) {
  const companyId = await getCompanyId();
  const employeeNumber = await nextEmployeeNumber(companyId);
  const employee = await prisma.employee.create({
    data: {
      ...data,
      employeeNumber,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
      hireDate: new Date(data.hireDate),
      companyId,
    },
  });
  revalidatePath("/dashboard/hr/employees");
  return employee;
}

export async function updateEmployee(id: string, data: {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  jobTitle?: string;
  departmentId?: string;
  status?: "ACTIVE" | "ON_LEAVE" | "SUSPENDED" | "TERMINATED";
  endDate?: string;
}) {
  const companyId = await getCompanyId();
  const employee = await prisma.employee.update({
    where: { id, companyId },
    data: {
      ...data,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
    },
  });
  revalidatePath("/dashboard/hr/employees");
  return employee;
}

// ─── Contracts ────────────────────────────────────────────────────────────────

export async function createContract(data: {
  employeeId: string;
  contractType: "PERMANENT" | "FIXED_TERM" | "PART_TIME" | "INTERN" | "CONSULTANT";
  startDate: string;
  endDate?: string;
  basicSalary: number;
  allowances?: number;
  workingHours?: number;
  notes?: string;
}) {
  const companyId = await getCompanyId();
  // Expire previous active contracts
  await prisma.contract.updateMany({
    where: { employeeId: data.employeeId, companyId, status: "ACTIVE" },
    data: { status: "EXPIRED" },
  });
  const contract = await prisma.contract.create({
    data: {
      ...data,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      allowances: data.allowances ?? 0,
      workingHours: data.workingHours ?? 8,
      companyId,
    },
  });
  revalidatePath(`/dashboard/hr/employees/${data.employeeId}`);
  return contract;
}

// ─── Attendance ───────────────────────────────────────────────────────────────

export async function getAttendance(employeeId: string, month: string) {
  const companyId = await getCompanyId();
  const from = new Date(`${month}-01`);
  const to = new Date(from.getFullYear(), from.getMonth() + 1, 0, 23, 59, 59);
  return prisma.attendance.findMany({
    where: { employeeId, companyId, date: { gte: from, lte: to } },
    orderBy: { date: "asc" },
  });
}

export async function recordAttendance(data: {
  employeeId: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status: "PRESENT" | "ABSENT" | "HALF_DAY" | "ON_LEAVE" | "HOLIDAY";
  note?: string;
}) {
  const companyId = await getCompanyId();
  const date = new Date(data.date);
  let hoursWorked = 0;
  if (data.checkIn && data.checkOut) {
    const diff = new Date(data.checkOut).getTime() - new Date(data.checkIn).getTime();
    hoursWorked = Math.max(0, diff / 3600000);
  } else if (data.status === "HALF_DAY") {
    hoursWorked = 4;
  } else if (data.status === "PRESENT") {
    hoursWorked = 8;
  }

  const record = await prisma.attendance.upsert({
    where: { employeeId_date: { employeeId: data.employeeId, date } } as never,
    update: {
      checkIn: data.checkIn ? new Date(data.checkIn) : null,
      checkOut: data.checkOut ? new Date(data.checkOut) : null,
      hoursWorked,
      status: data.status,
      note: data.note,
    },
    create: {
      employeeId: data.employeeId,
      date,
      checkIn: data.checkIn ? new Date(data.checkIn) : null,
      checkOut: data.checkOut ? new Date(data.checkOut) : null,
      hoursWorked,
      status: data.status,
      note: data.note,
      companyId,
    },
  });
  revalidatePath("/dashboard/hr/attendance");
  return record;
}

// ─── Payroll ──────────────────────────────────────────────────────────────────

export async function getPayslips(period?: string) {
  const companyId = await getCompanyId();
  return prisma.payslip.findMany({
    where: { companyId, ...(period ? { period } : {}) },
    include: { employee: true },
    orderBy: [{ period: "desc" }, { employee: { firstName: "asc" } }],
  });
}

export async function getPayslip(id: string) {
  const companyId = await getCompanyId();
  return prisma.payslip.findFirst({
    where: { id, companyId },
    include: {
      employee: { include: { department: true } },
      lines: { orderBy: { sequence: "asc" } },
    },
  });
}

export async function generatePayroll(period: string) {
  const companyId = await getCompanyId();

  // Get all active employees with active contracts
  const employees = await prisma.employee.findMany({
    where: { companyId, status: "ACTIVE" },
    include: {
      contracts: { where: { status: "ACTIVE" }, orderBy: { startDate: "desc" }, take: 1 },
    },
  });

  const payslips = [];

  for (const emp of employees) {
    const contract = emp.contracts[0];
    if (!contract) continue;

    // Skip if payslip already exists for this period
    const existing = await prisma.payslip.findFirst({
      where: { employeeId: emp.id, period, companyId },
    });
    if (existing) continue;

    const basicSalary = contract.basicSalary;
    const allowances = contract.allowances;
    const grossSalary = basicSalary + allowances;

    // INSS: 3% employee, 8% employer
    const inssEmployee = grossSalary * 0.03;
    const inssEmployer = grossSalary * 0.08;

    // IRT: calculated on gross - INSS employee
    const taxableIncome = grossSalary - inssEmployee;
    const irtAmount = calculateIRT(taxableIncome);

    const netSalary = grossSalary - inssEmployee - irtAmount;

    const number = await nextPayslipNumber(companyId, period);

    const payslip = await prisma.payslip.create({
      data: {
        number,
        employeeId: emp.id,
        period,
        basicSalary,
        allowances,
        grossSalary,
        inssEmployee,
        inssEmployer,
        irtAmount,
        netSalary,
        companyId,
        lines: {
          create: [
            { type: "EARNING", label: "Salário Base", amount: basicSalary, sequence: 1 },
            ...(allowances > 0 ? [{ type: "EARNING", label: "Subsídios", amount: allowances, sequence: 2 }] : []),
            { type: "DEDUCTION", label: "INSS (3%)", amount: -inssEmployee, sequence: 10 },
            { type: "DEDUCTION", label: "IRT", amount: -irtAmount, sequence: 11 },
          ],
        },
      },
    });
    payslips.push(payslip);
  }

  revalidatePath("/dashboard/hr/payroll");
  return { generated: payslips.length };
}

export async function confirmPayslip(id: string) {
  const companyId = await getCompanyId();
  const payslip = await prisma.payslip.update({
    where: { id, companyId },
    data: { status: "CONFIRMED" },
  });
  revalidatePath("/dashboard/hr/payroll");
  return payslip;
}

export async function markPayslipPaid(id: string) {
  const companyId = await getCompanyId();
  const payslip = await prisma.payslip.update({
    where: { id, companyId },
    data: { status: "PAID", paidAt: new Date() },
  });
  revalidatePath("/dashboard/hr/payroll");
  return payslip;
}
