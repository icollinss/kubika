import { notFound } from "next/navigation";
import Link from "next/link";
import { getContact, updateContact, deleteContact } from "@/lib/actions/contacts";
import { ContactForm } from "@/components/contacts/contact-form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, Trash2 } from "lucide-react";

const typeBadge: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  CUSTOMER: { label: "Customer", variant: "default" },
  SUPPLIER: { label: "Supplier", variant: "secondary" },
  BOTH: { label: "Both", variant: "outline" },
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ContactDetailPage({ params }: Props) {
  const { id } = await params;
  const contact = await getContact(id);

  if (!contact) notFound();

  const badge = typeBadge[contact.type];
  const update = updateContact.bind(null, id);

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/contacts">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold tracking-tight">{contact.name}</h2>
              <Badge variant={badge.variant}>{badge.label}</Badge>
            </div>
            {contact.email && (
              <p className="text-sm text-muted-foreground">{contact.email}</p>
            )}
          </div>
        </div>

        {/* Delete */}
        <form action={deleteContact.bind(null, id)}>
          <Button variant="destructive" size="sm" type="submit">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </form>
      </div>

      {/* Edit form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Edit Contact</CardTitle>
        </CardHeader>
        <CardContent>
          <ContactForm
            defaultValues={{
              name: contact.name,
              email: contact.email ?? "",
              phone: contact.phone ?? "",
              address: contact.address ?? "",
              city: contact.city ?? "",
              country: contact.country,
              taxId: contact.taxId ?? "",
              notes: contact.notes ?? "",
              type: contact.type,
            }}
            onSubmit={update}
            submitLabel="Save Changes"
          />
        </CardContent>
      </Card>
    </div>
  );
}
