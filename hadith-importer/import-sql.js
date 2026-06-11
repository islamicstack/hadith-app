// ============================================================
// IslamicStack — HadithTable.sql → Supabase Importer v4
// Handles multi-row INSERT VALUES (one ( per line = one hadith)
// ============================================================

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const readline = require('readline');

const SUPABASE_URL = 'https://xxjbpxocmllnrpiaudnh.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4amJweG9jbWxsbnJwaWF1ZG5oIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTY2MTUxNSwiZXhwIjoyMDk1MjM3NTE1fQ.nImtV6OC9DaUbD4gepj3tsm4MOFoWGBTHa7uw975DAo';
const SQL_FILE = '/Users/zeshananis/Desktop/projects/islamicstack/HadithTable.sql';
const BATCH_SIZE = 200;

const COLLECTIONS = {
  'bukhari': { name: 'Sahih al-Bukhari', arabic: 'صحيح البخاري', order: 1 },
  'muslim': { name: 'Sahih Muslim', arabic: 'صحيح مسلم', order: 2 },
  'abudawud': { name: 'Sunan Abu Dawud', arabic: 'سنن أبي داود', order: 3 },
  'tirmidhi': { name: 'Jami at-Tirmidhi', arabic: 'جامع الترمذي', order: 4 },
  'nasai': { name: "Sunan an-Nasa'i", arabic: 'سنن النسائي', order: 5 },
  'ibnmajah': { name: 'Sunan Ibn Majah', arabic: 'سنن ابن ماجه', order: 6 },
};

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const stripTags = (str) => (str || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

// ============================================================
// Parse fields from a raw VALUES string (content inside outer parens)
// ============================================================
const parseFields = (raw) => {
  const fields = [];
  let i = 0;
  let current = '';
  let inString = false;

  while (i < raw.length) {
    const ch = raw[i];
    if (!inString) {
      if (ch === "'") { inString = true; i++; }
      else if (ch === ',') { fields.push(current.trim()); current = ''; i++; }
      else { current += ch; i++; }
    } else {
      if (ch === '\\') {
        const next = raw[i + 1];
        if (next === 'n') { current += '\n'; i += 2; }
        else if (next === 't') { current += '\t'; i += 2; }
        else { current += next; i += 2; }
      } else if (ch === "'" && raw[i + 1] === "'") {
        current += "'"; i += 2;
      } else if (ch === "'") {
        inString = false; i++;
      } else {
        current += ch; i++;
      }
    }
  }
  if (current.trim()) fields.push(current.trim());
  return fields;
};

// ============================================================
// Ensure collections exist
// ============================================================
const ensureCollections = async () => {
  console.log('\n📚 Setting up collections...');
  const { data: existing } = await supabase.from('collections').select('id, slug');
  const map = {};
  (existing || []).forEach(c => map[c.slug] = c.id);

  for (const [slug, col] of Object.entries(COLLECTIONS)) {
    if (map[slug]) { console.log(`  ⏭️  Exists: ${col.name}`); continue; }
    const { data, error } = await supabase
      .from('collections')
      .insert({
        name: col.name, slug, arabic_name: col.arabic,
        total_hadiths: 0, is_active: true, sort_order: col.order
      })
      .select('id').single();
    if (error) throw new Error(`Collection insert: ${error.message}`);
    map[slug] = data.id;
    console.log(`  ✅ Created: ${col.name}`);
  }
  return map;
};

// ============================================================
// MAIN — stream line by line, accumulate multi-line rows
// ============================================================
const main = async () => {
  console.log('🕌 IslamicStack — SQL Dump Importer v4');
  console.log('=======================================');

  if (!fs.existsSync(SQL_FILE)) {
    console.error(`❌ File not found: ${SQL_FILE}`); process.exit(1);
  }

  const collectionMap = await ensureCollections();
  const counts = {};
  Object.keys(COLLECTIONS).forEach(s => counts[s] = 0);

  let batch = [];
  let totalInserted = 0;
  let totalParsed = 0;
  let inInsertBlock = false;

  // Multi-line row accumulator
  let currentRow = '';
  let depth = 0;
  let inStr = false;

  const flushBatch = async () => {
    if (batch.length === 0) return;
    const { error } = await supabase.from('hadiths').upsert(batch, {
      onConflict: 'collection_id,hadith_number',
      ignoreDuplicates: true
    });
    if (error) {
      console.error(`\n❌ Insert FAILED: ${error.message}`);
      console.error(`   Details: ${error.details}`);
      process.exit(1);
    }
    totalInserted += batch.length;
    batch = [];
  };

  const processRow = async (rowContent) => {
    totalParsed++;
    const fields = parseFields(rowContent);
    if (fields.length < 13) return;

    const collection = fields[0];
    const collectionId = collectionMap[collection];
    if (!collectionId) return;

    const arabicText = (fields[9] || '').replace(/NULL/gi, '').trim();
    const englishText = (fields[13] || '').replace(/NULL/gi, '').trim();
    if (!englishText && !arabicText) return;

    const grade = (fields[14] || fields[10] || '').replace(/NULL/gi, '').trim();

    batch.push({
      collection_id: collectionId,
      chapter_id: null,
      hadith_number: parseInt(fields[5]) || 0,
      arabic_text: arabicText,
      english_translation: englishText,
      urdu_translation: '',
      narrator: stripTags(fields[12] || ''),
      narrator_arabic: stripTags(fields[8] || ''),
      grade: grade,
      grade_source: grade ? 'Sunnah.com' : '',
      reference: `${COLLECTIONS[collection]?.name || collection} ${fields[5]}`,
      topic_tags: [],
      is_active: true,
    });

    counts[collection] = (counts[collection] || 0) + 1;

    if (batch.length >= BATCH_SIZE) {
      await flushBatch();
      process.stdout.write(
        `\r  📥 Inserted: ${totalInserted.toLocaleString()} | ` +
        `Bukhari: ${counts.bukhari} Muslim: ${counts.muslim} ` +
        `AbuDawud: ${counts.abudawud} Tirmidhi: ${counts.tirmidhi}...`
      );
    }
  };

  console.log('\n📜 Streaming SQL file line by line...\n');

  const rl = readline.createInterface({
    input: fs.createReadStream(SQL_FILE, { encoding: 'utf8' }),
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    const trimmed = line.trim();

    // Detect start of INSERT block
    if (trimmed.startsWith('INSERT INTO `HadithTable` VALUES')) {
      inInsertBlock = true;
      currentRow = '';
      depth = 0;
      inStr = false;
      continue;
    }

    // End of INSERT block
    if (inInsertBlock && (trimmed === '' || trimmed.startsWith('--') || trimmed.startsWith('/*') || trimmed.startsWith('UNLOCK') || trimmed.startsWith('SET') || trimmed.startsWith('COMMIT'))) {
      if (currentRow.trim()) {
        // Process any remaining row
        const clean = currentRow.trim().replace(/^[,(]+/, '').replace(/[;,)]+$/, '').trim();
        if (clean) await processRow(clean);
        currentRow = '';
      }
      inInsertBlock = false;
      continue;
    }

    if (!inInsertBlock) continue;

    // Process character by character to find complete rows
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];

      if (!inStr) {
        if (ch === "'") { inStr = true; currentRow += ch; }
        else if (ch === '(') {
          depth++;
          if (depth === 1) {
            currentRow = ''; // start new row (skip the opening paren)
          } else {
            currentRow += ch;
          }
        } else if (ch === ')') {
          depth--;
          if (depth === 0) {
            // Complete row found!
            if (currentRow.trim()) {
              await processRow(currentRow.trim());
            }
            currentRow = '';
          } else {
            currentRow += ch;
          }
        } else {
          if (depth > 0) currentRow += ch;
        }
      } else {
        currentRow += ch;
        if (ch === '\\') {
          // next char is escaped — add it and skip
          i++;
          if (i < line.length) currentRow += line[i];
        } else if (ch === "'") {
          inStr = false;
        }
      }
    }
    // Add newline if we're mid-row (multi-line text fields)
    if (depth > 0) currentRow += '\n';
  }

  await flushBatch();

  // Update collection totals
  console.log('\n\n📊 Updating collection totals...');
  for (const [slug, count] of Object.entries(counts)) {
    if (!count) continue;
    await supabase.from('collections').update({ total_hadiths: count }).eq('id', collectionMap[slug]);
    console.log(`  ✅ ${COLLECTIONS[slug]?.name}: ${count.toLocaleString()} hadiths`);
  }

  console.log('\n=======================================');
  console.log(`✅ Import complete!`);
  console.log(`📊 Total parsed:   ${totalParsed.toLocaleString()}`);
  console.log(`📊 Total inserted: ${totalInserted.toLocaleString()}`);
  console.log(`\n🤲 Alhamdulillah — may Allah accept this work!`);
};

main().catch(err => {
  console.error('\n❌ Fatal:', err.message);
  process.exit(1);
});
