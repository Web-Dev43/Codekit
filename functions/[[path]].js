export async function onRequest(context) {
  const url = new URL(context.request.url);
  const path = url.pathname.replace(/^\/+|\/+$/g, "");

  // Only short-link slugs are sent to the redirect service.
  if (/^[A-Za-z0-9][A-Za-z0-9-]{1,38}[A-Za-z0-9]$/.test(path) && path.length >= 3 && path.length <= 40) {
    try {
      const upstream = await fetch(
        "https://fbqzavqemtezakmmysak.supabase.co/functions/v1/shortener/" + encodeURIComponent(path),
        { redirect: "manual", headers: { "Accept": "text/plain" } }
      );

      // Pass the original redirect response through unchanged so Safari receives
      // the exact Location header returned by the shortener service.
      if (upstream.status >= 300 && upstream.status < 400 && upstream.headers.get("location")) {
        return new Response(null, {
          status: upstream.status,
          headers: {
            "Location": upstream.headers.get("location"),
            "Cache-Control": "no-store",
            "Referrer-Policy": "no-referrer"
          }
        });
      }

      if (upstream.status === 404) {
        return new Response("Short link not found.", {
          status: 404,
          headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" }
        });
      }

      return new Response("The redirect service could not resolve this link.", {
        status: 502,
        headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" }
      });
    } catch {
      return new Response("The redirect service is temporarily unavailable.", {
        status: 502,
        headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" }
      });
    }
  }

  return context.env.ASSETS.fetch(url.pathname === "/" ? new Request(url) : context.request);
}
