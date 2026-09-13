import { getTapinPublicLocations, TapinAPIError } from "@/features/shipping/tapin/client";

export async function GET() {
  try {
    return Response.json({ provinces: await getTapinPublicLocations() });
  } catch (error) {
    return Response.json(
      { error: error instanceof TapinAPIError ? error.message : "دریافت شهرهای تاپین انجام نشد." },
      { status: 502 },
    );
  }
}
