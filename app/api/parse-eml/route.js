import { NextResponse } from "next/server";
import { parseEmail, MAX_EML_FILE_SIZE } from "@/lib/emailParser";

/**
 * Server-side endpoint for parsing .eml files.
 *
 * Receives raw .eml content, validates size, extracts metadata/headers/URLs/attachments,
 * and returns structured data to the frontend preview without triggering any AI request.
 *
 * @param {Request} request
 * @returns {Promise<NextResponse>}
 */
export async function POST(request) {
  try {
    const contentType = request.headers.get("content-type") || "";
    let emlContent = "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file");

      if (!file || typeof file === "string") {
        return NextResponse.json(
          { success: false, error: "No .eml file was provided in the upload request." },
          { status: 400 }
        );
      }

      if (!file.name.toLowerCase().endsWith(".eml")) {
        return NextResponse.json(
          { success: false, error: "Invalid file type. Only .eml files are supported." },
          { status: 400 }
        );
      }

      if (file.size > MAX_EML_FILE_SIZE) {
        return NextResponse.json(
          {
            success: false,
            error: `File size exceeds the 5 MB limit (${(file.size / (1024 * 1024)).toFixed(1)} MB).`,
          },
          { status: 400 }
        );
      }

      const buffer = await file.arrayBuffer();
      emlContent = Buffer.from(buffer);
    } else {
      const body = await request.json();
      emlContent = body?.emlContent || "";

      if (!emlContent || typeof emlContent !== "string") {
        return NextResponse.json(
          { success: false, error: "Invalid request: emlContent must be a non-empty string." },
          { status: 400 }
        );
      }

      if (Buffer.byteLength(emlContent, "utf8") > MAX_EML_FILE_SIZE) {
        return NextResponse.json(
          { success: false, error: "File content exceeds the 5 MB limit." },
          { status: 400 }
        );
      }
    }

    // Parse email with mailparser utility
    const parsedData = await parseEmail(emlContent);

    return NextResponse.json({
      success: true,
      data: parsedData,
    });
  } catch (error) {
    console.error("EML Parsing Server Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to parse the uploaded .eml file.",
      },
      { status: 500 }
    );
  }
}
