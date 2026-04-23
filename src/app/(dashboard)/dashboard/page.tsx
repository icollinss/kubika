import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { DashboardHome, type DashboardStats, type RecentSale } from "@/components/views/dashboard-home";

async function getCompanyId(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { companyId: true },
  });
  return user?.companyId ?? null;
}

interface Props {
  searchParams: Promise<{ view?: string }>;
}

export default async function DashboardPage({ searchParams }: Props) {
  const [session, { view = "apps" }] = await Promise.all([
    auth(),
    searchParams,
  ]);

  const userName = session?.user?.name?.split(" ")[0] ?? "there";
  const companyId = session?.user?.id ? await getCompanyId(session.user.id) : null;

  let stats: DashboardStats = {
    contacts: 0,
    products: 0,
    salesOrdersThisMonth: 0,
    unpaidInvoices: 0,
    unpaidAmount: 0,
    revenueThisMonth: 0,
    overdueInvoices: 0,
  };

  let recentSales: RecentSale[] = [];

  if (companyId) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      contacts,
      products,
      salesThisMonth,
      unpaidData,
      revenueData,
      overdueCount,
      recentSalesData,
    ] = await Promise.all([
      prisma.contact.count({ where: { companyId } }),
      prisma.product.count({ where: { companyId, isArchived: false } }),
      prisma.salesOrder.count({
        where: { companyId, createdAt: { gte: monthStart } },
      }),
      prisma.invoice.aggregate({
        where: { companyId, status: { in: ["DRAFT", "CONFIRMED", "PARTIAL", "OVERDUE"] } },
        _count: true,
        _sum: { amountDue: true },
      }),
      prisma.invoice.aggregate({
        where: {
          companyId,
          status: { in: ["CONFIRMED", "PAID", "PARTIAL"] },
          invoiceDate: { gte: monthStart },
        },
        _sum: { total: true },
      }),
      prisma.invoice.count({ where: { companyId, status: "OVERDUE" } }),
      prisma.salesOrder.findMany({
        where: { companyId },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { customer: { select: { name: true } } },
      }),
    ]);

    stats = {
      contacts,
      products,
      salesOrdersThisMonth: salesThisMonth,
      unpaidInvoices: unpaidData._count,
      unpaidAmount: unpaidData._sum.amountDue ?? 0,
      revenueThisMonth: revenueData._sum.total ?? 0,
      overdueInvoices: overdueCount,
    };

    recentSales = recentSalesData.map((o) => ({
      id: o.id,
      number: o.number,
      customer: o.customer.name,
      total: o.total,
      status: o.status,
      date: o.createdAt,
    }));
  }

  return (
    <DashboardHome
      userName={userName}
      stats={stats}
      recentSales={recentSales}
      view={(view === "overview" ? "overview" : "apps") as "apps" | "overview"}
    />
  );
}
