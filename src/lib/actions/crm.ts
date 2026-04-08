"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

type LeadSource = "FACEBOOK" | "INSTAGRAM" | "LINKEDIN" | "TIKTOK" | "YOUTUBE" | "WHATSAPP" | "WEBSITE" | "REFERRAL" | "MANUAL" | "OTHER";
type LeadStatus = "NEW" | "CONTACTED" | "QUALIFIED" | "PROPOSAL" | "WON" | "LOST";

async function getCompanyId() {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Unauthenticated");
  const user = await prisma.user.findUniqueOrThrow({ where: { email: session.user.email } });
  if (!user.companyId) throw new Error("No company");
  return user.companyId;
}

// ─── Leads ───────────────────────────────────────────────────────────────────

export async function getLeads(filters?: { status?: LeadStatus; source?: LeadSource; search?: string }) {
  const companyId = await getCompanyId();
  return prisma.lead.findMany({
    where: {
      companyId,
      ...(filters?.status ? { status: filters.status } : {}),
      ...(filters?.source ? { source: filters.source } : {}),
      ...(filters?.search
        ? {
            OR: [
              { name: { contains: filters.search, mode: "insensitive" } },
              { email: { contains: filters.search, mode: "insensitive" } },
              { company: { contains: filters.search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: { activities: { orderBy: { createdAt: "desc" }, take: 1 } },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getLead(id: string) {
  const companyId = await getCompanyId();
  return prisma.lead.findFirst({
    where: { id, companyId },
    include: { activities: { orderBy: { createdAt: "desc" } } },
  });
}

export async function createLead(data: {
  name: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  company?: string;
  jobTitle?: string;
  source: LeadSource;
  expectedValue?: number;
  notes?: string;
}) {
  const companyId = await getCompanyId();
  const lead = await prisma.lead.create({
    data: { ...data, companyId, status: "NEW" },
  });
  revalidatePath("/dashboard/crm");
  return lead;
}

export async function updateLead(id: string, data: {
  name?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  company?: string;
  jobTitle?: string;
  source?: LeadSource;
  expectedValue?: number;
  notes?: string;
}) {
  const companyId = await getCompanyId();
  const lead = await prisma.lead.update({
    where: { id, companyId },
    data,
  });
  revalidatePath("/dashboard/crm");
  revalidatePath(`/dashboard/crm/leads/${id}`);
  return lead;
}

export async function updateLeadStatus(id: string, status: LeadStatus) {
  const companyId = await getCompanyId();
  await prisma.lead.update({ where: { id, companyId }, data: { status } });
  revalidatePath("/dashboard/crm");
  revalidatePath(`/dashboard/crm/leads/${id}`);
}

export async function addLeadActivity(leadId: string, type: string, body: string) {
  const companyId = await getCompanyId();
  await prisma.leadActivity.create({ data: { leadId, type, body, companyId } });
  revalidatePath(`/dashboard/crm/leads/${leadId}`);
}

export async function deleteLead(id: string) {
  const companyId = await getCompanyId();
  await prisma.lead.delete({ where: { id, companyId } });
  revalidatePath("/dashboard/crm");
}

export async function convertLead(id: string) {
  const companyId = await getCompanyId();
  const lead = await prisma.lead.findFirstOrThrow({ where: { id, companyId } });

  const contact = await prisma.contact.create({
    data: {
      name: lead.name,
      email: lead.email ?? undefined,
      phone: lead.phone ?? undefined,
      whatsapp: lead.whatsapp ?? undefined,
      notes: lead.notes ?? undefined,
      type: "CUSTOMER",
      companyId,
    },
  });

  await prisma.lead.update({
    where: { id },
    data: { status: "WON", convertedToId: contact.id },
  });

  await prisma.leadActivity.create({
    data: {
      leadId: id,
      type: "NOTE",
      body: `Lead converted to customer: ${contact.name}`,
      companyId,
    },
  });

  revalidatePath("/dashboard/crm");
  revalidatePath(`/dashboard/crm/leads/${id}`);
  return contact;
}

// ─── Pipeline summary ─────────────────────────────────────────────────────────

export async function getPipelineSummary() {
  const companyId = await getCompanyId();
  const leads = await prisma.lead.findMany({
    where: { companyId, status: { notIn: ["WON", "LOST"] } },
    select: { status: true, expectedValue: true },
  });

  const stages: LeadStatus[] = ["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL"];
  return stages.map((status) => {
    const group = leads.filter((l) => l.status === status);
    return {
      status,
      count: group.length,
      value: group.reduce((s, l) => s + (l.expectedValue ?? 0), 0),
    };
  });
}

export async function getWhatsappLogs() {
  const companyId = await getCompanyId();
  return prisma.whatsappLog.findMany({
    where: { companyId },
    orderBy: { sentAt: "desc" },
    take: 50,
  });
}
