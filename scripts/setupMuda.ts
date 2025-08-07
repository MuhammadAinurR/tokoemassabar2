/**
 * Setup script to initialize Muda categories and migrate data
 * Run this after the Prisma client is properly generated
 */

import prisma from '../src/lib/prisma';

async function setupMudaCategories() {
  try {
    console.log('Setting up Muda categories...');

    // Get all existing categories
    const existingCategories = await prisma.category.findMany();

    console.log(`Found ${existingCategories.length} existing categories`);

    // Create corresponding muda categories
    for (const category of existingCategories) {
      try {
        // Check if muda category already exists
        const existingMudaCategory = await prisma.mudaCategory.findFirst({
          where: { code: category.code },
        });

        if (!existingMudaCategory) {
          await prisma.mudaCategory.create({
            data: {
              code: category.code,
              name: category.name,
              goldContent: category.goldContent,
              minimumPrice: category.minimumPrice,
              itemCount: 0,
              totalWeight: 0,
            },
          });
          console.log(`Created muda category: ${category.name}`);
        } else {
          console.log(`Muda category already exists: ${category.name}`);
        }
      } catch (error) {
        console.error(`Error creating muda category ${category.name}:`, error);
      }
    }

    console.log('Muda categories setup completed!');
  } catch (error) {
    console.error('Error setting up muda categories:', error);
  }
}

async function main() {
  await setupMudaCategories();
  await prisma.$disconnect();
}

// Uncomment the line below to run the setup
// main().catch(console.error);

export { setupMudaCategories };
