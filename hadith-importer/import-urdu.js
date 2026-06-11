// ============================================================
// IslamicStack — HadeethEnc Urdu → Supabase Urdu Translation
// Updates urdu_translation field for HadeethEnc collection
// ============================================================

const { createClient } = require('@supabase/supabase-js');
const XLSX = require('xlsx');

const SUPABASE_URL = 'https://xxjbpxocmllnrpiaudnh.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4amJweG9jbWxsbnJwaWF1ZG5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2NjE1MTUsImV4cCI6MjA5NTIzNzUxNX0.t8VgNOCXIr8gVKkZVRH5hQz6-BKCTIQVLW9Ii9sHqpg';
const EXCEL_FILE = '/Users/zeshananis/Desktop/projects/islamicstack/HadeethEnc.com_ur-v1.35.0.xlsx';
const HADEETHENC_COLLECTION_ID = 'c2b56579-098e-498b-b2ed-a100cea6b4ea';
const BATCH_SIZE = 100;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const main = async () => {
  console.log('🕌 IslamicStack — Urdu Translation Importer');
  console.log('============================================');

  // Read Urdu Excel
  console.log(`\n📂 Reading: ${EXCEL_FILE.split('/').pop()}`);
  const wb = XLSX.readFile(EXCEL_FILE);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { range: 1, defval: '' });
  console.log(`  ✅ Loaded ${rows.length} Urdu hadiths`);

  let totalUpdated = 0;
  let totalSkipped = 0;
  let batch = [];

  const flushBatch = async () => {
    if (batch.length === 0) return;
    // Update each row by hadith_number in HadeethEnc collection
    for (const item of batch) {
      const { error } = await supabase
        .from('hadiths')
        .update({ urdu_translation: item.urdu })
        .eq('collection_id', HADEETHENC_COLLECTION_ID)
        .eq('hadith_number', item.hadith_number);
      if (error) console.warn(`  ⚠️  Update warning: ${error.message}`);
      else totalUpdated++;
    }
    batch = [];
  };

  console.log('\n📜 Processing Urdu translations...\n');

  for (const row of rows) {
    if (!row.id || !row.hadith_text) { totalSkipped++; continue; }

    batch.push({
      hadith_number: parseInt(row.id),
      urdu: row.hadith_text || '',
    });

    if (batch.length >= BATCH_SIZE) {
      await flushBatch();
      process.stdout.write(`\r  📥 Updated: ${totalUpdated.toLocaleString()} | Skipped: ${totalSkipped}...`);
    }
  }

  await flushBatch();

  console.log('\n\n============================================');
  console.log(`✅ Urdu import complete!`);
  console.log(`📊 Total updated: ${totalUpdated.toLocaleString()}`);
  console.log(`⏭️  Skipped: ${totalSkipped}`);
  console.log(`\n🤲 Alhamdulillah — may Allah accept this work!`);
};

main().catch(err => {
  console.error('\n❌ Fatal:', err.message);
  process.exit(1);
});
