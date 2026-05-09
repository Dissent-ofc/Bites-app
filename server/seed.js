import { FoodItem } from "./models/FoodItem.js";
import { foodItemsSeed } from "./seedData.js";

function normalizeFoodSeedItem(item) {
  const normalizedPrice = Number(item.price);
  return {
    ...item,
    price: Number.isFinite(normalizedPrice) ? normalizedPrice : Number(item.minOrder) || 0,
  };
}

export async function seedDatabase() {
  const [foodCount] = await Promise.all([FoodItem.countDocuments()]);

  const tasks = [];
  if (foodCount === 0) {
    tasks.push(FoodItem.insertMany(foodItemsSeed.map(normalizeFoodSeedItem)));
  } else {
    tasks.push(
      (async () => {
        const existing = await FoodItem.find({}, { name: 1, _id: 0, minOrder: 1, price: 1 }).lean();
        const existingNames = new Set(existing.map(item => item.name));
        const missingItems = foodItemsSeed
          .filter(item => !existingNames.has(item.name))
          .map(normalizeFoodSeedItem);

        if (missingItems.length > 0) {
          await FoodItem.insertMany(missingItems);
        }

        await FoodItem.updateMany(
          { price: { $type: "string" } },
          [
            {
              $set: {
                price: {
                  $convert: {
                    input: "$minOrder",
                    to: "double",
                    onError: 0,
                    onNull: 0,
                  }
                }
              }
            }
          ]
        );
      })()
    );
  }

  if (tasks.length > 0) {
    await Promise.all(tasks);
    console.log("Seeded initial MongoDB data");
  }
}
