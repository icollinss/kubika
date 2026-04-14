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
  CUSTOMER: { label: "Cliente", variant: "default" },
  SUPPLIER: { label: "Fornecedor", variant: "secondary" },
  BOTH: { label: "Ambos", variant: "outline" },
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
          <h2 className="text-2xl font-bold tracking-tight">Contactos</h2>
          <p className="text-muted-foreground text-sm mt-1">
            {contacts.length} contacto{contacts.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/contacts/new">
            <Plus className="h-4 w-4 mr-2" />
            Novo Contacto
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <ContactsFilter />

      {/* Table */}
      {contacts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Users className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="font-medium">Sem contactos ainda</p>
          <p className="text-sm text-muted-foreground mt-1">
            Adicione o seu primeiro cliente ou fornecedor.
          </p>
        </div>
      ) : (
        <div className="rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Cidade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.map((contact) => {
                const badge = typeBadge[contact.type];
                return (
                  <TableRow key={contact.id} className="cursor-pointer">
                    <TableCell className="font-medium p-0">
                      <Link
                        href={`/dashboard/contacts/${contact.id}`}
                        className="flex items-center px-4 py-3 w-full h-full hover:underline"
                      >
                        {contact.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link href={`/dashboard/contacts/${contact.id}`} className="block w-full h-full py-1">
                        <Badge variant={badge.variant}>{badge.label}</Badge>
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground p-0">
                      <Link href={`/dashboard/contacts/${contact.id}`} className="flex items-center px-4 py-3 w-full h-full">
                        {contact.email ?? "—"}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground p-0">
                      <Link href={`/dashboard/contacts/${contact.id}`} className="flex items-center px-4 py-3 w-full h-full">
                        {contact.phone ?? "—"}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground p-0">
                      <Link href={`/dashboard/contacts/${contact.id}`} className="flex items-center px-4 py-3 w-full h-full">
                        {contact.city ?? "—"}
                      </Link>
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
