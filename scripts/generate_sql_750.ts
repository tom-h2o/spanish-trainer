import * as fs from 'fs';
import * as path from 'path';

// Define expected mapping from Category Name to Deck/Part (1-10)
const categoryToPartMapping: Record<string, number> = {
  "Top 100 High-Frequency Words": 1,
  "Essential Regular Verbs": 2,
  "Essential Irregular & Stem-Changing Verbs": 3,
  "Core Adjectives & Adverbs": 4,
  "Time, Numbers, & Calendar": 5,
  "People, Family, & Home": 6,
  "Food, Dining, & Travel": 7,
  "Health, Body & Emergencies": 8,
  "Common Connectors & Prepositions": 9,
  "Business, Study, & Tech Essentials": 10,
  "Travel, Environment & Additional Nouns": 10,
  "Colors & Basic Qualities": 10,
  "Final Extra Essential Words": 10
};

interface ParsedWord {
  en: string;
  es: string;
  type: string;
  ex: string;
  p: number;
}

function normalizeTitle(title: string) {
  return title.trim().replace(/^#+/, '').trim();
}

function buildSqlString() {
  const inputFilePath = path.join(__dirname, 'raw_750_words.txt');
  const sqlFilePath = path.join(__dirname, '../supabase_seed_words_750.sql');

  if (!fs.existsSync(inputFilePath)) {
    console.error("Input file not found at " + inputFilePath + ". Please generate the 750 raw words first.");
    process.exit(1);
  }

  const rawData = fs.readFileSync(inputFilePath, 'utf8');
  let currentCategory = "";
  const parsedWords: ParsedWord[] = [];

  const lines = rawData.split('\n');

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    // Detect Categories
    if (trimmedLine.startsWith('#')) {
      currentCategory = normalizeTitle(trimmedLine);
      if (!(currentCategory in categoryToPartMapping)) {
        console.warn('WARNING: Unrecognized category header found:', currentCategory);
        console.warn('Defaulting to Deck 10');
      }
      continue;
    }

    // Parse Data Rows: en|es|type|ex
    const parts = trimmedLine.split('|');
    if (parts.length >= 4) {
      const en = parts[0].trim();
      const es = parts[1].trim();
      const type = parts[2].trim();
      const ex = parts[3].trim();

      const deckPart = categoryToPartMapping[currentCategory] || 10;

      parsedWords.push({ en, es, type, ex, p: deckPart });
    }
  }

  if (parsedWords.length === 0) {
    console.error("Parsed 0 words. Check the format of raw_750_words.txt");
    return;
  }

  let sql = "-- Drop the existing table and recreate it to ensure a clean slate\n" +
    "DROP TABLE IF EXISTS public.words CASCADE;\n\n" +
    "-- Clear existing progress data since the word IDs will be completely remapped\n" +
    "TRUNCATE TABLE public.user_progress;\n\n" +
    "CREATE TABLE public.words (\n" +
    "    id SERIAL PRIMARY KEY,\n" +
    "    en TEXT NOT NULL,\n" +
    "    es TEXT NOT NULL,\n" +
    "    type TEXT,\n" +
    "    ex TEXT,\n" +
    "    p INTEGER DEFAULT 1,\n" +
    "    lvl INTEGER DEFAULT 0\n" +
    ");\n\n" +
    "-- Turn on Row Level Security\n" +
    "ALTER TABLE public.words ENABLE ROW LEVEL SECURITY;\n\n" +
    "-- Allow read access to all authenticated users\n" +
    "CREATE POLICY \"Enable read access for all authenticated users\"\n" +
    "ON public.words FOR SELECT\n" +
    "TO authenticated USING (true);\n\n" +
    "INSERT INTO public.words (en, es, type, ex, p, lvl) VALUES\n";

  const values = parsedWords.map(w => {
    // Escape single quotes for SQL
    const safeEn = w.en.replace(/'/g, "''");
    const safeEs = w.es.replace(/'/g, "''");
    const safeType = w.type.replace(/'/g, "''");
    const safeEx = w.ex.replace(/'/g, "''");

    return "  ('" + safeEn + "', '" + safeEs + "', '" + safeType + "', '" + safeEx + "', " + w.p + ", 0)";
  });

  sql += values.join(',\n') + ';\n\n';

  sql += "-- Explicitly drop the previous foreign key and recreate it to ensure it references the correct table\n" +
    "ALTER TABLE IF EXISTS public.user_progress\n" +
    "DROP CONSTRAINT IF EXISTS user_progress_word_id_fkey,\n" +
    "ADD CONSTRAINT user_progress_word_id_fkey \n" +
    "FOREIGN KEY (word_id) REFERENCES public.words(id) ON DELETE CASCADE;\n";

  fs.writeFileSync(sqlFilePath, sql, 'utf-8');
  console.log("✅ Database script generated at " + sqlFilePath + " with " + parsedWords.length + " highly-curated core fluency words.");
}

buildSqlString();
