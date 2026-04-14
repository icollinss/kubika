import { notFound } from "next/navigation";
import Link from "next/link";
import { getContact, updateContact, deleteContact, addContactNote } from "@/lib/actions/contacts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { ChevronLeft, ShoppingCart, FileText, ShoppingBag, Receipt, Wrench, Mail, Phone, MapPin, Hash, MessageSquare } from "lucide-react";
import { ContactEditDialog } from "./contact-edit-dialog";
import { ContactNoteForm } from "./contact-note-form";

const typeBadge: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  CUSTOMER: { label: "Cliente",    variant: "default" },
  SUPPLIER: { label: "Fornecedor", variant: "secondary" },
  BOTH:     { label: "Ambos",      variant: "outline" },
};

const statusColors: Record<string, string> = {
  DRAFT:      "bg-gray-100 text-gray-600",
  CONFIRMED:  "bg-blue-100 text-blue-700",
  PAID:       "bg-green-100 text-green-700",
  PARTIAL:    "bg-yellow-100 text-yellow-700",
  OVERDUE:    "bg-red-100 text-red-700",
  CANCELLED:  "bg-red-50 text-red-400",
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
  const { id } = await params;
  const contact = await getContact(id);
  if (!contact) notFound();

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

  const defaultTab = contact.invoices.length > 0 ? "accounting"
    : contact.salesOrders.length > 0 ? "sales"
    : "notes";

  return (
    <div className="space-y-4 max-w-6xl">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/dashboard/contacts"><ChevronLeft className="h-4 w-4 mr-1" />Contactos</Link>
      </Button>

      {/* ── Smart buttons ─────────────────────────────────────────────── */}
      {(contact.salesOrders.length > 0 || contact.invoices.length > 0 || contact.purchaseOrders.length > 0 || contact.supplierBills.length > 0 || contact.serviceOrders.length > 0) && (
        <div className="flex flex-wrap gap-2">
          {contact.salesOrders.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-card text-sm">
              <ShoppingCart className="h-4 w-4 text-blue-500" />
              <div>
                <p className="font-semibold leading-none">{contact.salesOrders.length}</p>
                <p className="text-xs text-muted-foreground">Encomendas</p>
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
                <p className="text-xs text-muted-foreground">Faturas</p>
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
                <p className="text-xs text-orange-500">Em aberto</p>
              </div>
            </div>
          )}
          {contact.purchaseOrders.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-card text-sm">
              <ShoppingBag className="h-4 w-4 text-purple-500" />
              <div>
                <p className="font-semibold leading-none">{contact.purchaseOrders.length}</p>
                <p className="text-xs text-muted-foreground">Compras</p>
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
                <p className="text-xs text-muted-foreground">Fat. Fornecedor</p>
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
                <p className="text-xs text-muted-foreground">Serviços</p>
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
                    <span>Limite de crédito</span>
                    <span className="font-mono font-medium">{fmt(contact.creditLimit)} AOA</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Prazo de pagamento</span>
                    <span>{contact.creditTermsDays} dias</span>
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
              <TabsTrigger value="sales">Vendas ({contact.salesOrders.length})</TabsTrigger>
              <TabsTrigger value="purchases">Compras ({contact.purchaseOrders.length})</TabsTrigger>
              <TabsTrigger value="accounting">
                Contabilidade ({contact.invoices.length + contact.supplierBills.length})
              </TabsTrigger>
              {contact.serviceOrders.length > 0 && (
                <TabsTrigger value="service">Serviços ({contact.serviceOrders.length})</TabsTrigger>
              )}
              <TabsTrigger value="notes">Notas</TabsTrigger>
            </TabsList>

            {/* Sales */}
            <TabsContent value="sales">
              <Card>
                <CardContent className="p-0">
                  {contact.salesOrders.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">Sem encomendas de venda.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Número</TableHead>
                          <TableHead>Data</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {contact.salesOrders.map((o) => (
                          <TableRow key={o.id}>
                            <TableCell>
                              <Link href={`/dashboard/sales/orders/${o.id}`} className="font-mono font-medium hover:underline text-primary">{o.number}</Link>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">{fmtDate(o.createdAt)}</TableCell>
                            <TableCell><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[o.status] ?? "bg-gray-100 text-gray-600"}`}>{o.status}</span></TableCell>
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
                    <p className="text-sm text-muted-foreground text-center py-8">Sem ordens de compra.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Número</TableHead>
                          <TableHead>Data</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {contact.purchaseOrders.map((o) => (
                          <TableRow key={o.id}>
                            <TableCell>
                              <Link href={`/dashboard/purchasing/orders/${o.id}`} className="font-mono font-medium hover:underline text-primary">{o.number}</Link>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">{fmtDate(o.createdAt)}</TableCell>
                            <TableCell><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[o.status] ?? "bg-gray-100 text-gray-600"}`}>{o.status}</span></TableCell>
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
                    <div className="px-4 py-2.5 border-b font-semibold text-sm">Faturas de Venda</div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Número</TableHead>
                          <TableHead>Data</TableHead>
                          <TableHead>Vencimento</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead className="text-right">Em aberto</TableHead>
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
                            <TableCell><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[inv.status] ?? "bg-gray-100 text-gray-600"}`}>{inv.status}</span></TableCell>
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
                    <div className="px-4 py-2.5 border-b font-semibold text-sm">Faturas de Fornecedor</div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Número</TableHead>
                          <TableHead>Data</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead className="text-right">Em aberto</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {contact.supplierBills.map((b) => (
                          <TableRow key={b.id}>
                            <TableCell>
                              <Link href={`/dashboard/purchasing/bills/${b.id}`} className="font-mono font-medium hover:underline text-primary">{b.number}</Link>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">{fmtDate(b.billDate)}</TableCell>
                            <TableCell><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[b.status] ?? "bg-gray-100 text-gray-600"}`}>{b.status}</span></TableCell>
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
                <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">Sem movimentos contabilísticos.</CardContent></Card>
              )}
            </TabsContent>

            {/* Service */}
            <TabsContent value="service">
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Número</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contact.serviceOrders.map((o) => (
                        <TableRow key={o.id}>
                          <TableCell>
                            <Link href={`/dashboard/field-service/${o.id}`} className="font-mono font-medium hover:underline text-primary">{o.number}</Link>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">{fmtDate(o.createdAt)}</TableCell>
                          <TableCell><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[o.status] ?? "bg-gray-100 text-gray-600"}`}>{o.status}</span></TableCell>
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
                    <p className="text-sm text-muted-foreground">Sem notas ainda.</p>
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
