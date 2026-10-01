const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://aziowvhzfrmtrbypiodm.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6aW93dmh6ZnJtdHJieXBpb2RtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDYxNDMxOCwiZXhwIjoyMTAwMTkwMzE4fQ.6TzWshOMqE72fhGKfAYhJY448s_1Fw_wIvVIgtKiS0o';
const supabase = createClient(supabaseUrl, serviceRoleKey);

async function setupMandaueBranch() {
  console.log('--- Setting up S1p and Sp1n - Mandaue Branch ---');
  
  // 1. Check if branch already exists
  let { data: existingBranches } = await supabase
    .from('branches_espresso')
    .select('*')
    .ilike('name', '%Mandaue%');

  let branch;
  if (existingBranches && existingBranches.length > 0) {
    branch = existingBranches[0];
    console.log('Mandaue branch already exists with ID:', branch.id);
    await supabase.from('branches_espresso').update({
      address: 'M.P Durban Bldg. F. ROSAL st. corner A. Del Rosario St. Mantuyong , Mandaue City',
      is_active: true
    }).eq('id', branch.id);
  } else {
    const { data: newBranch, error: branchErr } = await supabase
      .from('branches_espresso')
      .insert([{
        name: 'S1p and Sp1n - Mandaue Branch',
        address: 'M.P Durban Bldg. F. ROSAL st. corner A. Del Rosario St. Mantuyong , Mandaue City',
        is_bir_compliant: false,
        is_active: true
      }])
      .select()
      .single();
    if (branchErr) {
      console.error('Failed to create branch:', branchErr);
      return;
    }
    branch = newBranch;
    console.log('Created Mandaue branch successfully with ID:', branch.id);
  }

  const branchId = branch.id;

  // 2. Receipt Counter for Mandaue branch
  const { data: existingCounter } = await supabase
    .from('receipt_counter_espresso')
    .select('*')
    .eq('branch_id', branchId);

  if (!existingCounter || existingCounter.length === 0) {
    await supabase.from('receipt_counter_espresso').insert([{
      branch_id: branchId,
      current_value: 1000
    }]);
    console.log('Initialized receipt counter at 1000 for branch', branchId);
  }

  // 3. Fetch Laundry Categories from branch 27 to clone
  const { data: davaoCats } = await supabase
    .from('categories_espresso')
    .select('*')
    .eq('branch_id', 27)
    .eq('division', 'laundry');

  console.log('Found', davaoCats?.length, 'laundry categories from Davao branch');

  const catMap = new Map(); // oldCatId -> newCatId

  for (const cat of (davaoCats || [])) {
    const { data: existingCat } = await supabase
      .from('categories_espresso')
      .select('*')
      .eq('branch_id', branchId)
      .eq('name', cat.name)
      .maybeSingle();

    let newCatId;
    if (existingCat) {
      newCatId = existingCat.id;
    } else {
      const { data: createdCat, error: catErr } = await supabase
        .from('categories_espresso')
        .insert([{
          name: cat.name,
          division: 'laundry',
          branch_id: branchId,
          is_active: 1
        }])
        .select()
        .single();
      if (catErr) {
        console.error('Error creating category', cat.name, catErr);
        continue;
      }
      newCatId = createdCat.id;
    }
    catMap.set(cat.id, newCatId);
    console.log('Mapped category ' + cat.name + ': old ID ' + cat.id + ' -> new ID ' + newCatId);
  }

  // 4. Clone laundry products from branch 27
  const oldCatIds = Array.from(catMap.keys());
  const { data: davaoProds } = await supabase
    .from('products_espresso')
    .select('*')
    .in('category_id', oldCatIds);

  console.log('Found', davaoProds?.length, 'laundry products from Davao to clone');

  // Check existing Mandaue products
  const { data: existingProds } = await supabase
    .from('products_espresso')
    .select('name')
    .eq('branch_id', branchId);

  const existingProdNames = new Set((existingProds || []).map(p => (p.name || '').trim().toLowerCase()));

  const prodsToInsert = [];
  for (const p of (davaoProds || [])) {
    const normName = (p.name || '').trim().toLowerCase();
    if (existingProdNames.has(normName)) continue;
    const newCatId = catMap.get(p.category_id);
    if (!newCatId) continue;

    prodsToInsert.push({
      branch_id: branchId,
      category_id: newCatId,
      name: p.name,
      price: p.price,
      cost: p.cost || 0,
      stock: p.stock > 0 ? p.stock : 9999,
      unit: p.unit || (p.name.includes('/kg') || p.name.includes('/kilo') ? 'kg' : 'pcs'),
      is_active: 1
    });
    existingProdNames.add(normName);
  }

  if (prodsToInsert.length > 0) {
    const { error: prodErr } = await supabase
      .from('products_espresso')
      .insert(prodsToInsert);
    if (prodErr) console.error('Error inserting products:', prodErr);
    else console.log('Successfully inserted ' + prodsToInsert.length + ' laundry products for Mandaue!');
  } else {
    console.log('Products already populated for Mandaue.');
  }

  // Print summary
  const { data: finalBranch } = await supabase.from('branches_espresso').select('*').eq('id', branchId).single();
  console.log('Final Mandaue Branch in DB:', finalBranch);
  console.log('--- Setup Complete ---');
}

setupMandaueBranch();
