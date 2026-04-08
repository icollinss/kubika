import Link from "next/link";
import { getContacts } from "@/lib/actions/contacts";
import { getEmployees } from "@/lib/actions/hr";
import { getWorksheetTemplates, createServiceOrder } from "@/lib/actions/field-service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft } from "lucide-react";
import { ServiceOrderForm } from "./service-order-form";

export default async function NewServiceOrderPage() {
  const [contacts, employees, templates] = await Promise.all([
    getContacts(),
    getEmployees(),
    getWorksheetTemplates(),
  ]);

  const customers = contacts.filter((c) => c.type === "CUSTOMER" || c.type === "BOTH");

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/field-service"><ChevronLeft className="h-4 w-4 mr-1" />Back</Link>
        </Button>
        <h2 className="text-2xl font-bold tracking-tight">New Service Order</h2>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Service Details</CardTitle></CardHeader>
        <CardContent>
          <ServiceOrderForm
            onSubmit={createServiceOrder}
            customers={customers}
            employees={employees}
            templates={templates}
            submitLabel="Create Service Order"
          />
        </CardContent>
      </Card>
    </div>
  );
}
