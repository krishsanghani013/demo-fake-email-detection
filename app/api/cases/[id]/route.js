import { NextResponse } from "next/server";
import {
  getCaseById,
  deleteCase,
  updateCaseStatus,
  addAnalystNote,
} from "@/lib/caseRepository";
import { isDatabaseConfigured } from "@/lib/prisma";

/**
 * GET /api/cases/[id]
 * Retrieves complete case details with email, artifacts, evidence, timeline, notes.
 */
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Case ID is required." },
        { status: 400 }
      );
    }

    if (!isDatabaseConfigured()) {
      return NextResponse.json(
        { success: false, fallbackRequired: true, error: "Database not configured." },
        { status: 503 }
      );
    }

    const caseData = await getCaseById(id);

    if (!caseData) {
      return NextResponse.json(
        { success: false, error: "Case not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: caseData,
    });
  } catch (error) {
    console.error(`GET /api/cases/[id] error:`, error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve case." },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/cases/[id]
 * Body: { status?: string, note?: string }
 */
export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    if (!isDatabaseConfigured()) {
      return NextResponse.json(
        { success: false, error: "Database not configured." },
        { status: 503 }
      );
    }

    const body = await request.json();
    let updated = null;

    if (body.status) {
      updated = await updateCaseStatus(id, body.status);
    }

    if (body.note) {
      await addAnalystNote(id, body.note);
    }

    const fullCase = await getCaseById(id);

    return NextResponse.json({
      success: true,
      data: fullCase,
    });
  } catch (error) {
    console.error(`PATCH /api/cases/[id] error:`, error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update case." },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/cases/[id]
 */
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    if (!isDatabaseConfigured()) {
      return NextResponse.json(
        { success: false, error: "Database not configured." },
        { status: 503 }
      );
    }

    const deleted = await deleteCase(id);

    return NextResponse.json({
      success: deleted,
      message: deleted ? "Case deleted successfully." : "Case not found.",
    });
  } catch (error) {
    console.error(`DELETE /api/cases/[id] error:`, error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete case." },
      { status: 500 }
    );
  }
}
