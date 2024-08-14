import json from "../inputs/assets.json" assert { type: "json" };
import fs from "node:fs/promises";

const formats = new Set();
json.assets.forEach(entry=>{
    try {
    formats.add(entry.fields.file.es.contentType)
    }
    catch(e) {
    }
})


const csv = Array.from(formats).sort().join('\n')
console.log(csv)

fs.writeFile('./export-assets-types.json', csv)