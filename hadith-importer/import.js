// ============================================================
// IslamicStack — Sunnah.com → Supabase Import Script v2
// ============================================================
// SETUP:
//   1. npm install @supabase/supabase-js node-fetch
//   2. Fill in SUPABASE_SERVICE_KEY below
//   3. node import.js
// ============================================================

const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

// ============================================================
// CONFIG — never commit service key to GitHub!
// ============================================================
const SUPABASE_URL = 'https://xxjbpxocmllnrpiaudnh.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4amJweG9jbWxsbnJwaWF1ZG5oIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTY2MTUxNSwiZXhwIjoyMDk1MjM3NTE1fQ.nImtV6OC9DaUbD4gepj3tsm4MOFoWGBTHa7uw975DAo';
const SUNNAH_API_KEY = 'SVD0zlGL4K3kC6jRcziH64BjuHESWTs93LLKfl5b';
const SUNNAH_API_BASE = 'https://api.sunnah.com/v1';

const COLLECTIONS = [
  { slug: 'bukhari',  name: 'Sahih al-Bukhari',   arabic: 'صحيح البخاري',  order: 1 },
  { slug: 'muslim',   name: 'Sahih Muslim',         arabic: 'صحيح مسلم',    order: 2 },
  { slug: 'abudawud', name: 'Sunan Abu Dawud',      arabic: 'سنن أبي داود', order: 3 },
  { slug: 'tirmidhi', name: 'Jami at-Tirmidhi',    arabic: 'جامع الترمذي', order: 4 },
  { slug: 'nasai',    name: "Sunan an-Nasa'i",      arabic: 'سنن النسائي',  order: 5 },
  { slug: 'ibnmajah', name: 'Sunan Ibn Majah',      arabic: 'سنن ابن ماجه', order: 6 },
];

const BATCH_SIZE = 50;
const DELAY_MS = 400;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const sunnahFetch = async (path) => {
  const res = await fetch(`${SUNNAH_API_BASE}${path}`, {
    headers: { 'X-API-Key': SUNNAH_API_KEY }
  });
  if (!res.ok) throw new Error(`API ${res.status} → ${path}`);
  return res.json();
};

// ============================================================
// STEP 1: Ensure collections exist, return slug→id map
// ============================================================
const ensureCollections = async () => {
  console.log('\n📚 Checking collections...');
  const { data: existing } = await supabase.from('collections').select('id, slug');
  const map = {};
  (existing || []).forEach(c => map[c.slug] = c.id);

  for (const col of COLLECTIONS) {
    if (map[col.slug]) {
      console.log(`  ⏭️  Exists: ${col.name}`);
      continue;
    }
    const { data, error } = await supabase
      .from('collections')
      .insert({ name: col.name, slug: col.slug, arabic_name: col.arabic,
                total_hadiths: 0, is_active: true, sort_order: col.order })
      .select('id').single();
    if (error) throw new Error(`Collection insert failed: ${error.message}`);
    map[col.slug] = data.id;
    console.log(`  ✅ Created: ${col.name}`);
  }
  return map;
};

// ============================================================
// STEP 2: Import hadiths for one collection (skip chapters)
// ============================================================
const importHadiths = async (col, collectionId) => {
  console.log(`\n📜 Importing: ${col.name}`);

  // Count already imported to allow resuming
  const { count: alreadyIn } = await supabase
    .from('hadiths')
    .select('id', { count: 'exact', head: true })
    .eq('collection_id', collectionId);

  if (alreadyIn > 0) {
    console.log(`  ⏭️  Already has ${alreadyIn} hadiths — skipping (delete them to re-import)`);
    return alreadyIn;
  }

  let page = 1;
  let total = 0;
  let hasMore = true;

  while (hasMore) {
    let data;
    try {
      data = await sunnahFetch(`/collections/${col.slug}/hadiths?limit=50&page=${page}`);
    } catch (e) {
      console.warn(`\n  ⚠️  Page ${page} failed: ${e.message} — retrying in 2s...`);
      await sleep(2000);
      try {
        data = await sunnahFetch(`/collections/${col.slug}/hadiths?limit=50&page=${page}`);
      } catch (e2) {
        console.warn(`  ❌ Page ${page} skipped after retry`);
        page++;
        continue;
      }
    }

    const hadiths = data.hadiths || [];
    if (hadiths.length === 0) { hasMore = false; break; }

    const rows = hadiths.map(h => {
      const arabic  = h.hadith?.find(x => x.lang === 'ar');
      const english = h.hadith?.find(x => x.lang === 'en');
      const grade   = english?.grades?.[0];

      return {
        collection_id: collectionId,
        chapter_id: null,            // chapters can be linked later
        hadith_number: parseInt(h.hadithNumber) || 0,
        arabic_text: arabic?.body || '',
        english_translation: english?.body || '',
        urdu_translation: '',
        narrator: english?.grades?.[0]?.name || '',
        narrator_arabic: arabic?.grades?.[0]?.name || '',
        grade: grade?.grade || '',
        grade_source: grade?.graded_by || '',
        reference: `${col.name} ${h.hadithNumber}`,
        topic_tags: [],
        is_active: true,
      };
    });

    // Insert in sub-batches
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      const { error } = await supabase.from('hadiths').insert(batch);
      if (error) console.warn(`  ⚠️  Batch warning p${page}: ${error.message}`);
    }

    total += hadiths.length;
    process.stdout.write(`\r  📥 ${col.name}: ${total} hadiths...`);

    page++;
    hasMore = hadiths.length === 50;
    await sleep(DELAY_MS);
  }

  // Update total_hadiths count on collection
  await supabase.from('collections')
    .update({ total_hadiths: total })
    .eq('id', collectionId);

  console.log(`\n  ✅ Done: ${total.toLocaleString()} hadiths`);
  return total;
};

// ============================================================
// MAIN
// ============================================================
const main = async () => {
  console.log('🕌 IslamicStack — Sunnah.com Hadith Importer v2');
  console.log('================================================');
  console.log(`📡 Supabase: ${SUPABASE_URL}`);
  console.log(`🔑 API Key:  ${SUNNAH_API_KEY.slice(0, 8)}...`);

  const start = Date.now();
  let grand = 0;

  try {
    const collectionMap = await ensureCollections();

    for (const col of COLLECTIONS) {
      const id = collectionMap[col.slug];
      if (!id) { console.warn(`\n⚠️  No ID for ${col.slug} — skipping`); continue; }
      const count = await importHadiths(col, id);
      grand += count;
    }

    const mins = Math.round((Date.now() - start) / 60000);
    console.log('\n================================================');
    console.log(`✅ Import complete!`);
    console.log(`📊 Total hadiths: ${grand.toLocaleString()}`);
    console.log(`⏱️  Time: ~${mins} minutes`);
    console.log(`\n🤲 Alhamdulillah — may Allah accept this work!`);

  } catch (err) {
    console.error('\n❌ Fatal error:', err.message);
    process.exit(1);
  }
};

main();
