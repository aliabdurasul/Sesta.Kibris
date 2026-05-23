const fs = require("fs");
const path = require("path");

// Manually load .env.local
const envPath = path.join(__dirname, ".env.local");
const envContent = fs.readFileSync(envPath, "utf8");
envContent.split("\n").forEach((line) => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) return;
  const idx = trimmed.indexOf("=");
  if (idx < 0) return;
  const key = trimmed.slice(0, idx).trim();
  const val = trimmed.slice(idx + 1).trim();
  if (!process.env[key]) process.env[key] = val;
});

const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  console.log("Fetching admin user...");
  const adminEmail = "s23883@gmail.com";

  const { data: usersData, error: usersErr } = await supabase.auth.admin.listUsers();
  if (usersErr) throw usersErr;

  const adminUser = usersData.users.find((u) => u.email === adminEmail);
  if (!adminUser) throw new Error("Admin user not found: " + adminEmail);

  const v_admin_id = adminUser.id;
  console.log("Admin ID:", v_admin_id);

  console.log("Fetching categories...");
  const { data: cats, error: catErr } = await supabase
    .from("product_categories")
    .select("id, slug");
  if (catErr) throw catErr;
  console.log("Found categories:", cats.map((c) => c.slug).join(", "));

  const getCatId = (slug) => {
    const f = cats.find((c) => c.slug === slug);
    if (!f) {
      console.warn("WARNING: Category not found:", slug);
      return null;
    }
    return f.id;
  };

  const catMap = {
    c_sut_yumurta: getCatId("sut-yumurta"),
    c_ekmek_unlu: getCatId("ekmek-unlu"),
    c_et_sarkuteri: getCatId("et-sarkuteri"),
    c_meyve_sebze: getCatId("meyve-sebze"),
    c_dondurulmus: getCatId("dondurulmus"),
    c_icecekler: getCatId("icecekler"),
    c_temizlik: getCatId("temizlik"),
    c_kisisel_bakim: getCatId("kisisel-bakim"),
    c_kahvaltilik: getCatId("kahvaltilik"),
    c_bakliyat_tahil: getCatId("bakliyat-tahil"),
    c_atistirmalik: getCatId("atistirmalik"),
    c_su_gazli: getCatId("su-gazli"),
  };

  console.log("Parsing SQL file...");
  const sql = fs.readFileSync("supabase/seed_global_products.sql", "utf8");

  // Match each VALUES row in the INSERT
  const regex =
    /\((c_[a-z_]+)\s*,\s*'((?:[^'\\]|\\.)*)'\s*,\s*'((?:[^'\\]|\\.)*)'\s*,\s*(NULL|'(?:[^'\\]|\\.)*')\s*,\s*'((?:[^'\\]|\\.)*)'\s*,\s*'((?:[^'\\]|\\.)*)'\s*,\s*ARRAY\[([\s\S]*?)\]\s*,\s*v_admin_id\)/g;

  let match;
  const products = [];

  while ((match = regex.exec(sql)) !== null) {
    let brand = match[4];
    brand = brand === "NULL" ? null : brand.replace(/^'|'$/g, "");

    const tagsRaw = match[7];
    const tags = tagsRaw
      .split(",")
      .map((t) => t.trim().replace(/^'|'$/g, ""))
      .filter(Boolean);

    const catId = catMap[match[1]];
    products.push({
      category_id: catId,
      name: match[2],
      slug: match[3],
      brand: brand,
      unit: match[5],
      description: match[6],
      tags: tags,
      created_by: v_admin_id,
      is_active: true,
    });
  }

  console.log(`Parsed ${products.length} products.`);
  if (products.length === 0) {
    console.error("No products parsed! Check regex.");
    return;
  }

  // Insert in chunks of 50
  for (let i = 0; i < products.length; i += 50) {
    const chunk = products.slice(i, i + 50);
    const { error: insErr } = await supabase
      .from("global_products")
      .upsert(chunk, { onConflict: "slug", ignoreDuplicates: true });
    if (insErr) {
      console.error("Insert error at chunk", i, insErr.message);
      throw insErr;
    }
    console.log(`Inserted chunk ${i}–${i + chunk.length}`);
  }

  console.log("✅ Done! All products seeded.");
}

run().catch((err) => {
  console.error("FAILED:", err.message);
  process.exit(1);
});
