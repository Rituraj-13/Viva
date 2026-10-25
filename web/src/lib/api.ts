import "server-only";
import { NextResponse } from "next/server";
import type { z } from "zod";
import { getAnonId } from "./anon";
import { GithubError } from "./github";
import { getSession } from "./store";
import type { SessionData } from "./types";

export class ApiError extends Error {
  status: number;
  code: string;
  action?: string;

  constructor(status: number, code: string, message: string, action?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.action = action;
  }
}

export function errorResponse(
  status: number,
  code: string,
  message: string,
  action?: string,
) {
  return NextResponse.json(
    { error: { code, message, ...(action ? { action } : {}) } },
    { status },
  );
}

export function handleRouteError(error: unknown) {
  if (error instanceof ApiError) {
    return errorResponse(error.status, error.code, error.message, error.action);
  }
  if (error instanceof GithubError) {
    return errorResponse(error.status, error.code, error.message, error.action);
  }
  console.error("[viva] Unhandled route error:", error);
  return errorResponse(
    500,
    "internal_error",
    "Something broke on our side.",
    "Try again in a moment.",
  );
}

export async function parseBody<T>(
  request: Request,
  schema: z.ZodType<T>,
): Promise<T> {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    throw new ApiError(
      400,
      "invalid_json",
      "The request body is not valid JSON.",
      "Retry the request.",
    );
  }

  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    throw new ApiError(
      400,
      "invalid_body",
      parsed.error.issues[0]?.message ?? "Check the request fields.",
      "Fix the highlighted field and try again.",
    );
  }
  return parsed.data;
}

export async function sessionForOwner(id: string): Promise<SessionData> {
  const session = await getSession(id);
  if (!session) {
    throw new ApiError(
      404,
      "not_found",
      "That viva does not exist.",
      "Start a new one from the home page.",
    );
  }

  const anonId = await getAnonId();
  if (!anonId || session.anonId !== anonId) {
    throw new ApiError(
      404,
      "not_found",
      "That viva does not exist.",
      "Start a new one from the home page.",
    );
  }

  return session;
}

export function searchParam(request: Request, key: string) {
  return new URL(request.url).searchParams.get(key)?.trim() ?? "";
}
