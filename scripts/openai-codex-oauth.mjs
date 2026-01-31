import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { writeOAuthCredentials } from "/usr/lib/node_modules/clawdbot/dist/commands/onboard-auth.credentials.js";
import { applyAuthProfileConfig } from "/usr/lib/node_modules/clawdbot/dist/commands/onboard-auth.config-core.js";
import { fileURLToPath } from "node:url";

const CLIENT_ID = "app_EMoamEEZ73f0CkXaXp7hrann";
const AUTHORIZE_URL = "https://auth.openai.com/oauth/authorize";
const TOKEN_URL = "https://auth.openai.com/oauth/token";
const REDIRECT_URI = "http://localhost:1455/auth/callback";
const STATE_FILE = path.resolve(
  "/root/clawd",
  ".openai-codex-pending.json"
);
const CONFIG_PATH = "/root/.clawdbot/clawdbot.json";

function base64url(buffer) {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function generateVerifier() {
  return base64url(crypto.randomBytes(32));
}

function generateChallenge(verifier) {
  const digest = crypto.createHash("sha256").update(verifier).digest();
  return base64url(digest);
}

function generateState() {
  return crypto.randomBytes(16).toString("hex");
}

async function savePending({ verifier, state }) {
  await fs.writeFile(
    STATE_FILE,
    JSON.stringify({ verifier, state, createdAt: Date.now() }, null, 2),
    "utf8"
  );
}

async function loadPending() {
  const text = await fs.readFile(STATE_FILE, "utf8");
  return JSON.parse(text);
}

async function removePending() {
  await fs.rm(STATE_FILE, { force: true });
}

function buildAuthorizeUrl({ challenge, state }) {
  const url = new URL(AUTHORIZE_URL);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", CLIENT_ID);
  url.searchParams.set("redirect_uri", REDIRECT_URI);
  url.searchParams.set("scope", "openid profile email offline_access");
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("state", state);
  url.searchParams.set("id_token_add_organizations", "true");
  url.searchParams.set("codex_cli_simplified_flow", "true");
  url.searchParams.set("originator", "pi");
  return url.toString();
}

function parseRedirectUrl(raw) {
  try {
    const url = new URL(raw);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    if (!code) {
      throw new Error("authorization code is missing from the redirect URL");
    }
    return { code, state };
  }
  catch (err) {
    throw new Error(`Failed to parse redirect URL: ${err.message}`);
  }
}

function decodeAccountId(accessToken) {
  const parts = accessToken.split(".");
  if (parts.length < 2) {
    return null;
  }
  try {
    const payload = Buffer.from(parts[1], "base64url").toString("utf8");
    const json = JSON.parse(payload);
    const auth = json["https://api.openai.com/auth"];
    const id = auth?.chatgpt_account_id;
    return typeof id === "string" && id.length > 0 ? id : null;
  }
  catch (_) {
    return null;
  }
}

async function exchangeCode(code, verifier) {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: CLIENT_ID,
    code,
    code_verifier: verifier,
    redirect_uri: REDIRECT_URI,
  });
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Token exchange failed (${response.status}): ${text}`);
  }
  const data = await response.json();
  if (!data.access_token || !data.refresh_token || typeof data.expires_in !== "number") {
    throw new Error(`Unexpected token response: ${JSON.stringify(data)}`);
  }
  return {
    access: data.access_token,
    refresh: data.refresh_token,
    expires: Date.now() + data.expires_in * 1000,
  };
}

async function updateConfig() {
  const text = await fs.readFile(CONFIG_PATH, "utf8");
  const config = JSON.parse(text);
  const patched = applyAuthProfileConfig(config, {
    profileId: "openai-codex:default",
    provider: "openai-codex",
    mode: "oauth",
  });
  if (JSON.stringify(patched, null, 2) === JSON.stringify(config, null, 2)) {
    return;
  }
  await fs.writeFile(CONFIG_PATH, JSON.stringify(patched, null, 2) + "\n", "utf8");
}

async function run() {
  const [, , action, value] = process.argv;
  if (!action || action === "link" || action === "--link") {
    const verifier = generateVerifier();
    const challenge = generateChallenge(verifier);
    const state = generateState();
    await savePending({ verifier, state });
    const url = buildAuthorizeUrl({ challenge, state });
    console.log("Open this URL in your browser and complete the OpenAI Codex sign-in:");
    console.log(url);
    console.log("After you sign in, copy the full redirect URL (http://localhost:1455/auth/callback?...) and run the script again like this:");
    console.log("  node scripts/openai-codex-oauth.mjs redeem <redirect-url>");
    return;
  }
  if (action === "redeem") {
    if (!value) {
      throw new Error("Please provide the redirect URL after --redeem");
    }
    const pending = await loadPending();
    const { code, state } = parseRedirectUrl(value);
    if (pending.state !== state) {
      throw new Error("OAuth state mismatch");
    }
    const token = await exchangeCode(code, pending.verifier);
    const accountId = decodeAccountId(token.access);
    const creds = {
      access: token.access,
      refresh: token.refresh,
      expires: token.expires,
      ...(accountId ? { accountId } : {}),
    };
    await writeOAuthCredentials("openai-codex", creds, undefined);
    await updateConfig();
    await removePending();
    console.log("OpenAI Codex OAuth complete. Credential stored under openai-codex:default.");
    return;
  }
  throw new Error(`Unknown action: ${action}`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
