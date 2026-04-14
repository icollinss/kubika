"use client";

import { useState } from "react";
import { createAnalyticAccount, updateAnalyticAccount, toggleAnalyticAccount } from "@/lib/actions/projects";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, PowerOff, Power, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

type AnalyticAccount = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
};

interface Props {
  accounts: AnalyticAccount[];
}

const emptyForm = { code: "", name: "", description: "" };

export function AnalyticAccountsClient({ accounts }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AnalyticAccount | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(acc: AnalyticAccount) {
    setEditing(acc);
    setForm({ code: acc.code, name: acc.name, description: acc.description ?? "" });
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const data = { code: form.code.trim(), name: form.name.trim(), description: form.description.trim() || undefined };
      if (editing) {
        await updateAnalyticAccount(editing.id, data);
      } else {
        await createAnalyticAccount(data);
      }
      setOpen(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(acc: AnalyticAccount) {
    setTogglingId(acc.id);
    try {
      await toggleAnalyticAccount(acc.id);
      router.refresh();
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Analytic Accounts</h2>
          <p className="text-sm text-muted-foreground">
            Tag order and invoice lines to track profitability by project, department, or cost centre
          </p>
        </div>
        <Button onClick={openCreate} size="sm">
          <Plus className="h-4 w-4 mr-2" />New Account
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {accounts.length === 0 ? (
            <div className="text-center py-14 space-y-3">
              <p className="text-muted-foreground text-sm">No analytic accounts yet.</p>
              <Button variant="outline" size="sm" onClick={openCreate}>
                <Plus className="h-4 w-4 mr-2" />Create your first account
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.map((acc) => (
                  <TableRow key={acc.id} className={!acc.isActive ? "opacity-50" : undefined}>
                    <TableCell className="font-mono font-semibold">{acc.code}</TableCell>
                    <TableCell className="font-medium">{acc.name}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{acc.description ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={acc.isActive ? "default" : "outline"}>
                        {acc.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 justify-end">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(acc)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground"
                          onClick={() => handleToggle(acc)}
                          disabled={togglingId === acc.id}
                        >
                          {togglingId === acc.id
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : acc.isActive
                              ? <PowerOff className="h-3.5 w-3.5" />
                              : <Power className="h-3.5 w-3.5" />
                          }
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Analytic Account" : "New Analytic Account"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Code <span className="text-destructive">*</span></Label>
                <Input
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  placeholder="e.g. CC-001"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Name <span className="text-destructive">*</span></Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Marketing"
                  required
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Optional description"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editing ? "Save Changes" : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
