import type { Handler } from "@netlify/functions";

// Hardcoded credentials — single user only
const VALID_USERNAME = "researcher";
const VALID_PASSWORD = "btk2025!";

function generateToken(): string {
  return `btk_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success: false, error: "Method not allowed" }),
    };
  }

  let body: { username?: string; password?: string };
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success: false, error: "Invalid request" }),
    };
  }

  const { username, password } = body;

  // Exact match only
  if (username === VALID_USERNAME && password === VALID_PASSWORD) {
    const token = generateToken();

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": `btk_session=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400`,
      },
      body: JSON.stringify({ success: true }),
    };
  }

  // Generic error — no hints
  return {
    statusCode: 401,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ success: false, error: "Invalid credentials" }),
  };
};
