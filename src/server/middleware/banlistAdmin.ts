import { NextFunction, Response } from "express";
import { AuthenticatedRequest } from "./auth";

/** Global rules are writable only by explicitly configured account IDs. Empty configuration denies writes. */
export function requireBanlistAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const admins = (process.env.BANLIST_ADMIN_USER_IDS ?? "").split(",").map((id) => id.trim()).filter(Boolean);
  if (!req.user || !admins.includes(req.user.id)) {
    return res.status(403).json({ error: "Banlist administrator access required" });
  }
  return next();
}
