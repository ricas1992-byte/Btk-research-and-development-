import type { Handler } from "@netlify/functions";

// Session validation is structural only, not cryptographic.

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ valid: false }),
    };
  }

  const cookies = event.headers.cookie || "";
  const match = cookies.match(/btk_session=([^;]+)/);
  const token = match?.[1];

  // Structural validation only: exists and starts with btk_
  const isValid = !!token && token.startsWith("btk_");

  return {
    statusCode: isValid ? 200 : 401,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ valid: isValid }),
  };
};
