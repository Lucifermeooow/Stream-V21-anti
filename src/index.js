export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/") {
      return new Response(
        "stream-v21-anti OAuth Backend is running.",
        {
          status: 200,
          headers: {
            "content-type": "text/plain; charset=UTF-8"
          }
        }
      );
    }

    if (url.pathname === "/health") {
      return Response.json({
        ok: true,
        service: "stream-v21-anti",
        timestamp: new Date().toISOString()
      });
    }

    return new Response("Not Found", {
      status: 404,
      headers: {
        "content-type": "text/plain; charset=UTF-8"
      }
    });
  }
};
