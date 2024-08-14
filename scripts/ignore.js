import richtext from "../inputs/ml-rich.json" assert { type: "json" };
import fs from "node:fs/promises";

const regex = /<img\s+[^>]*src="([^"]*)"[^>]*>/g;
const baseCTF = 'https://app.contentful.com/spaces/j1bxozgharz5/entries/'

const imgs = [['image, entryId', 'tag']]
richtext.entries.forEach(entry=>{

    const matches = Array.from((entry.fields.text?.es ?? '')?.matchAll(regex))

    matches.forEach(match=>{
        match[0].split(' ').forEach(st=>{
            if (st.startsWith('src')) {
             imgs.push([st, `${baseCTF}${entry.sys.id}`, entry.metadata.tags[0]?.sys.id ?? '' ])
            }
        })
    })

})


const csv = imgs.map(row => row.join(', ')).join('\n')

fs.writeFile('./export2.csv', csv)