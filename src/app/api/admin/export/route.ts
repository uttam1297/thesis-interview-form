import { NextResponse } from "next/server";

import { getResearcher } from "@/features/admin/auth";
import { buildExport, type ExportFormat } from "@/features/admin/export";

const FORMATS: ExportFormat[] = ["csv", "json", "long"];

export async function GET(request: Request) {
  // Re-checked here: the proxy redirect is not an authorisation boundary.
  const researcher = await getResearcher();
  if (!researcher) {
    return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  }

  const format = new URL(request.url).searchParams.get("format") ?? "csv";
  if (!FORMATS.includes(format as ExportFormat)) {
    return NextResponse.json({ error: "unsupported_format" }, { status: 400 });
  }

  try {
    const { body, contentType, filename } = await buildExport(
      format as ExportFormat
    );
    return new NextResponse(body, {
      headers: {
        "content-type": contentType,
        "content-disposition": `attachment; filename="${filename}"`,
        "cache-control": "no-store",
      },
    });
  } catch {
    console.error("[admin/export] export failed");
    return NextResponse.json({ error: "export_failed" }, { status: 500 });
  }
}
