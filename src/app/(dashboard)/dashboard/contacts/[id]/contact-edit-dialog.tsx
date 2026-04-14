"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Pencil, Trash2, Loader2 } from "lucide-react";
import type { ContactFormData } from "@/lib/actions/contacts";

type Contact = {
  id: string; name: string; email: string | null; phone: string | null;
  whatsapp: string | null; address: string | null; city: string | null;
  country: string; taxId: string | null; notes: string | null;
  type: "CUSTOMER" | "SUPPLIER" | "BOTH";
};

interface Props {
  contact: Contact;
  onUpdate: (data: ContactFormData) => Promise<void>;
  onDelete: () => Promise<void>;
}

export function ContactEditDialog({ contact, onUpdate, onDelete }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({
    name: contact.name, email: contact.email ?? "", phone: contact.phone ?? "",
    address: contact.address ?? "", city: contact.city ?? "",
    country: contact.country, taxId: contact.taxId ?? "",
    notes: contact.notes ?? "", type: contact.type,
  });

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onUpdate({ ...form, email: form.email || undefined, phone: form.phone || undefined, address: form.address || undefined, city: form.city || undefined, taxId: form.taxId || undefined, notes: form.notes || undefined });
      setOpen(false);
      router.refresh();
    } finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!confirm("Eliminar este contacto? Esta acção não pode ser desfeita.")) return;
    setDeleting(true);
    try {
      await onDelete();
      router.push("/dashboard/contacts");
    } finally { setDeleting(false); }
  }

  return (
    <div className="flex gap-2">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="flex-1">
            <Pencil className="h-3.5 w-3.5 mr-2" />Editar
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Editar Contacto</DialogTitle></DialogHeader>
          <form onSubmit={handleSave} className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label>Nome *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="space-y-1.5">
                <Label>E-mail</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Telefone</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Morada</Label>
                <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Cidade</Label>
                <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>País</Label>
                <Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>NIF</Label>
                <Input value={form.taxId} onChange={(e) => setForm({ ...form, taxId: e.target.value })} />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Tipo</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as "CUSTOMER" | "SUPPLIER" | "BOTH" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CUSTOMER">Cliente</SelectItem>
                    <SelectItem value="SUPPLIER">Fornecedor</SelectItem>
                    <SelectItem value="BOTH">Ambos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Notas</Label>
                <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Guardar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleting}>
        {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
      </Button>
    </div>
  );
}
