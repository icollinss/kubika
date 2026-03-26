import Link from "next/link";
import { createContact } from "@/lib/actions/contacts";
import { ContactForm } from "@/components/contacts/contact-form";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewContactPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/contacts">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Link>
        </Button>
        <h2 className="text-2xl font-bold tracking-tight">New Contact</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Contact Details</CardTitle>
        </CardHeader>
        <CardContent>
          <ContactForm onSubmit={createContact} submitLabel="Create Contact" />
        </CardContent>
      </Card>
    </div>
  );
}
