// ============================================================
// IslamicStack — HadeethEnc Excel → Supabase Importer
// ============================================================
// SETUP:
//   1. npm install @supabase/supabase-js xlsx
//   2. Fill in SUPABASE_SERVICE_KEY below
//   3. node import-hadeethenc.js
// ============================================================

const { createClient } = require('@supabase/supabase-js');
const XLSX = require('xlsx');
const path = require('path');

// ============================================================
// CONFIG
// ============================================================
const SUPABASE_URL = 'https://xxjbpxocmllnrpiaudnh.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4amJweG9jbWxsbnJwaWF1ZG5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2NjE1MTUsImV4cCI6MjA5NTIzNzUxNX0.t8VgNOCXIr8gVKkZVRH5hQz6-BKCTIQVLW9Ii9sHqpg';
const EXCEL_FILE = '/Users/zeshananis/Desktop/projects/islamicstack/HadeethEnc.com_ur-v1.35.0.xlsx';
const BATCH_SIZE = 100;

// We'll store HadeethEnc hadiths in a separate collection
const HADEETHENC_COLLECTION = {
  name: 'HadeethEnc Collection',
  slug: 'hadeethenc',
  arabic_name: 'موسوعة الأحاديث النبوية',
  order: 7,
};

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ============================================================
// Ensure HadeethEnc collection exists
// ============================================================
const ensureCollection = async () => {
  console.log('\n📚 Setting up HadeethEnc collection...');
  const { data: existing } = await supabase
    .from('collections')
    .select('id, slug')
    .eq('slug', HADEETHENC_COLLECTION.slug)
    .single();

  if (existing) {
    console.log(`  ⏭️  Already exists (id: ${existing.id})`);
    return existing.id;
  }

  const { data, error } = await supabase
    .from('collections')
    .insert({
      name: HADEETHENC_COLLECTION.name,
      slug: HADEETHENC_COLLECTION.slug,
      arabic_name: HADEETHENC_COLLECTION.arabic_name,
      total_hadiths: 0,
      is_active: true,
      sort_order: HADEETHENC_COLLECTION.order,
    })
    .select('id')
    .single();

  if (error) throw new Error(`Collection insert failed: ${error.message}`);
  console.log(`  ✅ Created collection (id: ${data.id})`);
  return data.id;
};

// ============================================================
// Read Excel file
// ============================================================
const readExcel = (filePath) => {
  console.log(`\n📂 Reading Excel file: ${path.basename(filePath)}`);
  const wb = XLSX.readFile(filePath);
  const sheet = wb.Sheets[wb.SheetNames[0]];

  // Convert to JSON, skipping first row (header comment) — use row 2 as headers
  const rows = XLSX.utils.sheet_to_json(sheet, {
    range: 1, // Start from row 2 (0-indexed = 1) to skip the comment row
    defval: '',
  });

  console.log(`  ✅ Loaded ${rows.length} hadiths`);
  return rows;
};

// ============================================================
// MAIN
// ============================================================
const main = async () => {
  console.log('🕌 IslamicStack — HadeethEnc Importer');
  console.log('======================================');
  console.log(`📡 Supabase: ${SUPABASE_URL}`);

  const collectionId = await ensureCollection();
  const rows = readExcel(EXCEL_FILE);

  // Check if we need to add explanation/benefits columns
  // These are extra fields HadeethEnc provides that Sunnah.com doesn't
  // We'll store them in a separate table or use existing fields creatively

  let batch = [];
  let totalInserted = 0;
  let totalSkipped = 0;

  const flushBatch = async () => {
    if (batch.length === 0) return;
    const { error } = await supabase.from('hadiths').upsert(batch, {
      onConflict: 'collection_id,hadith_number',
      ignoreDuplicates: false,
    });
    if (error) {
      console.error(`\n❌ Insert FAILED: ${error.message}`);
      process.exit(1);
    }
    totalInserted += batch.length;
    batch = [];
  };

  console.log('\n📜 Processing hadiths...\n');

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    // Skip empty rows
    if (!row.id || (!row.hadith_text && !row.hadith_text_ar)) {
      totalSkipped++;
      continue;
    }

    // Map HadeethEnc columns to our schema
    // Note: grade comes as "[Authentic]" — clean it up
    const grade = (row.grade || '')
      .replace(/[\[\]]/g, '')
      .trim();

    const gradeAr = (row.grade_ar || '')
      .replace(/[\[\]]/g, '')
      .trim();

    // takhrij = reference source e.g. "[Agreed upon]" or "[Narrated by Bukhari]"
    const reference = (row.takhrij || '')
      .replace(/[\[\]]/g, '')
      .trim();

      batch.push({
        collection_id: collectionId,
        chapter_id: null,
        hadith_number: parseInt(row.id) || i + 1,
        arabic_text: row.hadith_text_ar || '',
        english_translation: row.hadith_text || '',
        urdu_translation: '',
        narrator: row.title || '',
        narrator_arabic: row.title_ar || '',
        grade: grade,
        grade_source: 'HadeethEnc.com',
        reference: reference || `HadeethEnc #${row.id}`,
        explanation: row.explanation || '',
        benefits: row.benefits || '',
        topic_tags: [],
        is_active: true,
      });

    if (batch.length >= BATCH_SIZE) {
      await flushBatch();
      process.stdout.write(
        `\r  📥 Inserted: ${totalInserted.toLocaleString()} / ${rows.length} | Skipped: ${totalSkipped}...`
      );
    }
  }

  await flushBatch();

  // Update total count
  await supabase
    .from('collections')
    .update({ total_hadiths: totalInserted })
    .eq('id', collectionId);

  console.log('\n\n======================================');
  console.log(`✅ Import complete!`);
  console.log(`📊 Total inserted: ${totalInserted.toLocaleString()}`);
  console.log(`⏭️  Skipped: ${totalSkipped}`);
  console.log(`\n🤲 Alhamdulillah — may Allah accept this work!`);
  console.log(`\n💡 Next: Download Urdu Excel and run again with the Urdu file`);
  console.log(`   to populate urdu_translation field for all hadiths.`);
};

main().catch(err => {
  console.error('\n❌ Fatal:', err.message);
  process.exit(1);
});
