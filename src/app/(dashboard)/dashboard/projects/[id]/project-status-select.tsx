"use client";

import { useState } from "react";
import { updateProject } from "@/lib/actions/projects";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "next/navigation";

const statusColor: Record<string, string> = {
  DRAFT: "text-gray-600",
  IN_PROGRESS: "text-blue-700",
  ON_HOLD: "text-yellow-700",
  COMPLETED: "text-green-700",
  CANCELLED: "text-red-700",
};

export function ProjectStatusSelect({ projectId, currentStatus }: { projectId: string; currentStatus: string }) {
  const [status, setStatus] = useState(currentStatus);
  const router = useRouter();

  async function handleChange(val: string) {
    setStatus(val);
    await updateProject(projectId, { status: val as "DRAFT" | "IN_PROGRESS" | "ON_HOLD" | "COMPLETED" | "CANCELLED" });
    router.refresh();
  }

  return (
    <Select value={status} onValueChange={handleChange}>
      <SelectTrigger className={`w-40 font-medium ${statusColor[status]}`}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {["DRAFT", "IN_PROGRESS", "ON_HOLD", "COMPLETED", "CANCELLED"].map((s) => (
          <SelectItem key={s} value={s} className={statusColor[s]}>
            {s.replace("_", " ")}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
