import { notFound } from "next/navigation";
import Link from "next/link";
import { getServiceOrder, updateServiceOrderStatus } from "@/lib/actions/field-service";
import { getContacts } from "@/lib/actions/contacts";
import { getEmployees } from "@/lib/actions/hr";
import { getWorksheetTemplates, updateServiceOrder } from "@/lib/actions/field-service";
import { getProducts } from "@/lib/actions/inventory";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronLeft, MapPin, Calendar, User, Phone, ExternalLink } from "lucide-react";
import { ServiceOrderForm } from "../new/service-order-form";
import { StatusButtons } from "./status-buttons";
import { WorksheetForm } from "./worksheet-form";
import { PartsPanel } from "./parts-panel";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  DRAFT:       { label: "Draft",       variant: "outline" },
  SCHEDULED:   { label: "Scheduled",   variant: "default" },
  IN_PROGRESS: { label: "In Progress", variant: "default" },
  COMPLETED:   { label: "Completed",   variant: "secondary" },
  CANCELLED:   { label: "Cancelled",   variant: "destructive" },
};

const priorityConfig: Record<string, { label: string; className: string }> = {
  LOW:    { label: "Low",    className: "text-blue-600" },
  NORMAL: { label: "Normal", className: "text-gray-500" },
  HIGH:   { label: "High",   className: "text-orange-600" },
  URGENT: { label: "Urgent", className: "text-red-600 font-semibold" },
};

interface Props { params: Promise<{ id: string }> }

export default async function ServiceOrderDetailPage({ params }: Props) {
  const { id } = await params;
  const [order, contacts, employees, templates, products] = await Promise.all([
    getServiceOrder(id),
    getContacts(),
    getEmployees(),
    getWorksheetTemplates(),
    getProducts(),
  ]);
  if (!order) notFound();

  const customers = contacts.filter((c) => c.type === "CUSTOMER" || c.type === "BOTH");
  const sc = statusConfig[order.status];
  const pc = priorityConfig[order.priority];
  const canEdit = order.status === "DRAFT" || order.status === "SCHEDULED";
  const update = updateServiceOrder.bind(null, id);

  const mapQuery = order.latitude && order.longitude
    ? `${order.latitude},${order.longitude}`
    : order.address
    ? encodeURIComponent(order.address)
    : null;

  const googleMapsUrl = order.latitude && order.longitude
    ? `https://www.google.com/maps?q=${order.latitude},${order.longitude}`
    : order.address
    ? `https://www.google.com/maps/search/${encodeURIComponent(order.address)}`
    : null;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/field-service"><ChevronLeft className="h-4 w-4 mr-1" />Back</Link>
          </Button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-2xl font-bold tracking-tight font-mono">{order.number}</h2>
              <Badge variant={sc.variant}>{sc.label}</Badge>
              <span className={`text-sm ${pc.className}`}>{pc.label} priority</span>
            </div>
            <p className="text-base font-medium mt-0.5">{order.title}</p>
            <p className="text-sm text-muted-foreground">{order.customer.name}</p>
          </div>
        </div>
        <StatusButtons orderId={id} currentStatus={order.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column — info + map */}
        <div className="space-y-4 lg:col-span-1">
          <Card>
            <CardHeader><CardTitle className="text-sm">Customer</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="font-medium">{order.customer.name}</p>
              {order.customer.phone && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-3.5 w-3.5" />
                  <span>{order.customer.phone}</span>
                </div>
              )}
              {order.customer.address && (
                <p className="text-muted-foreground">{order.customer.address}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">Technician</CardTitle></CardHeader>
            <CardContent className="text-sm">
              {order.technician ? (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{order.technician.firstName} {order.technician.lastName}</span>
                </div>
              ) : (
                <p className="text-muted-foreground">Not assigned</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">Schedule</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {order.scheduledAt && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{new Date(order.scheduledAt).toLocaleString("pt-AO")}</span>
                </div>
              )}
              {order.startedAt && (
                <p className="text-muted-foreground">Started: {new Date(order.startedAt).toLocaleString("pt-AO")}</p>
              )}
              {order.completedAt && (
                <p className="text-green-600">Completed: {new Date(order.completedAt).toLocaleString("pt-AO")}</p>
              )}
              {!order.scheduledAt && !order.startedAt && <p className="text-muted-foreground">No schedule set</p>}
            </CardContent>
          </Card>

          {/* Map */}
          {mapQuery && (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" />Location
                  </CardTitle>
                  {googleMapsUrl && (
                    <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-primary hover:underline">
                      <ExternalLink className="h-3 w-3" />Open in Maps
                    </a>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-0 overflow-hidden rounded-b-lg">
                {order.address && (
                  <p className="text-xs text-muted-foreground px-4 pb-2">{order.address}</p>
                )}
                <iframe
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${(order.longitude ?? 13.2343) - 0.01},${(order.latitude ?? -8.8368) - 0.01},${(order.longitude ?? 13.2343) + 0.01},${(order.latitude ?? -8.8368) + 0.01}&layer=mapnik${order.latitude && order.longitude ? `&marker=${order.latitude},${order.longitude}` : ""}`}
                  width="100%"
                  height="220"
                  style={{ border: 0 }}
                  loading="lazy"
                  title="Service location map"
                />
              </CardContent>
            </Card>
          )}

          {!mapQuery && order.address && (
            <Card>
              <CardHeader><CardTitle className="text-sm flex items-center gap-1.5"><MapPin className="h-4 w-4" />Location</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm">{order.address}</p>
                <a
                  href={`https://www.google.com/maps/search/${encodeURIComponent(order.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2"
                >
                  <ExternalLink className="h-3 w-3" />View on Google Maps
                </a>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column — tabs */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="worksheet">
            <TabsList>
              {order.worksheet && <TabsTrigger value="worksheet">Worksheet</TabsTrigger>}
              <TabsTrigger value="parts">Parts ({order.parts.length})</TabsTrigger>
              {canEdit && <TabsTrigger value="edit">Edit</TabsTrigger>}
              {order.notes && <TabsTrigger value="notes">Notes</TabsTrigger>}
            </TabsList>

            {order.worksheet && (
              <TabsContent value="worksheet">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">{order.worksheet.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <WorksheetForm
                      orderId={id}
                      template={order.worksheet}
                      savedData={(order.worksheetData as Record<string, unknown>) ?? {}}
                      savedSignature={order.signature ?? undefined}
                      readOnly={order.status === "COMPLETED" || order.status === "CANCELLED"}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            <TabsContent value="parts">
              <Card>
                <CardHeader><CardTitle className="text-base">Parts & Materials Used</CardTitle></CardHeader>
                <CardContent>
                  <PartsPanel
                    orderId={id}
                    parts={order.parts}
                    products={products}
                    readOnly={order.status === "COMPLETED" || order.status === "CANCELLED"}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {canEdit && (
              <TabsContent value="edit">
                <Card>
                  <CardHeader><CardTitle className="text-base">Edit Order</CardTitle></CardHeader>
                  <CardContent>
                    <ServiceOrderForm
                      defaultValues={{
                        title: order.title,
                        description: order.description ?? "",
                        customerId: order.customerId,
                        technicianId: order.technicianId ?? "",
                        scheduledAt: order.scheduledAt ? new Date(order.scheduledAt).toISOString().slice(0, 16) : "",
                        address: order.address ?? "",
                        latitude: order.latitude ?? undefined,
                        longitude: order.longitude ?? undefined,
                        priority: order.priority as "LOW" | "NORMAL" | "HIGH" | "URGENT",
                        worksheetId: order.worksheetId ?? "",
                        notes: order.notes ?? "",
                      }}
                      onSubmit={update}
                      submitLabel="Save Changes"
                      customers={customers}
                      employees={employees}
                      templates={templates}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {order.notes && (
              <TabsContent value="notes">
                <Card>
                  <CardHeader><CardTitle className="text-base">Internal Notes</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap">{order.notes}</p>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>
    </div>
  );
}
