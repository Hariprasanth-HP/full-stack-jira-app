import { Prisma } from "@prisma/client";

export function isPrismaKnownError(e: unknown): e is Prisma.PrismaClientKnownRequestError {
  if (typeof e !== "object" || e === null) return false;

  if (!("code" in e)) return false;
  if (typeof (e as { code: unknown }).code !== "string") return false;

  return true;
}
