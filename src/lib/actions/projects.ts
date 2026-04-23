"use server";

import { getCompanyId } from "@/lib/get-company-id";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";


async function nextProjectRef(companyId: string): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.project.count({ where: { companyId } });
  return `PRJ/${year}/${String(count + 1).padStart(4, "0")}`;
}

// ─── Analytic Accounts ────────────────────────────────────────────────────────

export async function getAnalyticAccounts() {
  const companyId = await getCompanyId();
  return prisma.analyticAccount.findMany({
    where: { companyId, isActive: true },
    orderBy: { code: "asc" },
  });
}

export async function createAnalyticAccount(data: {
  code: string;
  name: string;
  description?: string;
}) {
  const companyId = await getCompanyId();
  const account = await prisma.analyticAccount.create({
    data: { ...data, companyId },
  });
  revalidatePath("/dashboard/accounting/analytic");
  revalidatePath("/dashboard/projects");
  return account;
}

export async function updateAnalyticAccount(id: string, data: {
  code: string;
  name: string;
  description?: string;
}) {
  const companyId = await getCompanyId();
  await prisma.analyticAccount.update({ where: { id, companyId }, data });
  revalidatePath("/dashboard/accounting/analytic");
}

export async function toggleAnalyticAccount(id: string) {
  const companyId = await getCompanyId();
  const acc = await prisma.analyticAccount.findFirstOrThrow({ where: { id, companyId } });
  await prisma.analyticAccount.update({ where: { id }, data: { isActive: !acc.isActive } });
  revalidatePath("/dashboard/accounting/analytic");
}

export async function getAllAnalyticAccounts() {
  const companyId = await getCompanyId();
  return prisma.analyticAccount.findMany({
    where: { companyId },
    orderBy: { code: "asc" },
  });
}

// ─── Projects ─────────────────────────────────────────────────────────────────

export async function getProjects() {
  const companyId = await getCompanyId();
  const projects = await prisma.project.findMany({
    where: { companyId },
    include: {
      analyticAccount: true,
      _count: { select: { tasks: true, milestones: true } },
      tasks: { select: { status: true } },
      milestones: { select: { isDone: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return projects;
}

export async function getProject(id: string) {
  const companyId = await getCompanyId();
  return prisma.project.findFirst({
    where: { id, companyId },
    include: {
      analyticAccount: true,
      milestones: {
        include: { tasks: { orderBy: { sequence: "asc" } } },
        orderBy: { sequence: "asc" },
      },
      tasks: {
        where: { milestoneId: null },
        orderBy: [{ status: "asc" }, { sequence: "asc" }],
      },
      expenses: { orderBy: { date: "desc" } },
      timesheets: {
        include: { employee: true, task: true },
        orderBy: { date: "desc" },
        take: 20,
      },
    },
  });
}

export async function createProject(data: {
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
  priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  analyticAccountId?: string;
  managerId?: string;
}) {
  const companyId = await getCompanyId();
  const reference = await nextProjectRef(companyId);
  const project = await prisma.project.create({
    data: {
      ...data,
      reference,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      budget: data.budget ?? 0,
      companyId,
    },
  });
  revalidatePath("/dashboard/projects");
  return project;
}

export async function updateProject(id: string, data: {
  name?: string;
  description?: string;
  status?: "DRAFT" | "IN_PROGRESS" | "ON_HOLD" | "COMPLETED" | "CANCELLED";
  priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  startDate?: string;
  endDate?: string;
  budget?: number;
  analyticAccountId?: string;
}) {
  const companyId = await getCompanyId();
  const project = await prisma.project.update({
    where: { id, companyId },
    data: {
      ...data,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
    },
  });
  revalidatePath(`/dashboard/projects/${id}`);
  revalidatePath("/dashboard/projects");
  return project;
}

// ─── Milestones ───────────────────────────────────────────────────────────────

export async function createMilestone(data: {
  projectId: string;
  name: string;
  description?: string;
  dueDate?: string;
  sequence?: number;
}) {
  const companyId = await getCompanyId();
  const milestone = await prisma.projectMilestone.create({
    data: {
      ...data,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      companyId,
    },
  });
  revalidatePath(`/dashboard/projects/${data.projectId}`);
  return milestone;
}

export async function toggleMilestone(id: string, projectId: string) {
  const companyId = await getCompanyId();
  const ms = await prisma.projectMilestone.findFirst({ where: { id, companyId } });
  if (!ms) throw new Error("Not found");
  await prisma.projectMilestone.update({
    where: { id },
    data: { isDone: !ms.isDone, doneAt: !ms.isDone ? new Date() : null },
  });
  revalidatePath(`/dashboard/projects/${projectId}`);
}

// ─── Tasks ────────────────────────────────────────────────────────────────────

export async function createTask(data: {
  projectId: string;
  milestoneId?: string;
  title: string;
  description?: string;
  status?: "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE" | "CANCELLED";
  priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  assigneeId?: string;
  dueDate?: string;
  estimatedHours?: number;
}) {
  const companyId = await getCompanyId();
  const task = await prisma.projectTask.create({
    data: {
      ...data,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      companyId,
    },
  });
  revalidatePath(`/dashboard/projects/${data.projectId}`);
  return task;
}

export async function updateTaskStatus(id: string, projectId: string, status: "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE" | "CANCELLED") {
  const companyId = await getCompanyId();
  await prisma.projectTask.update({ where: { id, companyId }, data: { status } });
  revalidatePath(`/dashboard/projects/${projectId}`);
}

// ─── Timesheets ───────────────────────────────────────────────────────────────

export async function logTime(data: {
  projectId: string;
  taskId?: string;
  employeeId: string;
  date: string;
  hours: number;
  description?: string;
}) {
  const companyId = await getCompanyId();
  const entry = await prisma.timesheet.create({
    data: { ...data, date: new Date(data.date), companyId },
  });
  revalidatePath(`/dashboard/projects/${data.projectId}`);
  return entry;
}

// ─── Project Expenses ─────────────────────────────────────────────────────────

export async function addProjectExpense(data: {
  projectId: string;
  analyticAccountId?: string;
  description: string;
  amount: number;
  date?: string;
  category?: string;
  reference?: string;
}) {
  const companyId = await getCompanyId();
  const expense = await prisma.projectExpense.create({
    data: {
      ...data,
      date: data.date ? new Date(data.date) : new Date(),
      companyId,
    },
  });
  revalidatePath(`/dashboard/projects/${data.projectId}`);
  return expense;
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

export async function getProjectStats() {
  const companyId = await getCompanyId();
  const [total, inProgress, completed, overBudget] = await Promise.all([
    prisma.project.count({ where: { companyId } }),
    prisma.project.count({ where: { companyId, status: "IN_PROGRESS" } }),
    prisma.project.count({ where: { companyId, status: "COMPLETED" } }),
    prisma.project.findMany({
      where: { companyId, budget: { gt: 0 } },
      include: { expenses: { select: { amount: true } } },
    }).then((ps) => ps.filter((p) => p.expenses.reduce((s, e) => s + e.amount, 0) > p.budget).length),
  ]);
  return { total, inProgress, completed, overBudget };
}
