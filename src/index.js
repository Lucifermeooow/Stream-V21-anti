export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Home
    if (url.pathname === "/") {
      return new Response(
        "stream-v21-anti OAuth Backend is running.",
        {
          status: 200,
          headers: {
            "content-type": "text/plain; charset=UTF-8",
          },
        }
      );
    }

    // Health
    if (url.pathname === "/health") {
      return Response.json({
        ok: true,
        service: "stream-v21-anti",
        timestamp: new Date().toISOString(),
      });
    }

    // Google configuration test
    if (url.pathname === "/config-test") {
      return Response.json({
        ok: true,
        googleClientConfigured: Boolean(env.GOOGLE_CLIENT_ID),
        googleSecretConfigured: Boolean(env.GOOGLE_CLIENT_SECRET),
      });
    }

    // KV test
    if (url.pathname === "/kv-test") {
      if (!env.OAUTH_KV) {
        return Response.json(
          {
            ok: false,
            kvConfigured: false,
            error: "OAUTH_KV binding is missing.",
          },
          { status: 500 }
        );
      }

      const testKey = "streamgit101_kv_test";

      const testValue = JSON.stringify({
        createdAt: new Date().toISOString(),
        service: "stream-v21-anti",
      });

      await env.OAUTH_KV.put(testKey, testValue);

      const storedValue = await env.OAUTH_KV.get(testKey);

      return Response.json({
        ok: true,
        kvConfigured: true,
        write: true,
        read: Boolean(storedValue),
        value: storedValue ? JSON.parse(storedValue) : null,
      });
    }

    return new Response("Not Found", {
      status: 404,
      headers: {
        "content-type": "text/plain; charset=UTF-8",
      },
    });
  },
};
