import { Db } from "mongodb";
import BanlistItem, { BanlistStatus } from "@/shared/interfaces/BanlistItem.mongo";

export const getSrlStatusOptions = (activeStatuses: string[]) =>
  [...new Set([...activeStatuses, BanlistStatus.UNRESTRICTED])].sort();

export const getSrlTitleFilter = async (db: Db, requestedStatuses: string[]) => {
  const banlist = db.collection<BanlistItem>("banlist");
  const entries = await banlist.find({}, { projection: { _id: 0, name: 1, status: 1 } }).toArray();
  const activeStatuses = requestedStatuses.filter((status) => status !== BanlistStatus.UNRESTRICTED);
  const matchingNames = entries
    .filter((entry) => activeStatuses.includes(entry.status))
    .map((entry) => entry.name);

  if (!requestedStatuses.includes(BanlistStatus.UNRESTRICTED)) {
    return { title: { $in: matchingNames } };
  }

  const unrestrictedFilter = { title: { $nin: entries.map((entry) => entry.name) } };
  if (!activeStatuses.length) return unrestrictedFilter;

  return { $or: [{ title: { $in: matchingNames } }, unrestrictedFilter] };
};

/**
 * Stores only active S/R/L restrictions. Unrestricted is the implicit default
 * and is represented by the absence of a banlist record.
 */
export const updateBanlistEntry = async (db: Db, name: string, status: BanlistStatus) => {
  const banlist = db.collection<BanlistItem>("banlist");

  if (status === BanlistStatus.UNRESTRICTED) {
    await banlist.deleteMany({ name });
  } else {
    await banlist.updateOne({ name }, { $set: { name, status } }, { upsert: true });
  }

  return banlist.find({}).toArray();
};
