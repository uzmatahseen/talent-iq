import { chatClient } from "../lib/stream.js";

// default public Piston endpoint (whitelisted as of Feb 2026)
const DEFAULT_PISTON_API = "http://localhost:2000/api/v2/execute";

// allow overriding with environment variable for self‑hosted or whitelisted URL
const PISTON_API = process.env.PISTON_API_URL || DEFAULT_PISTON_API;

export async function getStreamToken(req, res) {
  try {
    // use clerkId for Stream (not mongodb _id)=> it should match the id we have in the stream dashboard
    const token = chatClient.createToken(req.user.clerkId);

    res.status(200).json({
      token,
      userId: req.user.clerkId,
      userName: req.user.name,
      userImage: req.user.image,
    });
  } catch (error) {
    console.log("Error in getStreamToken controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

const PISTON_RUNTIME_FALLBACKS = {
  javascript: ["18.17.0", "18.16.0", "18.15.0", "18.14.0", "18.13.0"],
  python: ["3.11.0", "3.10.0", "3.9.0"],
  java: ["17.0.8", "17.0.7", "17.0.6", "11.0.20"],
};

async function executePiston(language, version, code, headers) {
  const body = {
    language,
    files: [{ content: code }],
  };

  if (version) {
    body.version = version;
  }

  return await fetch(PISTON_API, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

export async function executeCode(req, res) {
  try {
    const { language, code, version } = req.body;

    if (!language || !language.trim() || !code || !code.trim()) {
      console.warn("executeCode received invalid payload", { language, code, version });
      return res.status(400).json({ 
        error: "Language and code are required and cannot be empty"
      });
    }

    // build headers and optionally include API key for private instances
    const headers = {
      "Content-Type": "application/json",
    };
    if (process.env.PISTON_API_KEY) {
      headers["Authorization"] = `Bearer ${process.env.PISTON_API_KEY}`;
    }

    const normalizedLang = language === "javascript" ? "javascript" : language;
    const preferredVersion = version && version.trim() ? version.trim() : undefined;

    let response = await executePiston(normalizedLang, preferredVersion, code, headers);

    // If runtime is unknown, try fallback versions (especially for Node versions)
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      const errorMessage = text || "";
      if (response.status === 400 && /runtime is unknown/.test(errorMessage)) {
        const fallbacks = PISTON_RUNTIME_FALLBACKS[normalizedLang];
        if (fallbacks && fallbacks.length) {
          for (const candidate of fallbacks) {
            if (candidate === preferredVersion) continue;

            const attempt = await executePiston(normalizedLang, candidate, code, headers);
            if (attempt.ok) {
              response = attempt;
              break;
            }
          }
        }

        // As final fallback, try with no explicit version (Piston defaults)
        if (!response.ok && preferredVersion) {
          const attempt = await executePiston(normalizedLang, undefined, code, headers);
          if (attempt.ok) {
            response = attempt;
          }
        }
      }

      if (!response.ok) {
        const errorBody = errorMessage || (await response.text().catch(() => ""));
        console.error(`Piston API error: ${response.status}`);
        console.error(`Response body: ${errorBody}`);
        if (response.status === 401) {
          console.error("Received 401 Unauthorized from Piston. The public API now requires a whitelist or a private host.");
          return res.status(502).json({
            error: "Code execution service unauthorized. Public Piston API requires whitelist or self-host your own instance. Set PISTON_API_URL to a valid endpoint.",
          });
        }
        console.error(`Request: POST ${PISTON_API}`);
        console.error(`Language: ${language}`);
        return res.status(response.status).json({
          error: `Code execution service unavailable (${response.status})`,
        });
      }
    }

    const data = await response.json();
    const output = data.run?.output || "";
    const stderr = data.run?.stderr || "";

    res.status(200).json({
      output: output,
      error: stderr || null,
      success: !stderr,
      piston: {
        language: data.language,
        version: data.version,
        run: data.run,
      },
    });
  } catch (error) {
    console.error("Error in executeCode controller:", error.message);
    console.error("Stack:", error.stack);
    res.status(500).json({ 
      error: `Failed to execute code: ${error.message}` 
    });
  }
}

function getFileExtension(language) {
  const extensions = {
    javascript: "js",
    python: "py",
    java: "java",
    cpp: "cpp",
    c: "c",
    go: "go",
  };
  return extensions[language] || "txt";
}
