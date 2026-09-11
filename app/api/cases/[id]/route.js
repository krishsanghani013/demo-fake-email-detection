import { NextResponse } from "next/server";
import {
  getCaseById,
  deleteCase,
  updateCaseStatus,
  addAnalystNote,
} from "@/lib/caseRepository";
import { isDatabaseConfigured } from "@/lib/prisma";
import { requireAuthenticatedUser } from "@/lib/authenticatedUser";

/**
 * GET /api/cases/[id]
 * Retrieves complete case details only if the case belongs to the authenticated Clerk user.
 * Returns 404 without leaking metadata if the case does not exist or belongs to another user.
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

    const { user, unauthorizedResponse } = await requireAuthenticatedUser();
    if (unauthorizedResponse) {
      return unauthorizedResponse;
    }

    // Scoped strictly to the authenticated user's ID
    const caseData = await getCaseById(id, user.id);

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
 * Updates case status or adds analyst notes only if the case belongs to the authenticated user.
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

    const { user, unauthorizedResponse } = await requireAuthenticatedUser();
    if (unauthorizedResponse) {
      return unauthorizedResponse;
    }

    // Verify case ownership before modifying
    const existingCase = await getCaseById(id, user.id);
    if (!existingCase) {
      return NextResponse.json(
        { success: false, error: "Case not found." },
        { status: 404 }
      );
    }

    const body = await request.json();

    if (body.status) {
      await updateCaseStatus(id, body.status, user.id);
    }

    if (body.note) {
      await addAnalystNote(id, body.note, user.id);
    }

    const fullCase = await getCaseById(id, user.id);

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
 * Deletes a case only if it belongs to the authenticated user.
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

    const { user, unauthorizedResponse } = await requireAuthenticatedUser();
    if (unauthorizedResponse) {
      return unauthorizedResponse;
    }

    const deleted = await deleteCase(id, user.id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Case not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Case deleted successfully.",
    });
  } catch (error) {
    console.error(`DELETE /api/cases/[id] error:`, error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete case." },
      { status: 500 }
    );
  }
}

