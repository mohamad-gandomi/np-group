// Supabase Auth Send SMS Hook -> Kavenegar VerifyLookup.
// Configure this function as an HTTP Auth Hook and set the three secrets from .env.example.
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";

Deno.serve(async (request) => {
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });

  try {
    const body = await request.text();
    const webhook = new Webhook(Deno.env.get("SEND_SMS_HOOK_SECRET"));
    const payload = webhook.verify(body, Object.fromEntries(request.headers));
    const phone = payload.user?.phone;
    const otp = payload.sms?.otp;
    if (!phone || !otp) return Response.json({ error: { http_code: 400, message: "Invalid SMS hook payload" } }, { status: 400 });

    const apiKey = Deno.env.get("KAVENEGAR_API_KEY");
    const template = Deno.env.get("KAVENEGAR_OTP_TEMPLATE");
    if (!apiKey || !template) throw new Error("Kavenegar is not configured");
    const receptor = phone.replace(/^\+98/, "0");
    const url = `https://api.kavenegar.com/v1/${apiKey}/verify/lookup.json`;
    const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ receptor, token: otp, template }) });
    if (!response.ok) throw new Error("Kavenegar rejected the message");
    return new Response(null, { status: 200 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: { http_code: 500, message: "SMS delivery failed" } }, { status: 500 });
  }
});
