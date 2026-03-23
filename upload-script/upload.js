const admin = require("firebase-admin");
const csv = require("csv-parser");
const fs = require("fs");
const path = require("path");

// ---- CONFIGURACION ----
// Ruta al archivo de credenciales descargado desde Firebase Console
// (Configuracion del proyecto > Cuentas de servicio > Generar nueva clave privada)
const SERVICE_ACCOUNT_PATH = path.join(__dirname, "serviceAccountKey.json");
const CSV_PATH = path.join(__dirname, "..", "Video_Games_Sales_Cleaned.csv");
const COLLECTION_NAME = "videogames";
const BATCH_SIZE = 400; // Firestore permite max 500 operaciones por batch

// Inicializar Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(require(SERVICE_ACCOUNT_PATH)),
});

const db = admin.firestore();

async function uploadCSV() {
  const records = [];

  // Leer CSV
  await new Promise((resolve, reject) => {
    fs.createReadStream(CSV_PATH)
      .pipe(csv())
      .on("data", (row) => {
        records.push({
          title: row.title || "",
          console: row.console || "",
          genre: row.genre || "",
          publisher: row.publisher || "",
          developer: row.developer || "",
          critic_score: parseFloat(row.critic_score) || 0,
          total_sales: parseFloat(row.total_sales) || 0,
          release_year: parseInt(row.release_year) || 0,
        });
      })
      .on("end", resolve)
      .on("error", reject);
  });

  console.log(`Se leyeron ${records.length} registros del CSV.`);
  console.log("Iniciando carga a Firestore...\n");

  // Subir en batches
  let uploaded = 0;
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = db.batch();
    const chunk = records.slice(i, i + BATCH_SIZE);

    chunk.forEach((record, index) => {
      const docId = String(i + index + 1); // ID numerico secuencial
      const docRef = db.collection(COLLECTION_NAME).doc(docId);
      batch.set(docRef, { ...record, id: parseInt(docId) });
    });

    await batch.commit();
    uploaded += chunk.length;
    const percent = ((uploaded / records.length) * 100).toFixed(1);
    process.stdout.write(`\rProgreso: ${uploaded}/${records.length} (${percent}%)`);
  }

  console.log("\n\nCarga completada exitosamente!");
  console.log(`Total de documentos subidos: ${uploaded}`);
  console.log(`Coleccion: ${COLLECTION_NAME}`);
}

uploadCSV().catch((err) => {
  console.error("Error durante la carga:", err);
  process.exit(1);
});
