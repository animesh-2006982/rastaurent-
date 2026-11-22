import { doc, runTransaction, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

const num = (v) => Number(v || 0);

/**
 * SALE → RECIPE → INGREDIENT USAGE → INVENTORY DEDUCTION
 *
 * - Uses Firebase transaction
 * - Prevents duplicate deduction for the same order
 * - Updates inventory stock
 * - Creates inventory ledger
 * - Creates inventory history
 */
export async function deductInventoryForSale({
  orderId,
  orderNumber = "",
  branchId = "branch-01",
  items = [],
  createdBy = "unknown"
}) {
  if (!orderId || !Array.isArray(items) || !items.length) {
    return {
      deducted: false,
      reason: "no-items"
    };
  }

  // Prevent the same sale from deducting stock twice
  const deductionRef = doc(
    db,
    "inventoryDeductions",
    String(orderId)
  );

  const productIds = [
    ...new Set(
      items
        .map((item) => item.productId || item.id)
        .filter(Boolean)
    )
  ];

  return runTransaction(db, async (tx) => {

    // Check duplicate deduction
    const deductionSnap = await tx.get(deductionRef);

    if (deductionSnap.exists()) {
      return {
        deducted: false,
        alreadyDeducted: true
      };
    }

    // --------------------------------------------------
    // PRODUCT DATA
    // --------------------------------------------------

    const productSnaps = await Promise.all(
      productIds.map((id) =>
        tx.get(
          doc(db, "products", String(id))
        )
      )
    );

    const productMap = new Map(
      productIds.map((id, index) => [
        String(id),
        productSnaps[index]
      ])
    );

    // --------------------------------------------------
    // FIND RECIPE FOR EACH PRODUCT
    // --------------------------------------------------

    const recipeIds = productIds
      .map((id) => {
        const snap = productMap.get(String(id));

        if (!snap?.exists()) {
          return null;
        }

        const product = snap.data() || {};

        return (
          product.recipeId ||
          product.recipeID ||
          String(id)
        );
      })
      .filter(Boolean);

    const uniqueRecipeIds = [
      ...new Set(recipeIds.map(String))
    ];

    const recipeSnaps = await Promise.all(
      uniqueRecipeIds.map((id) =>
        tx.get(
          doc(db, "recipes", id)
        )
      )
    );

    const recipeMap = new Map(
      uniqueRecipeIds.map((id, index) => [
        String(id),
        recipeSnaps[index]
      ])
    );

    // --------------------------------------------------
    // CALCULATE INGREDIENT USAGE
    // --------------------------------------------------

    const usages = [];

    for (const item of items) {

      const productId = String(
        item.productId ||
        item.id ||
        ""
      );

      const productSnap =
        productMap.get(productId);

      const product =
        productSnap?.exists()
          ? productSnap.data()
          : {};

      const recipeId =
        product.recipeId ||
        product.recipeID ||
        productId;

      const recipeSnap =
        recipeMap.get(String(recipeId));

      if (!recipeSnap?.exists()) {
        continue;
      }

      const recipe =
        recipeSnap.data() || {};

      const ingredients =
        Array.isArray(recipe.ingredients)
          ? recipe.ingredients
          : [];

      for (const ingredient of ingredients) {

        const inventoryId =
          ingredient.inventoryId ||
          ingredient.inventoryItemId;

        const qtyPerSale =
          num(ingredient.qty);

        if (
          !inventoryId ||
          qtyPerSale <= 0
        ) {
          continue;
        }

        usages.push({
          inventoryId: String(inventoryId),

          itemName:
            ingredient.name ||
            String(inventoryId),

          quantity:
            qtyPerSale *
            Math.max(
              1,
              num(item.qty)
            ),

          unit:
            ingredient.unit ||
            "unit",

          productId,

          productName:
            item.name ||
            product.name ||
            productId
        });
      }
    }

    // --------------------------------------------------
    // GROUP SAME INGREDIENTS
    // --------------------------------------------------

    const grouped = new Map();

    for (const usage of usages) {

      const key =
        usage.inventoryId;

      const old =
        grouped.get(key);

      grouped.set(
        key,
        old
          ? {
              ...old,

              quantity:
                old.quantity +
                usage.quantity,

              products: [
                ...old.products,
                usage.productId
              ]
            }
          : {
              ...usage,
              products: [
                usage.productId
              ]
            }
      );
    }

    const inventoryIds = [
      ...grouped.keys()
    ];

    // --------------------------------------------------
    // GET INVENTORY ITEMS
    // --------------------------------------------------

    const inventorySnaps =
      await Promise.all(
        inventoryIds.map((id) =>
          tx.get(
            doc(db, "inventory", id)
          )
        )
      );

    // --------------------------------------------------
    // DEDUCT STOCK
    // --------------------------------------------------

    for (
      let index = 0;
      index < inventoryIds.length;
      index++
    ) {

      const inventoryId =
        inventoryIds[index];

      const snap =
        inventorySnaps[index];

      const usage =
        grouped.get(inventoryId);

      if (!snap.exists()) {
        throw new Error(
          `Inventory item not found for recipe ingredient: ${usage.itemName}`
        );
      }

      const data =
        snap.data() || {};

      // Branch validation
      if (
        data.branchId &&
        branchId &&
        data.branchId !== branchId
      ) {
        throw new Error(
          `${usage.itemName} is assigned to ${data.branchId}, not ${branchId}.`
        );
      }

      const oldQty =
        num(
          data.qty ??
          data.stock
        );

      const nextQty =
        oldQty -
        usage.quantity;

      // Prevent negative stock
      if (
        nextQty < -0.000001
      ) {
        throw new Error(
          `Insufficient stock for ${usage.itemName}. Available: ${oldQty} ${data.unit || usage.unit}; Required: ${usage.quantity} ${usage.unit}.`
        );
      }

      const finalQty =
        Math.max(
          0,
          nextQty
        );

      // ------------------------------------------------
      // UPDATE INVENTORY
      // ------------------------------------------------

      tx.update(
        doc(
          db,
          "inventory",
          inventoryId
        ),
        {
          qty: finalQty,

          // Keep old stock field compatible
          stock: finalQty,

          updated: "Just now",

          updatedAt:
            serverTimestamp()
        }
      );

      // ------------------------------------------------
      // STOCK LEDGER
      // ------------------------------------------------

      const ledgerId =
        `SALE-${orderId}-${inventoryId}`
          .replace(
            /[^A-Za-z0-9_-]/g,
            "_"
          );

      tx.set(
        doc(
          db,
          "inventoryLedger",
          ledgerId
        ),
        {
          id: ledgerId,

          inventoryId,

          itemName:
            data.name ||
            data.item ||
            usage.itemName,

          branchId:
            data.branchId ||
            branchId,

          type:
            "Sale / Recipe Deduction",

          quantity:
            -usage.quantity,

          balance:
            finalQty,

          unit:
            data.unit ||
            usage.unit,

          reason:
            `Sale ${orderNumber || orderId}`,

          orderId,

          orderNumber,

          productIds:
            usage.products,

          createdBy,

          createdAt:
            serverTimestamp()
        }
      );

      // ------------------------------------------------
      // STOCK HISTORY
      // ------------------------------------------------

      tx.set(
        doc(
          db,
          "inventoryHistory",
          ledgerId
        ),
        {
          id: ledgerId,

          inventoryId,

          itemName:
            data.name ||
            data.item ||
            usage.itemName,

          branchId:
            data.branchId ||
            branchId,

          action:
            "SALE_DEDUCTION",

          before:
            oldQty,

          change:
            -usage.quantity,

          after:
            finalQty,

          unit:
            data.unit ||
            usage.unit,

          reason:
            `Sale ${orderNumber || orderId}`,

          orderId,

          orderNumber,

          createdBy,

          createdAt:
            serverTimestamp()
        }
      );
    }

    // --------------------------------------------------
    // DEDUCTION RECORD
    // --------------------------------------------------

    tx.set(
      deductionRef,
      {
        id: String(orderId),

        orderId,

        orderNumber,

        branchId,

        status:
          "Deducted",

        ingredientCount:
          grouped.size,

        usages:
          [
            ...grouped.values()
          ].map((item) => ({
            inventoryId:
              item.inventoryId,

            itemName:
              item.itemName,

            quantity:
              item.quantity,

            unit:
              item.unit,

            productIds:
              item.products
          })),

        createdBy,

        createdAt:
          serverTimestamp()
      }
    );

    return {
      deducted: true,

      ingredientCount:
        grouped.size
    };
  });
}