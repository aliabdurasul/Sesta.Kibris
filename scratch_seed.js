const fs = require("fs");
const { createClient } = require("@supabase/supabase-js");

require("dotenv").config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  console.log("Fetching admin user...");
  // User provided their admin email
  const adminEmail = "s23883@gmail.com";
  
  const { data: usersData, error: usersErr } = await supabase.auth.admin.listUsers();
  if (usersErr) throw usersErr;
  
  const adminUser = usersData.users.find(u => u.email === adminEmail);
  if (!adminUser) throw new Error("Admin user not found in auth.users!");
  
  const v_admin_id = adminUser.id;
  console.log("Admin ID:", v_admin_id);

  console.log("Fetching categories...");
  const { data: cats, error: catErr } = await supabase.from("product_categories").select("id, slug");
  if (catErr) throw catErr;

  const getCatId = (slug) => {
    const f = cats.find(c => c.slug === slug);
    if (!f) throw new Error("Category missing: " + slug);
    return f.id;
  };

  const catMap = {
    "c_sut_yumurta": getCatId("sut-yumurta"),
    "c_ekmek_unlu": getCatId("ekmek-unlu"),
    "c_et_sarkuteri": getCatId("et-sarkuteri"),
    "c_meyve_sebze": getCatId("meyve-sebze"),
    "c_dondurulmus": getCatId("dondurulmus"),
    "c_icecekler": getCatId("icecekler"),
    "c_temizlik": getCatId("temizlik"),
    "c_kisisel_bakim": getCatId("kisisel-bakim"),
    "c_kahvaltilik": getCatId("kahvaltilik"),
    "c_bakliyat_tahil": getCatId("bakliyat-tahil"),
    "c_atistirmalik": getCatId("atistirmalik"),
    "c_su_gazli": getCatId("su-gazli"),
  };

  console.log("Parsing SQL file...");
  const sql = fs.readFileSync("supabase/seed_global_products.sql", "utf8");
  
  // Regex to match a single VALUES row: (c_category, 'name', 'slug', brand, 'unit', 'desc', ARRAY['tags'], v_admin_id)
  const regex = /\((c_[a-z_]+)\s*,\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*(NULL|'[^']+')\s*,\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*ARRAY\[(.*?)\](?:[::[a-z]+]*)?\s*,\s*v_admin_id\)/g;
  
  let match;
  const products = [];
  
  while ((match = regex.exec(sql)) !== null) {
    let brand = match[4];
    brand = brand === "NULL" ? null : brand.replace(/'/g, "");
    
    // Parse tags: 'tag1','tag2' -> ["tag1", "tag2"]
    const tagsRaw = match[7];
    const tags = tagsRaw.split(",").map(t => t.trim().replace(/^'|'$/g, ""));
    
    products.push({
      category_id: catMap[match[1]],
      name: match[2],
      slug: match[3],
      brand: brand,
      unit: match[5],
      description: match[6],
      tags: tags,
      created_by: v_admin_id,
      is_active: true
    });
  }
  
  console.log(`Parsed ${products.length} products. Inserting...`);
  
  if (products.length === 0) {
     console.log("No products parsed! Regex might be failing.");
     return;
  }

  // Insert in chunks of 50
  for (let i = 0; i < products.length; i += 50) {
    const chunk = products.slice(i, i + 50);
    const { error: insErr } = await supabase.from("global_products").upsert(chunk, { onConflict: "slug" });
    if (insErr) {
      console.error("Insert error chunk", i, insErr);
      throw insErr;
    }
  }

  console.log("Successfully seeded remote database!");
}

run().catch(console.error);
