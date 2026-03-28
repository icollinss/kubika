import { getDepartments } from "@/lib/actions/hr";
import { NewEmployeeForm } from "./new-employee-form";

export default async function NewEmployeePage() {
  const departments = await getDepartments();
  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold tracking-tight mb-6">New Employee</h1>
      <NewEmployeeForm departments={departments} />
    </div>
  );
}
