// Piston API is a service for code execution

const BACKEND_API = "http://localhost:3000/api/chat";

const LANGUAGE_VERSIONS = {
  javascript: { language: "javascript" },
  python: { language: "python", version: "3.10.0" },
  java: { language: "java" },
};

/**
 * @param {string} language - programming language
 * @param {string} code - source code to executed
 * @returns {Promise<{success:boolean, output?:string, error?: string}>}
 */
export async function executeCode(language, code) {
  try {
    const languageConfig = LANGUAGE_VERSIONS[language];

    if (!languageConfig) {
      return {
        success: false,
        error: `Unsupported language: ${language}`,
      };
    }

    const bodyPayload = {
      language: languageConfig.language,
      code: code,
    };
    if (languageConfig.version) {
      bodyPayload.version = languageConfig.version;
    }

    const response = await fetch(`${BACKEND_API}/execute`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(bodyPayload),
    });

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP error! status: ${response.status}`,
      };
    }

    const data = await response.json();

    const output = data.output || "";
    const error = data.error || "";

    if (error) {
      return {
        success: false,
        output: output,
        error: error,
      };
    }

    return {
      success: true,
      output: output || "No output",
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to execute code: ${error.message}`,
    };
  }
}

function getFileExtension(language) {
  const extensions = {
    javascript: "js",
    python: "py",
    java: "java",
  };

  return extensions[language] || "txt";
}
