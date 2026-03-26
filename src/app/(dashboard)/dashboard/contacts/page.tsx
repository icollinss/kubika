import Link from "next/link";
import { getContacts } from "@/lib/actions/contacts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Users } from "lucide-react";
import { ContactsFilter } from "./contacts-filter";

const typeBadge: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  CUSTOMER: { label: "Customer", variant: "default" },
  SUPPLIER: { label: "Supplier", variant: "secondary" },
  BOTH: { label: "Both", variant: "outline" },
};

interface Props {
  searchParams: Promise<{ search?: string; type?: string }>;
}

export default async function ContactsPage({ searchParams }: Props) {
  const { search, type } = await searchParams;
  const contacts = await getContacts(search, type);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Contacts</h2>
          <p className="text-muted-foreground text-sm mt-1">
            {contacts.length} contact{contacts.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/contacts/new">
            <Plus className="h-4 w-4 mr-2" />
            New Contact
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <ContactsFilter />

      {/* Table */}
      {contacts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Users className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="font-medium">No contacts yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Add your first customer or supplier to get started.
          </p>
        </div>
      ) : (
        <div className="rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>City</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.map((contact) => {
                const badge = typeBadge[contact.type];
                return (
                  <TableRow key={contact.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell>
                      <Link
                        href={`/dashboard/contacts/${contact.id}`}
                        className="font-medium hover:underline"
                      >
                        {contact.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {contact.email ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {contact.phone ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {contact.city ?? "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
