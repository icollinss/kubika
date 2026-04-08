import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Facebook sends a GET request to verify the webhook
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

// Facebook sends a POST request with lead data
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as FacebookWebhookPayload;

    // Only process leadgen events
    if (body.object !== "page") {
      return NextResponse.json({ status: "ignored" });
    }

    for (const entry of body.entry ?? []) {
      for (const change of entry.changes ?? []) {
        if (change.field !== "leadgen") continue;

        const leadData = change.value;
        if (!leadData?.leadgen_id) continue;

        // Fetch full lead data from Facebook Graph API
        const fbLead = await fetchFacebookLead(leadData.leadgen_id);
        if (!fbLead) continue;

        // Find the first company (for single-tenant setups)
        // In multi-tenant, match by page_id stored on company config
        const company = await prisma.company.findFirst();
        if (!company) continue;

        const fields: Record<string, string> = {};
        for (const f of fbLead.field_data ?? []) {
          fields[f.name] = f.values?.[0] ?? "";
        }

        await prisma.lead.create({
          data: {
            name: fields["full_name"] || fields["first_name"]
              ? `${fields["first_name"] ?? ""} ${fields["last_name"] ?? ""}`.trim()
              : "Facebook Lead",
            email: fields["email"] || undefined,
            phone: fields["phone_number"] || undefined,
            company: fields["company_name"] || undefined,
            jobTitle: fields["job_title"] || undefined,
            source: leadData.ad_id ? "FACEBOOK" : "INSTAGRAM",
            status: "NEW",
            notes: `Facebook Lead Ad ID: ${leadData.leadgen_id}\nForm ID: ${leadData.form_id ?? ""}`,
            companyId: company.id,
          },
        });
      }
    }

    return NextResponse.json({ status: "ok" });
  } catch (err) {
    console.error("Facebook webhook error:", err);
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}

async function fetchFacebookLead(leadgenId: string) {
  const token = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  if (!token) return null;

  try {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${leadgenId}?fields=field_data,created_time,form_id&access_token=${token}`
    );
    if (!res.ok) return null;
    return await res.json() as { field_data?: { name: string; values?: string[] }[]; form_id?: string };
  } catch {
    return null;
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface FacebookWebhookPayload {
  object: string;
  entry?: {
    id: string;
    changes?: {
      field: string;
      value: {
        leadgen_id?: string;
        form_id?: string;
        ad_id?: string;
        page_id?: string;
      };
    }[];
  }[];
}
