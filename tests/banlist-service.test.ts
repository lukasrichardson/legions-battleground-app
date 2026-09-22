import { describe, expect, it } from "vitest";
import { getSrlStatusOptions, getSrlTitleFilter, updateBanlistEntry } from "../src/server/services/api/BanlistService";
import { BanlistStatus } from "../src/shared/interfaces/BanlistItem.mongo";

const createDatabase = (entries: { name: string; status: BanlistStatus }[]) => {
  const records = [...entries];
  const collection = {
    deleteMany: async ({ name }: { name: string }) => {
      for (let index = records.length - 1; index >= 0; index -= 1) {
        if (records[index].name === name) records.splice(index, 1);
      }
    },
    updateOne: async (
      { name }: { name: string },
      { $set }: { $set: { name: string; status: BanlistStatus } },
    ) => {
      const existing = records.find((record) => record.name === name);
      if (existing) Object.assign(existing, $set);
      else records.push($set);
    },
    find: () => ({ toArray: async () => [...records] }),
  };

  return { collection: () => collection };
};

describe("updateBanlistEntry", () => {
  it("removes all records when a card is made unrestricted", async () => {
    const db = createDatabase([
      { name: "Formerly Limited", status: BanlistStatus.LIMITED },
      { name: "Formerly Limited", status: BanlistStatus.UNRESTRICTED },
      { name: "Suspended Card", status: BanlistStatus.SUSPENDED },
    ]);

    await expect(updateBanlistEntry(db as never, "Formerly Limited", BanlistStatus.UNRESTRICTED)).resolves.toEqual([
      { name: "Suspended Card", status: BanlistStatus.SUSPENDED },
    ]);
  });

  it("upserts active restrictions", async () => {
    const db = createDatabase([]);

    await expect(updateBanlistEntry(db as never, "Limited Card", BanlistStatus.LIMITED)).resolves.toEqual([
      { name: "Limited Card", status: BanlistStatus.LIMITED },
    ]);
  });
});

describe("S/R/L filters", () => {
  const db = createDatabase([
    { name: "Limited Card", status: BanlistStatus.LIMITED },
    { name: "Suspended Card", status: BanlistStatus.SUSPENDED },
  ]);

  it("always offers unrestricted, even though it has no banlist records", () => {
    expect(getSrlStatusOptions([BanlistStatus.LIMITED, BanlistStatus.SUSPENDED])).toEqual([
      BanlistStatus.LIMITED,
      BanlistStatus.SUSPENDED,
      BanlistStatus.UNRESTRICTED,
    ]);
  });

  it("maps unrestricted to cards with no banlist record", async () => {
    await expect(getSrlTitleFilter(db as never, [BanlistStatus.UNRESTRICTED])).resolves.toEqual({
      title: { $nin: ["Limited Card", "Suspended Card"] },
    });
  });

  it("combines unrestricted with selected active statuses", async () => {
    await expect(getSrlTitleFilter(db as never, [BanlistStatus.UNRESTRICTED, BanlistStatus.LIMITED])).resolves.toEqual({
      $or: [
        { title: { $in: ["Limited Card"] } },
        { title: { $nin: ["Limited Card", "Suspended Card"] } },
      ],
    });
  });
});
