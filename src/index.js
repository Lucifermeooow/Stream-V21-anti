const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

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
  <title>${title}</title>
</head>
<body style="font-family:Arial,sans-serif;padding:40px">
  <h2>${title}</h2>
  <p>${message}</p>
</body>
</html>`,
    {
      headers: {
        "content-type": "text/html; charset=UTF-8",
      },
    }
  );
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // ------------------------------------------
    // Health check
    // ------------------------------------------
    if (url.pathname === "/health") {
      return Response.json({
        ok: true,
        service: "stream-v21-anti",
        timestamp: new Date().toISOString(),
      });
    }

    // ------------------------------------------
    // Configuration check
    // ------------------------------------------
    if (url.pathname === "/config-test") {
      return Response.json({
        ok: true,
        googleClientConfigured: Boolean(env.GOOGLE_CLIENT_ID),
        googleSecretConfigured: Boolean(env.GOOGLE_CLIENT_SECRET),
      });
    }

    // ------------------------------------------
    // Home
    // ------------------------------------------
    if (url.pathname === "/") {
      return html(
        "stream-v21-anti",
        "OAuth backend is running."
      );
    }

    // ------------------------------------------
    // Start Google OAuth
    // ------------------------------------------
    if (url.pathname === "/auth/youtube/start") {
      if (!env.GOOGLE_CLIENT_ID) {
        return html(
          "Configuration error",
          "GOOGLE_CLIENT_ID is missing."
        );
      }

      // Random state for CSRF protection.
      const state = crypto.randomUUID();

      const authUrl = new URL(GOOGLE_AUTH_URL);

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

    // ------------------------------------------
    // Google OAuth callback
    // ------------------------------------------
    if (url.pathname === "/auth/youtube/callback") {
      const error = url.searchParams.get("error");
      const code = url.searchParams.get("code");

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

      if (!env.GOOGLE_CLIENT_ID) {
        return html(
          "Configuration error",
          "GOOGLE_CLIENT_ID is missing."
        );
      }

      if (!env.GOOGLE_CLIENT_SECRET) {
        return html(
          "Configuration error",
          "GOOGLE_CLIENT_SECRET is missing."
        );
      }

      const body = new URLSearchParams();

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

      const tokenResponse = await fetch(
        GOOGLE_TOKEN_URL,
        {
          method: "POST",
          headers: {
            "content-type":
              "application/x-www-form-urlencoded",
          },
          body: body.toString(),
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

      // IMPORTANT:
      // For this first test we do not display
      // or return the actual access/refresh tokens.
      return Response.json({
        ok: true,
        provider: "youtube",
        message: "YouTube OAuth completed successfully.",
        accessTokenReceived:
          Boolean(tokenData.access_token),
        refreshTokenReceived:
          Boolean(tokenData.refresh_token),
        expiresIn:
          tokenData.expires_in ?? null,
        tokenType:
          tokenData.token_type ?? null,
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
