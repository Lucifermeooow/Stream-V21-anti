const GOOGLE_AUTH_URL =
  "https://accounts.google.com/o/oauth2/v2/auth";

const GOOGLE_TOKEN_URL =
  "https://oauth2.googleapis.com/token";

const GOOGLE_REDIRECT_URI =
  "https://stream-v21-anti.impossible7man.workers.dev/auth/youtube/callback";

const GOOGLE_SCOPE =
  "https://www.googleapis.com/auth/youtube";

function html(title, message) {
  return new Response(
    `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(title)}</title>
</head>
<body style="
  font-family:Arial,sans-serif;
  padding:40px;
  background:#111;
  color:#fff;
">
  <h2>${escapeHtml(title)}</h2>
  <p>${escapeHtml(message)}</p>
</body>
</html>`,
    {
      status: 200,
      headers: {
        "content-type": "text/html; charset=UTF-8",
      },
    }
  );
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // ---------------------------------------
    // HOME
    // ---------------------------------------
    if (url.pathname === "/") {
      return html(
        "stream-v21-anti",
        "OAuth backend is running."
      );
    }

    // ---------------------------------------
    // HEALTH
    // ---------------------------------------
    if (url.pathname === "/health") {
      return Response.json({
        ok: true,
        service: "stream-v21-anti",
        timestamp: new Date().toISOString(),
      });
    }

    // ---------------------------------------
    // CONFIG TEST
    // ---------------------------------------
    if (url.pathname === "/config-test") {
      return Response.json({
        ok: true,
        googleClientConfigured:
          Boolean(env.GOOGLE_CLIENT_ID),

        googleSecretConfigured:
          Boolean(env.GOOGLE_CLIENT_SECRET),

        kvConfigured:
          Boolean(env.OAUTH_KV),
      });
    }

    // ---------------------------------------
    // KV TEST
    // ---------------------------------------
    if (url.pathname === "/kv-test") {
      if (!env.OAUTH_KV) {
        return Response.json(
          {
            ok: false,
            kvConfigured: false,
            error: "OAUTH_KV binding is missing.",
          },
          {
            status: 500,
          }
        );
      }

      const testKey =
        "streamgit101_kv_test";

      const testValue = JSON.stringify({
        createdAt:
          new Date().toISOString(),

        service:
          "stream-v21-anti",
      });

      await env.OAUTH_KV.put(
        testKey,
        testValue
      );

      const storedValue =
        await env.OAUTH_KV.get(testKey);

      return Response.json({
        ok: true,
        kvConfigured: true,
        write: true,
        read: Boolean(storedValue),
        value:
          storedValue
            ? JSON.parse(storedValue)
            : null,
      });
    }

    // ---------------------------------------
    // START YOUTUBE OAUTH
    // ---------------------------------------
    if (
      url.pathname ===
      "/auth/youtube/start"
    ) {
      if (!env.GOOGLE_CLIENT_ID) {
        return html(
          "Configuration error",
          "GOOGLE_CLIENT_ID is missing."
        );
      }

      if (!env.OAUTH_KV) {
        return html(
          "Configuration error",
          "OAUTH_KV binding is missing."
        );
      }

      const state =
        crypto.randomUUID();

      // Store OAuth state temporarily.
      await env.OAUTH_KV.put(
        `oauth_state:${state}`,
        JSON.stringify({
          provider: "youtube",
          createdAt:
            new Date().toISOString(),
        }),
        {
          expirationTtl: 600,
        }
      );

      const authUrl =
        new URL(GOOGLE_AUTH_URL);

      authUrl.searchParams.set(
        "client_id",
        env.GOOGLE_CLIENT_ID
      );

      authUrl.searchParams.set(
        "redirect_uri",
        GOOGLE_REDIRECT_URI
      );

      authUrl.searchParams.set(
        "response_type",
        "code"
      );

      authUrl.searchParams.set(
        "scope",
        GOOGLE_SCOPE
      );

      authUrl.searchParams.set(
        "access_type",
        "offline"
      );

      authUrl.searchParams.set(
        "prompt",
        "consent"
      );

      authUrl.searchParams.set(
        "include_granted_scopes",
        "true"
      );

      authUrl.searchParams.set(
        "state",
        state
      );

      return Response.redirect(
        authUrl.toString(),
        302
      );
    }

    // ---------------------------------------
    // YOUTUBE OAUTH CALLBACK
    // ---------------------------------------
    if (
      url.pathname ===
      "/auth/youtube/callback"
    ) {
      const error =
        url.searchParams.get("error");

      const code =
        url.searchParams.get("code");

      const state =
        url.searchParams.get("state");

      if (error) {
        return html(
          "Google OAuth Error",
          `Google returned: ${error}`
        );
      }

      if (!code) {
        return html(
          "Google OAuth Error",
          "Authorization code is missing."
        );
      }

      if (!state) {
        return html(
          "Google OAuth Error",
          "OAuth state is missing."
        );
      }

      if (
        !env.GOOGLE_CLIENT_ID ||
        !env.GOOGLE_CLIENT_SECRET
      ) {
        return html(
          "Configuration error",
          "Google OAuth credentials are missing."
        );
      }

      if (!env.OAUTH_KV) {
        return html(
          "Configuration error",
          "OAUTH_KV binding is missing."
        );
      }

      // -------------------------------------
      // Validate OAuth state
      // -------------------------------------
      const stateKey =
        `oauth_state:${state}`;

      const stateData =
        await env.OAUTH_KV.get(stateKey);

      if (!stateData) {
        return html(
          "OAuth Error",
          "Invalid or expired OAuth state."
        );
      }

      // Delete state immediately.
      await env.OAUTH_KV.delete(
        stateKey
      );

      // -------------------------------------
      // Exchange authorization code
      // -------------------------------------
      const body =
        new URLSearchParams();

      body.set(
        "client_id",
        env.GOOGLE_CLIENT_ID
      );

      body.set(
        "client_secret",
        env.GOOGLE_CLIENT_SECRET
      );

      body.set(
        "code",
        code
      );

      body.set(
        "grant_type",
        "authorization_code"
      );

      body.set(
        "redirect_uri",
        GOOGLE_REDIRECT_URI
      );

      const tokenResponse =
        await fetch(
          GOOGLE_TOKEN_URL,
          {
            method: "POST",

            headers: {
              "content-type":
                "application/x-www-form-urlencoded",
            },

            body:
              body.toString(),
          }
        );

      const tokenData =
        await tokenResponse.json();

      if (!tokenResponse.ok) {
        return Response.json(
          {
            ok: false,
            provider: "youtube",
            error: tokenData,
          },
          {
            status: 400,
          }
        );
      }

      // -------------------------------------
      // Create a local account/session ID
      // -------------------------------------
      const accountId =
        crypto.randomUUID();

      const accountRecord = {
        provider: "youtube",

        createdAt:
          new Date().toISOString(),

        accessToken:
          tokenData.access_token ?? null,

        refreshToken:
          tokenData.refresh_token ?? null,

        expiresIn:
          tokenData.expires_in ?? null,

        tokenType:
          tokenData.token_type ?? null,
      };

      // -------------------------------------
      // Store tokens in KV
      // -------------------------------------
      await env.OAUTH_KV.put(
        `youtube_account:${accountId}`,
        JSON.stringify(accountRecord)
      );

      // -------------------------------------
      // Return safe response
      // -------------------------------------
      return Response.json({
        ok: true,
        provider: "youtube",

        message:
          "YouTube OAuth completed successfully.",

        accountId,

        accessTokenReceived:
          Boolean(
            tokenData.access_token
          ),

        refreshTokenReceived:
          Boolean(
            tokenData.refresh_token
          ),

        expiresIn:
          tokenData.expires_in ?? null,

        tokenType:
          tokenData.token_type ?? null,
      });
    }

    return new Response(
      "Not Found",
      {
        status: 404,
        headers: {
          "content-type":
            "text/plain; charset=UTF-8",
        },
      }
    );
  },
};
