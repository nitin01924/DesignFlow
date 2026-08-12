import ImageAsset from "../models/ImageAsset.js";
import asyncHandler from "../middleware/asyncHandler.js";
import { serializeImageAsset } from "../utils/imageAsset.js";

const DEFAULT_PAGE_SIZE = 60;
const MAX_PAGE_SIZE = 100;

const escapeRegExp = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const parseLimit = (value) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return DEFAULT_PAGE_SIZE;
  return Math.min(MAX_PAGE_SIZE, Math.max(1, parsed));
};

export const getImageAssets = asyncHandler(async (req, res) => {
  const limit = parseLimit(req.query.limit);
  const query = { owner: req.user._id };
  const search = String(req.query.search || "").trim().slice(0, 100);

  if (search) {
    query.$and = search.split(/\s+/).map((term) => {
      const matcher = new RegExp(escapeRegExp(term), "i");
      return { $or: [{ name: matcher }, { originalFilename: matcher }] };
    });
  }

  if (req.query.before) {
    const before = new Date(req.query.before);
    if (Number.isNaN(before.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid image cursor",
      });
    }
    query.createdAt = { $lt: before };
  }

  // Ownership is always part of the database query; callers can never enumerate
  // another user's uploads by guessing IDs or changing query parameters.
  const results = await ImageAsset.find(query)
    .sort({ createdAt: -1, _id: -1 })
    .limit(limit + 1)
    .lean();
  const hasMore = results.length > limit;
  const assets = results.slice(0, limit);

  res.status(200).json({
    success: true,
    assets: assets.map(serializeImageAsset),
    pagination: {
      hasMore,
      nextCursor: hasMore
        ? assets.at(-1)?.createdAt?.toISOString?.() || null
        : null,
    },
  });
});
