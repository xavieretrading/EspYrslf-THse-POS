import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://aziowvhzfrmtrbypiodm.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  // Fetch all products for both branches 27 and 30
  const { data: products, error } = await supabase
    .from('products_espresso')
    .select('id, name, branch_id');

  if (error) {
    console.error('Error fetching products:', error);
    return;
  }

  console.log(`Found ${products.length} products to update with unique photography.`);

  for (const product of products) {
    const nameLower = product.name.toLowerCase();
    let queryTag = 'cafe,drink';

    if (nameLower.includes('matcha')) {
      queryTag = 'matcha,tea';
    } else if (nameLower.includes('americano')) {
      queryTag = 'coffee,black';
    } else if (nameLower.includes('cappuccino') || nameLower.includes('latte') || nameLower.includes('macchiato') || nameLower.includes('mocha') || nameLower.includes('butterscotch') || nameLower.includes('vanilla') || nameLower.includes('macadamia')) {
      queryTag = 'latte,art';
    } else if (nameLower.includes('tea') || nameLower.includes('jasmine') || nameLower.includes('oolong') || nameLower.includes('peppermint') || nameLower.includes('camomile')) {
      queryTag = 'tea,cup';
    } else if (nameLower.includes('guava') || nameLower.includes('mango') || nameLower.includes('pomegranate') || nameLower.includes('lychee') || nameLower.includes('strawberry') || nameLower.includes('puree') || nameLower.includes('cola') || nameLower.includes('sprite')) {
      queryTag = 'juice,iced';
    } else if (nameLower.includes('pilsen') || nameLower.includes('red horse') || nameLower.includes('san mig') || nameLower.includes('pelsin')) {
      queryTag = 'beer,bottle';
    } else if (nameLower.includes('water') || nameLower.includes('spring') || nameLower.includes('evian') || nameLower.includes('perrier')) {
      queryTag = 'water,bottle';
    } else if (nameLower.includes('pringles') || nameLower.includes('cheetos') || nameLower.includes('croissant') || nameLower.includes('cake') || nameLower.includes('pain') || nameLower.includes('suisse')) {
      queryTag = 'pastry,bakery';
    } else if (nameLower.includes('laundry') || nameLower.includes('downy') || nameLower.includes('detergent') || nameLower.includes('surf') || nameLower.includes('wash') || nameLower.includes('dry') || nameLower.includes('pressing') || nameLower.includes('ironing')) {
      queryTag = 'laundry,detergent';
    }

    // Unsplash featured image source URL with unique signature and tags
    const imageUrl = `https://images.unsplash.com/featured/400x400/?${queryTag}&sig=${product.id}`;

    const { error: updateError } = await supabase
      .from('products_espresso')
      .update({ image_url: imageUrl })
      .eq('id', product.id);

    if (updateError) {
      console.error(`Failed to update ${product.name}:`, updateError.message);
    } else {
      console.log(`Updated ${product.name} -> ${imageUrl}`);
    }
  }

  console.log('Successfully completed unique photography updates.');
}

main();
