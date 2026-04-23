import { notFound } from "next/navigation";
import Link from "next/link";
import { getContact, updateContact, deleteContact, addContactNote } from "@/lib/actions/contacts";
import { getServerTranslations } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { ChevronLeft, ShoppingCart, FileText, ShoppingBag, Receipt, Wrench, Mail, Phone, MapPin, Hash, MessageSquare, Plus } from "lucide-react";
import { ContactEditDialog } from "./contact-edit-dialog";
import { ContactNoteForm } from "./contact-note-form";
import type { Translations } from "@/lib/i18n";

function statusLabel(status: string, t: Translations): string {
  const map: Record<string, string> = {
    DRAFT:       t.status.draft,
    CONFIRMED:   t.status.confirmed,
    PAID:        t.status.paid,
    PARTIAL:     t.status.partial,
    OVERDUE:     t.status.overdue,
    CANCELLED:   t.status.cancelled,
    DELIVERED:   t.status.delivered,
    QUOTATION:   t.status.quotation,
    RECEIVED:    t.status.received,
    OPEN:        t.status.open,
    IN_PROGRESS: t.status.inProgress,
    DONE:        t.status.done,
  };
  return map[status] ?? status;
}

const statusColors: Record<string, string> = {
  DRAFT:      "bg-gray-100 text-gray-600",
  CONFIRMED:  "bg-blue-100 text-blue-700",
  PAID:       "bg-green-100 text-green-700",
  PARTIAL:    "bg-yellow-100 text-yellow-700",
  OVERDUE:    "bg-red-100 text-red-700",
  CANCELLED:  "bg-red-50 text-red-400",
  QUOTATION:  "bg-gray-100 text-gray-600",
  RECEIVED:   "bg-green-100 text-green-700",
  OPEN:       "bg-blue-100 text-blue-700",
  IN_PROGRESS:"bg-purple-100 text-purple-700",
  DONE:       "bg-green-100 text-green-700",
};

function fmt(n: number) {
  return n.toLocaleString("pt-AO", { minimumFractionDigits: 2 });
}
function fmtDate(d: Date | string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-AO");
}

interface Props { params: Promise<{ id: string }> }

export default async function ContactDetailPage({ params }: Props) {
  const [{ id }, t] = await Promise.all([params, getServerTranslations()]);
  const contact = await getContact(id);
  if (!contact) notFound();

  const typeBadge: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
    CUSTOMER: { label: t.contacts.customer, variant: "default"   },
    SUPPLIER: { label: t.contacts.supplier, variant: "secondary" },
    BOTH:     { label: t.contacts.both,     variant: "outline"   },
  };

  const badge = typeBadge[contact.type];

  const salesTotal     = contact.salesOrders.reduce((s, o) => s + o.total, 0);
  const invoicesTotal  = contact.invoices.reduce((s, i) => s + i.total, 0);
  const outstanding    = contact.invoices.reduce((s, i) => s + i.amountDue, 0);
  const purchasesTotal = contact.purchaseOrders.reduce((s, o) => s + o.total, 0);
  const billsTotal     = contact.supplierBills.reduce((s, b) => s + b.total, 0);

  const initials = contact.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  const update  = updateContact.bind(null, id);
  const del     = deleteContact.bind(null, id);
  const addNote = addContactNote.bind(null, id);

  const isCustomer = contact.type === "CUSTOMER" || contact.type === "BOTH";

  // Statement ledger — one row per invoice, paid = total - amountDue
  const statementRows = [...contact.invoices]
    .sort((a, b) => new Date(a.invoiceDate ?? 0).getTime() - new Date(b.invoiceDate ?? 0).getTime())
    .map((inv) => ({
      id: inv.id,
      date: inv.invoiceDate,
      reference: inv.number,
      href: `/dashboard/sales/invoices/${inv.id}`,
      debit: inv.total,
      credit: inv.total - inv.amountDue,
      status: inv.status,
    }));

  let running = 0;
  const statementWithBalance = statementRows.map((row) => {
    running += row.debit - row.credit;
    return { ...row, balance: running };
  });

  const totalBilled = contact.invoices.reduce((s, i) => s + i.total, 0);
  const totalPaid   = contact.invoices.reduce((s, i) => s + (i.total - i.amountDue), 0);

  const defaultTab = contact.invoices.length > 0 ? "accounting"
    : contact.salesOrders.length > 0 ? "sales"
    : "notes";

  return (
    <div className="space-y-4 max-w-6xl">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/contacts">
            <ChevronLeft className="h-4 w-4 mr-1" />{t.contacts.title}
          </Link>
        </Button>
        {isCustomer && (
          <Button size="sm" asChild>
            <Link href={`/dashboard/sales/orders/new?customerId=${contact.id}`}>
              <Plus className="h-4 w-4 mr-1.5" />{t.contacts.newQuote}
            </Link>
          </Button>
        )}
      </div>

      {/* ── Smart buttons ─────────────────────────────────────────────── */}
      {(contact.salesOrders.length > 0 || contact.invoices.length > 0 || contact.purchaseOrders.length > 0 || contact.supplierBills.length > 0 || contact.serviceOrders.length > 0) && (
        <div className="flex flex-wrap gap-2">
          {contact.salesOrders.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-card text-sm">
              <ShoppingCart className="h-4 w-4 text-blue-500" />
              <div>
                <p className="font-semibold leading-none">{contact.salesOrders.length}</p>
                <p className="text-xs text-muted-foreground">{t.contacts.smartOrders}</p>
              </div>
              <Separator orientation="vertical" className="h-5 mx-1" />
              <span className="text-xs font-mono text-muted-foreground">{fmt(salesTotal)} AOA</span>
            </div>
          )}
          {contact.invoices.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-card text-sm">
              <FileText className="h-4 w-4 text-green-500" />
              <div>
                <p className="font-semibold leading-none">{contact.invoices.length}</p>
                <p className="text-xs text-muted-foreground">{t.nav.invoices}</p>
              </div>
              <Separator orientation="vertical" className="h-5 mx-1" />
              <span className="text-xs font-mono text-muted-foreground">{fmt(invoicesTotal)} AOA</span>
            </div>
          )}
          {outstanding > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-orange-200 bg-orange-50 text-sm">
              <Receipt className="h-4 w-4 text-orange-500" />
              <div>
                <p className="font-semibold leading-none text-orange-700">{fmt(outstanding)} AOA</p>
                <p className="text-xs text-orange-500">{t.contacts.smartOutstanding}</p>
              </div>
            </div>
          )}
          {contact.purchaseOrders.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-card text-sm">
              <ShoppingBag className="h-4 w-4 text-purple-500" />
              <div>
                <p className="font-semibold leading-none">{contact.purchaseOrders.length}</p>
                <p className="text-xs text-muted-foreground">{t.nav.purchasing}</p>
              </div>
              <Separator orientation="vertical" className="h-5 mx-1" />
              <span className="text-xs font-mono text-muted-foreground">{fmt(purchasesTotal)} AOA</span>
            </div>
          )}
          {contact.supplierBills.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-card text-sm">
              <Receipt className="h-4 w-4 text-red-500" />
              <div>
                <p className="font-semibold leading-none">{contact.supplierBills.length}</p>
                <p className="text-xs text-muted-foreground">{t.contacts.smartBills}</p>
              </div>
              <Separator orientation="vertical" className="h-5 mx-1" />
              <span className="text-xs font-mono text-muted-foreground">{fmt(billsTotal)} AOA</span>
            </div>
          )}
          {contact.serviceOrders.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-card text-sm">
              <Wrench className="h-4 w-4 text-teal-500" />
              <div>
                <p className="font-semibold leading-none">{contact.serviceOrders.length}</p>
                <p className="text-xs text-muted-foreground">{t.contacts.smartServices}</p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        {/* ── Info card ─────────────────────────────────────────────────── */}
        <Card>
          <CardContent className="pt-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-xl shrink-0">
                {initials}
              </div>
              <div className="flex-1 min-w-0 pt-1">
                <h2 className="text-lg font-bold leading-tight">{contact.name}</h2>
                <Badge variant={badge.variant} className="text-xs mt-1">{badge.label}</Badge>
              </div>
            </div>

            <Separator />

            <div className="space-y-2.5 text-sm">
              {contact.email && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  <a href={`mailto:${contact.email}`} className="hover:text-foreground truncate">{contact.email}</a>
                </div>
              )}
              {contact.phone && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  <a href={`tel:${contact.phone}`} className="hover:text-foreground">{contact.phone}</a>
                </div>
              )}
              {contact.whatsapp && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MessageSquare className="h-3.5 w-3.5 shrink-0 text-green-500" />
                  <span>{contact.whatsapp}</span>
                </div>
              )}
              {(contact.address || contact.city || contact.country) && (
                <div className="flex items-start gap-2 text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    {contact.address && <p>{contact.address}</p>}
                    {contact.city && <p>{contact.city}</p>}
                    <p>{contact.country}</p>
                  </div>
                </div>
              )}
              {contact.taxId && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Hash className="h-3.5 w-3.5 shrink-0" />
                  <span>NIF: {contact.taxId}</span>
                </div>
              )}
            </div>

            {contact.creditLimit > 0 && (
              <>
                <Separator />
                <div className="text-xs space-y-1.5 text-muted-foreground">
                  <div className="flex justify-between">
                    <span>{t.contacts.creditLimit}</span>
                    <span className="font-mono font-medium">{fmt(contact.creditLimit)} AOA</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t.contacts.paymentTerms}</span>
                    <span>{contact.creditTermsDays} {t.contacts.days}</span>
                  </div>
                </div>
              </>
            )}

            <Separator />
            <ContactEditDialog contact={contact} onUpdate={update} onDelete={del} />
          </CardContent>
        </Card>

        {/* ── Tabs ──────────────────────────────────────────────────────── */}
        <div className="lg:col-span-2">
          <Tabs defaultValue={defaultTab}>
            <TabsList>
              <TabsTrigger value="sales">{t.contacts.tabSales} ({contact.salesOrders.length})</TabsTrigger>
              <TabsTrigger value="purchases">{t.contacts.tabPurchases} ({contact.purchaseOrders.length})</TabsTrigger>
              <TabsTrigger value="accounting">
                {t.contacts.tabAccounting} ({contact.invoices.length + contact.supplierBills.length})
              </TabsTrigger>
              {isCustomer && (
                <TabsTrigger value="statement">{t.contacts.tabStatement} ({contact.invoices.length})</TabsTrigger>
              )}
              {contact.serviceOrders.length > 0 && (
                <TabsTrigger value="service">{t.contacts.tabService} ({contact.serviceOrders.length})</TabsTrigger>
              )}
              <TabsTrigger value="notes">{t.contacts.tabNotes}</TabsTrigger>
            </TabsList>

            {/* Sales */}
            <TabsContent value="sales">
              <Card>
                <CardContent className="p-0">
                  {/* Tab header with New Quote button */}
                  {isCustomer && (
                    <div className="flex items-center justify-between px-4 py-2.5 border-b">
                      <span className="text-sm font-semibold">{t.contacts.tabSales}</span>
                      <Button size="sm" asChild>
                        <Link href={`/dashboard/sales/orders/new?customerId=${contact.id}`}>
                          <Plus className="h-3.5 w-3.5 mr-1.5" />{t.contacts.newQuote}
                        </Link>
                      </Button>
                    </div>
                  )}
                  {contact.salesOrders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-2">
                      <p className="text-sm text-muted-foreground">{t.contacts.noSalesOrders}</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t.contacts.colNumber}</TableHead>
                          <TableHead>{t.contacts.colDate}</TableHead>
                          <TableHead>{t.contacts.colStatus}</TableHead>
                          <TableHead className="text-right">{t.contacts.colTotal}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {contact.salesOrders.map((o) => (
                          <TableRow key={o.id}>
                            <TableCell>
                              <Link href={`/dashboard/sales/orders/${o.id}`} className="font-mono font-medium hover:underline text-primary">{o.number}</Link>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">{fmtDate(o.createdAt)}</TableCell>
                            <TableCell>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[o.status] ?? "bg-gray-100 text-gray-600"}`}>
                                {statusLabel(o.status, t)}
                              </span>
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm">{fmt(o.total)} AOA</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Purchases */}
            <TabsContent value="purchases">
              <Card>
                <CardContent className="p-0">
                  {contact.purchaseOrders.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">{t.contacts.noPurchaseOrders}</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t.contacts.colNumber}</TableHead>
                          <TableHead>{t.contacts.colDate}</TableHead>
                          <TableHead>{t.contacts.colStatus}</TableHead>
                          <TableHead className="text-right">{t.contacts.colTotal}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {contact.purchaseOrders.map((o) => (
                          <TableRow key={o.id}>
                            <TableCell>
                              <Link href={`/dashboard/purchasing/orders/${o.id}`} className="font-mono font-medium hover:underline text-primary">{o.number}</Link>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">{fmtDate(o.createdAt)}</TableCell>
                            <TableCell>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[o.status] ?? "bg-gray-100 text-gray-600"}`}>
                                {statusLabel(o.status, t)}
                              </span>
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm">{fmt(o.total)} AOA</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Accounting */}
            <TabsContent value="accounting" className="space-y-3">
              {contact.invoices.length > 0 && (
                <Card>
                  <CardContent className="p-0">
                    <div className="px-4 py-2.5 border-b font-semibold text-sm">{t.contacts.salesInvoices}</div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t.contacts.colNumber}</TableHead>
                          <TableHead>{t.contacts.colDate}</TableHead>
                          <TableHead>{t.contacts.colDueDate}</TableHead>
                          <TableHead>{t.contacts.colStatus}</TableHead>
                          <TableHead className="text-right">{t.contacts.colTotal}</TableHead>
                          <TableHead className="text-right">{t.contacts.colOutstanding}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {contact.invoices.map((inv) => (
                          <TableRow key={inv.id}>
                            <TableCell>
                              <Link href={`/dashboard/sales/invoices/${inv.id}`} className="font-mono font-medium hover:underline text-primary">{inv.number}</Link>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">{fmtDate(inv.invoiceDate)}</TableCell>
                            <TableCell className="text-muted-foreground text-sm">{fmtDate(inv.dueDate)}</TableCell>
                            <TableCell>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[inv.status] ?? "bg-gray-100 text-gray-600"}`}>
                                {statusLabel(inv.status, t)}
                              </span>
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm">{fmt(inv.total)} AOA</TableCell>
                            <TableCell className={`text-right font-mono text-sm ${inv.amountDue > 0 ? "text-orange-600 font-semibold" : "text-muted-foreground"}`}>{fmt(inv.amountDue)} AOA</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
              {contact.supplierBills.length > 0 && (
                <Card>
                  <CardContent className="p-0">
                    <div className="px-4 py-2.5 border-b font-semibold text-sm">{t.contacts.supplierInvoicesLabel}</div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t.contacts.colNumber}</TableHead>
                          <TableHead>{t.contacts.colDate}</TableHead>
                          <TableHead>{t.contacts.colStatus}</TableHead>
                          <TableHead className="text-right">{t.contacts.colTotal}</TableHead>
                          <TableHead className="text-right">{t.contacts.colOutstanding}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {contact.supplierBills.map((b) => (
                          <TableRow key={b.id}>
                            <TableCell>
                              <Link href={`/dashboard/purchasing/bills/${b.id}`} className="font-mono font-medium hover:underline text-primary">{b.number}</Link>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">{fmtDate(b.billDate)}</TableCell>
                            <TableCell>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[b.status] ?? "bg-gray-100 text-gray-600"}`}>
                                {statusLabel(b.status, t)}
                              </span>
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm">{fmt(b.total)} AOA</TableCell>
                            <TableCell className={`text-right font-mono text-sm ${b.amountDue > 0 ? "text-orange-600 font-semibold" : "text-muted-foreground"}`}>{fmt(b.amountDue)} AOA</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
              {contact.invoices.length === 0 && contact.supplierBills.length === 0 && (
                <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">{t.contacts.noAccountingData}</CardContent></Card>
              )}
            </TabsContent>

            {/* Statement */}
            <TabsContent value="statement">
              {statementWithBalance.length === 0 ? (
                <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">{t.contacts.noStatement}</CardContent></Card>
              ) : (
                <div className="space-y-3">
                  {/* Summary cards */}
                  <div className="grid grid-cols-3 gap-3">
                    <Card>
                      <CardContent className="py-3 px-4">
                        <p className="text-xs text-muted-foreground">{t.contacts.totalBilled}</p>
                        <p className="text-lg font-bold tabular-nums">{fmt(totalBilled)} AOA</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="py-3 px-4">
                        <p className="text-xs text-muted-foreground">{t.contacts.totalPaid}</p>
                        <p className="text-lg font-bold text-green-600 tabular-nums">{fmt(totalPaid)} AOA</p>
                      </CardContent>
                    </Card>
                    <Card className={outstanding > 0 ? "border-orange-200 bg-orange-50" : ""}>
                      <CardContent className="py-3 px-4">
                        <p className="text-xs text-muted-foreground">{t.contacts.colOutstanding}</p>
                        <p className={`text-lg font-bold tabular-nums ${outstanding > 0 ? "text-orange-600" : "text-muted-foreground"}`}>{fmt(outstanding)} AOA</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Ledger table */}
                  <Card>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{t.contacts.colDate}</TableHead>
                            <TableHead>{t.contacts.colNumber}</TableHead>
                            <TableHead>{t.contacts.colStatus}</TableHead>
                            <TableHead className="text-right">{t.contacts.colDebit}</TableHead>
                            <TableHead className="text-right">{t.contacts.colCredit}</TableHead>
                            <TableHead className="text-right">{t.contacts.colBalance}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {statementWithBalance.map((row) => (
                            <TableRow key={row.id}>
                              <TableCell className="text-muted-foreground text-sm">{fmtDate(row.date)}</TableCell>
                              <TableCell>
                                <Link href={row.href} className="font-mono font-medium hover:underline text-primary">{row.reference}</Link>
                              </TableCell>
                              <TableCell>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[row.status] ?? "bg-gray-100 text-gray-600"}`}>
                                  {statusLabel(row.status, t)}
                                </span>
                              </TableCell>
                              <TableCell className="text-right font-mono text-sm">{fmt(row.debit)} AOA</TableCell>
                              <TableCell className="text-right font-mono text-sm text-green-600">{row.credit > 0 ? `${fmt(row.credit)} AOA` : "—"}</TableCell>
                              <TableCell className={`text-right font-mono text-sm font-semibold ${row.balance > 0 ? "text-orange-600" : "text-muted-foreground"}`}>
                                {fmt(row.balance)} AOA
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            {/* Service */}
            <TabsContent value="service">
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t.contacts.colNumber}</TableHead>
                        <TableHead>{t.contacts.colDate}</TableHead>
                        <TableHead>{t.contacts.colStatus}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contact.serviceOrders.map((o) => (
                        <TableRow key={o.id}>
                          <TableCell>
                            <Link href={`/dashboard/field-service/${o.id}`} className="font-mono font-medium hover:underline text-primary">{o.number}</Link>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">{fmtDate(o.createdAt)}</TableCell>
                          <TableCell>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[o.status] ?? "bg-gray-100 text-gray-600"}`}>
                              {statusLabel(o.status, t)}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notes */}
            <TabsContent value="notes">
              <Card>
                <CardContent className="pt-4 space-y-4">
                  {contact.notes ? (
                    <div className="text-sm whitespace-pre-wrap text-muted-foreground bg-muted/30 rounded-lg p-3 leading-relaxed">
                      {contact.notes}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">{t.contacts.noNotes}</p>
                  )}
                  <Separator />
                  <ContactNoteForm action={addNote} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
