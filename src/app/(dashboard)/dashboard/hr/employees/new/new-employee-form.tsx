"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createEmployee } from "@/lib/actions/hr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface Department { id: string; name: string }

export function NewEmployeeForm({ departments }: { departments: Department[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [deptId, setDeptId] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    await createEmployee({
      firstName: fd.get("firstName") as string,
      lastName: fd.get("lastName") as string,
      email: fd.get("email") as string || undefined,
      phone: fd.get("phone") as string || undefined,
      nif: fd.get("nif") as string || undefined,
      inssNumber: fd.get("inssNumber") as string || undefined,
      dateOfBirth: fd.get("dateOfBirth") as string || undefined,
      hireDate: fd.get("hireDate") as string,
      jobTitle: fd.get("jobTitle") as string || undefined,
      departmentId: deptId || undefined,
    });
    setLoading(false);
    router.push("/dashboard/hr/employees");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>First Name *</Label>
          <Input name="firstName" required />
        </div>
        <div className="space-y-2">
          <Label>Last Name *</Label>
          <Input name="lastName" required />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Email</Label>
          <Input name="email" type="email" />
        </div>
        <div className="space-y-2">
          <Label>Phone</Label>
          <Input name="phone" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>NIF (Tax ID)</Label>
          <Input name="nif" />
        </div>
        <div className="space-y-2">
          <Label>INSS Number</Label>
          <Input name="inssNumber" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Date of Birth</Label>
          <Input name="dateOfBirth" type="date" />
        </div>
        <div className="space-y-2">
          <Label>Hire Date *</Label>
          <Input name="hireDate" type="date" defaultValue={new Date().toISOString().split("T")[0]} required />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Job Title</Label>
          <Input name="jobTitle" placeholder="e.g. Sales Manager" />
        </div>
        <div className="space-y-2">
          <Label>Department</Label>
          <Select value={deptId || "__none__"} onValueChange={(v) => setDeptId(v === "__none__" ? "" : v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">— None —</SelectItem>
              {departments.map((d) => (
                <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="pt-2">
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Employee
        </Button>
      </div>
    </form>
  );
}
