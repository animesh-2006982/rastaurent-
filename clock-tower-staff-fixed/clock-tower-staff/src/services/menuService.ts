
import {
  createDocument,
  deleteDocument,
  getCollection,
  updateDocument,
} from "@/firebase/firestore";

import type { MenuItem } from "@/types/menu";

// All applications use the same products collection.

export async function getMenuItems() {
  const products =
    await getCollection<Record<string, any>>("products");

  return products
    .filter(
      (item) =>
        item.available !== false &&
        item.active !== false
    )
    .map((item) => ({
      ...item,

      categoryId:
        item.categoryId || item.category || "General",

      categoryName:
        item.categoryName || item.category || "General",

      description:
        item.description || item.desc || "",

      imageUrl:
        item.imageUrl || item.img || item.image || "",

      available: item.available !== false,
      active: item.active !== false,
    })) as MenuItem[];
}

export async function addMenuItem(
  item: Omit<MenuItem, "id">
) {
  return createDocument("products", {
    ...item,

    category:
      item.categoryName ||
      item.categoryId ||
      "General",

    desc: item.description || "",
    img: item.imageUrl || "",

    available: item.available !== false,
  });
}

export async function updateMenuItem(
  id: string,
  data: Partial<MenuItem>
) {
  const patch: Record<string, unknown> = {
    ...data,
  };

  if (data.categoryName || data.categoryId) {
    patch.category =
      data.categoryName || data.categoryId;
  }

  if (data.description !== undefined) {
    patch.desc = data.description;
  }

  if (data.imageUrl !== undefined) {
    patch.img = data.imageUrl;
  }

  return updateDocument("products", id, patch);
}

export async function deleteMenuItem(id: string) {
  return deleteDocument("products", id);
}
