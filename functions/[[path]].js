export async function onRequest(context) {
  const url = new URL(context.request.url);
  const path = url.pathname.replace(/^\/+|\/+$/g, "");

  if (/^[A-Za-z0-9]{5}(?:[A-Za-z0-9]{2})?$/.test(path)) {
    const upstream = await fetch(
      "https://fbqzavqemtezakmmysak.supabase.co/functions/v1/shortener/" + path,
      { redirect: "manual" }
    );

    const location = upstream.headers.get("location");
    if (upstream.status >= 300 && upstream.status < 400 && location) {
      return Response.redirect(location, 302);
    }

    return new Response("Short link not found.", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" }
    });
  }

  return context.env.ASSETS.fetch(url.pathname === "/" ? new Request(url) : context.request);
}
