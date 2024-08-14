import fs from "node:fs/promises";
import { rl } from "./utils.js";

const API_URL = "http://localhost:1337/api/articles"; // Ajusta esto a tu URL de Strapi y al endpoint correcto.
const FILE_PATH = "./data.json"; // La ruta a tu archivo JSON.

const STRAPI_ACCESS_TOKEN = process.env.STRAPI_ACCESS_TOKEN;

const log = {
  success: [],
  errors: []
}

loadData();
// Función para cargar el contenido del archivo JSON.
async function loadData() {
  const files = await fs.readdir("./inputs");
  files.forEach((file, index) => {
    console.log(`${index + 1} - ${file}`);
  });

  const answer = await rl.question("file number?: ");

  console.log("file is", files[answer - 1]);
  //return JSON.parse(data);
}

// Función para publicar un artículo a través de la API de Strapi.
const postEntry = async (entry) => {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${STRAPI_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({ data: entry }),
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }

    const responseData = await response.json();
    console.log("Artículo creado con éxito:", responseData);
  } catch (error) {
    console.error("Error al crear el artículo:", error);
  }
};

// Función principal para importar todos los artículos.
const importArticles = async () => {
  const articles = loadData();
  for (const article of articles) {
    await postArticle(article);
  }
};

//importArticles();

rl.close();
