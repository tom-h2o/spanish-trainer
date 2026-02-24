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
  conjugations?: string; // JSON string encoded
}

const irregularVerbs: Record<string, string[]> = {
  "ser": ["soy", "eres", "es", "somos", "sois", "son"],
  "estar": ["estoy", "estás", "está", "estamos", "estáis", "están"],
  "tener": ["tengo", "tienes", "tiene", "tenemos", "tenéis", "tienen"],
  "hacer": ["hago", "haces", "hace", "hacemos", "hacéis", "hacen"],
  "poder": ["puedo", "puedes", "puede", "podemos", "podéis", "pueden"],
  "decir": ["digo", "dices", "dice", "decimos", "decís", "dicen"],
  "ir": ["voy", "vas", "va", "vamos", "vais", "van"],
  "ver": ["veo", "ves", "ve", "vemos", "veis", "ven"],
  "dar": ["doy", "das", "da", "damos", "dais", "dan"],
  "saber": ["sé", "sabes", "sabe", "sabemos", "sabéis", "saben"],
  "querer": ["quiero", "quieres", "quiere", "queremos", "queréis", "quieren"],
  "pensar": ["pienso", "piensas", "piensa", "pensamos", "pensáis", "piensan"],
  "encontrar": ["encuentro", "encuentras", "encuentra", "encontramos", "encontráis", "encuentran"],
  "volver": ["vuelvo", "vuelves", "vuelve", "volvemos", "volvéis", "vuelven"],
  "salir": ["salgo", "sales", "sale", "salimos", "salís", "salen"],
  "conocer": ["conozco", "conoces", "conoce", "conocemos", "conocéis", "conocen"],
  "empezar": ["empiezo", "empiezas", "empieza", "empezamos", "empezáis", "empiezan"],
  "entender": ["entiendo", "entiendes", "entiende", "entendemos", "entendéis", "entienden"],
  "pedir": ["pido", "pides", "pide", "pedimos", "pedís", "piden"],
  "sentir": ["siento", "sientes", "siente", "sentimos", "sentís", "sienten"],
  "dormir": ["duermo", "duermes", "duerme", "dormimos", "dormís", "duermen"],
  "seguir": ["sigo", "sigues", "sigue", "seguimos", "seguís", "siguen"],
  "venir": ["vengo", "vienes", "viene", "venimos", "venís", "vienen"],
  "traer": ["traigo", "traes", "trae", "traemos", "traéis", "traen"],
  "poner": ["pongo", "pones", "pone", "ponemos", "ponéis", "ponen"],
  "jugar": ["juego", "juegas", "juega", "jugamos", "jugáis", "juegan"],
  "cerrar": ["cierro", "cierras", "cierra", "cerramos", "cerráis", "cierran"],
  "recordar": ["recuerdo", "recuerdas", "recuerda", "recordamos", "recordáis", "recuerdan"],
  "mostrar": ["muestro", "muestras", "muestra", "mostramos", "mostráis", "muestran"],
  "perder": ["pierdo", "pierdes", "pierde", "perdemos", "perdéis", "pierden"],
  "caer": ["caigo", "caes", "cae", "caemos", "caéis", "caen"],
  "oír": ["oigo", "oyes", "oye", "oímos", "oís", "oyen"],
  "conseguir": ["consigo", "consigues", "consigue", "conseguimos", "conseguís", "consiguen"],
  "servir": ["sirvo", "sirves", "sirve", "servimos", "servís", "sirven"],
  "repetir": ["repito", "repites", "repite", "repetimos", "repetís", "repiten"],
  "reír": ["río", "ríes", "ríe", "reímos", "reís", "ríen"],
  "costar": ["cuesto", "cuestas", "cuesta", "costamos", "costáis", "cuestan"],
  "medir": ["mido", "mides", "mide", "medimos", "medís", "miden"]
};

const irregularGerunds: Record<string, string> = {
  "ir": "yendo",
  "poder": "pudiendo",
  "decir": "diciendo",
  "pedir": "pidiendo",
  "sentir": "sintiendo",
  "dormir": "durmiendo",
  "seguir": "siguiendo",
  "venir": "viniendo",
  "traer": "trayendo",
  "caer": "cayendo",
  "oír": "oyendo",
  "conseguir": "consiguiendo",
  "servir": "sirviendo",
  "repetir": "repitiendo",
  "reír": "riendo",
  "medir": "midiendo",
  "leer": "leyendo",
  "creer": "creyendo",
  "construir": "construyendo",
  "huir": "huyendo"
};

function conjugateRegular(verb: string) {
  const stem = verb.slice(0, -2);
  const ending = verb.slice(-2);
  if (ending === 'ar') return [stem + 'o', stem + 'as', stem + 'a', stem + 'amos', stem + 'áis', stem + 'an'];
  if (ending === 'er') return [stem + 'o', stem + 'es', stem + 'e', stem + 'emos', stem + 'éis', stem + 'en'];
  if (ending === 'ir') return [stem + 'o', stem + 'es', stem + 'e', stem + 'imos', stem + 'ís', stem + 'en'];
  return null;
}

function getGerundio(verb: string) {
  if (irregularGerunds[verb]) return irregularGerunds[verb];

  const stem = verb.slice(0, -2);
  const ending = verb.slice(-2);
  if (ending === 'ar') return stem + 'ando';
  if (ending === 'er' || ending === 'ir') return stem + 'iendo';
  return '';
}

function getConjugationJSON(verb: string) {
  // Extract just the main verb if it has multiple like "ser/estar" or "comprar (algo)"
  const cleanVerb = verb.split('/')[0].split(' ')[0].trim().toLowerCase();

  let conjugations = irregularVerbs[cleanVerb];
  if (!conjugations) {
    conjugations = conjugateRegular(cleanVerb) || [];
  }

  if (conjugations.length === 6) {
    return JSON.stringify({
      yo: conjugations[0],
      tu: conjugations[1],
      el: conjugations[2],
      nosotros: conjugations[3],
      vosotros: conjugations[4],
      ellos: conjugations[5],
      gerundio: getGerundio(cleanVerb)
    });
  }
  return "null";
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

      let conjugations = "null";
      if (type.includes("verb") || type === "verb") {
        conjugations = getConjugationJSON(en); // 'en' variable holds the Spanish word because parts[0] is Spanish
      }

      parsedWords.push({ en, es, type, ex, p: deckPart, conjugations });
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
    "    lvl INTEGER DEFAULT 0,\n" +
    "    conjugations JSONB\n" +
    ");\n\n" +
    "-- Turn on Row Level Security\n" +
    "ALTER TABLE public.words ENABLE ROW LEVEL SECURITY;\n\n" +
    "-- Allow read access to all authenticated users\n" +
    "CREATE POLICY \"Enable read access for all authenticated users\"\n" +
    "ON public.words FOR SELECT\n" +
    "TO authenticated USING (true);\n\n" +
    "INSERT INTO public.words (en, es, type, ex, p, lvl, conjugations) VALUES\n";

  const values = parsedWords.map(w => {
    // Escape single quotes for SQL
    const safeEn = w.en.replace(/'/g, "''");
    const safeEs = w.es.replace(/'/g, "''");
    const safeType = w.type.replace(/'/g, "''");
    const safeEx = w.ex.replace(/'/g, "''");

    let conjEscaped = "NULL";
    if (w.conjugations && w.conjugations !== "null") {
      conjEscaped = "'" + w.conjugations.replace(/'/g, "''") + "'::jsonb";
    }

    return "  ('" + safeEn + "', '" + safeEs + "', '" + safeType + "', '" + safeEx + "', " + w.p + ", 0, " + conjEscaped + ")";
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
