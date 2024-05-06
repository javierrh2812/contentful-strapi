import contentfulContentModel from "../inputs/content-model.json" assert { type: "json" };
import fs from "node:fs/promises";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
const rl = readline.createInterface({ input, output });

const { contentTypes } = contentfulContentModel;

console.log("Reading content-types... \n");

for (const contentType of contentTypes) {
  console.log(`\nMigrating ${contentType.name} : `);
  // const type = await rl.question(
  //   "\n Component (C) / Collection Type (CT) / Single Type (ST): "
  // );
  const type = 'C'
  const schema = transformFromContentfulToStrapi(contentType, type);
  //console.log('writing schema.json ...')
  await writeStrapiSchema(contentType.name, schema, type);
}

rl.close();

function transformFromContentfulToStrapi(contentType, type) {
  const schema = {
    collectionName: contentType.name.replaceAll("-", "_") + "s",
    info: {
      displayName: contentType.name,
      description: contentType.description,
    },
    options: {},
    atttributes: {},
  };

  if (type === "CT") {
    schema.kind = "collectionType";
  } else if (type === "ST") {
    schema.kind = "singleType";
  }

  if (type !== "C") {
    schema.info.pluralName = contentType.name + "s";
    schema.info.singularName = contentType.name;
    schema.options.draftAndPublish = true;
  } else {
    schema.collectionName = "components_" + schema.collectionName;
  }

  contentType.fields.forEach((field) => {
    schema.atttributes[field.id] =
      transformContentfulFieldToStrapiAttribute(field);
  });

  //console.log(JSON.stringify(schema, null, 2));

  return schema;
}

async function writeStrapiSchema(contentTypeName, schema, type) {
  const folder = type === "C" ? "components" : "api";
  fs.writeFile(
    `./outputs/${folder}/${contentTypeName}.json`,
    JSON.stringify(schema, null, 2)
  );
}

function transformContentfulFieldToStrapiAttribute(field) {
  const attribute = {};

  const typesMap = {
    Symbol: "string",
    Boolean: "boolean",
    Object: "json",
    Text: "text",
    Array: "array",
    Integer: "integer",
    Number: "float",
    Date: "datetime",
    Location: 'json'
  };

  if (!typesMap[field.type] && field.type !== "Link") {
    console.error("No existe configuración para ", field.type);
  }
  attribute.type = typesMap[field.type];

  if (field.required) attribute.required = true;

  field.validations?.forEach((validation) => {
    if (validation.unique) attribute.unique = true;

    if (validation.size) {
      const { min, max } = validation.size;
      if (field.type === "Symbol" || field.type === "Text") {
        attribute.minLength = min;
        attribute.maxLength = max;
      }
    }

    if (validation.range) {
      const { min, max } = validation.range;
      attribute.min = min;
      attribute.max = max;
    }
  });

  switch (field.type) {
    case "Array":
      const { items } = field;
      if (items?.type === "Link" && items?.linkType === "Entry") {
        items.validations.forEach((validation) => {
          if (validation.linkContentType?.length > 1) {
            attribute.type = "dynamiczone";
            attribute.components = validation.linkContentType;
          } else {
            attribute.type = "component";
            attribute.repeatable = true;
            attribute.component = validation.linkContentType[0];
          }
        });
      }

      if (items?.type === "Link" && items?.linkType === "Asset") {
        attribute.type = "Media";
        attribute.multiple = true;

        items.validations.forEach((validation) => {
          if (validation.linkMimetypeGroup?.includes("image")) {
            attribute.allowedTypes = ["images"];
          }
        });
      }

      if (items?.type === "Symbol") {
        attribute.type = "enumeration";

        if (items.validations.length) {
          items.validations.forEach((validation) => {
            if (validation.in) attribute.enum = validation.in;
          });
        } else {
          // un array de strings puede ser un json (strapi no soporta array de strings dinamicos (validar))
          attribute.type = "json";
        }
      }

      break;

    case "Link":
      if (field.linkType === "Asset") {
        attribute.type = "media";
        attribute.allowedTypes = [];
        field.validations.forEach((validation) => {
          if (validation.linkMimetypeGroup?.includes("image")) {
            attribute.allowedTypes.push("images");
          }
          if (validation.linkMimetypeGroup?.includes("video")) {
            attribute.allowedTypes.push("videos");
          }
          if (validation.linkMimetypeGroup?.includes("pdfdocument")) {
            attribute.allowedTypes.push("files");
          }
        });
      } else if (field.linkType === "Entry") {
        // esta relacion puede ser de componente o relation one to one
        field.validations.forEach((validation) => {
          if (validation.linkContentType?.length > 1) {
            attribute.type = "dynamiczone";
            attribute.components = validation.linkContentType;
          } else {
            attribute.type = "component";
            attribute.repeatable = false;
            attribute.component = validation.linkContentType[0];
          }
        });
      }
      break;
    default:
      break;
  }

  if (field.type === 'Link') {
    console.log('Tipo link migrado a ', attribute.type)
  }

  return attribute;
}

/**
 * 
 * {
  "collectionName": "components_elements_images",
  "info": {
    "displayName": "Image",
    "description": ""
  },
  "options": {},
  "attributes": {
    "title": {
      "type": "string"
    },
    "height": {
      "type": "string"
    },
    "width": {
      "type": "string"
    },
    "image": {
      "type": "media",
      "multiple": false,
      "required": false,
      "allowedTypes": ["images", "files", "videos", "audios"]
    },
    "link": {
      "type": "string"
    },
    "align": {
      "type": "enumeration",
      "enum": ["start", "center", "end"],
      "default": "center"
    },
    "marginTop": {
      "type": "string"
    },
    "marginBottom": {
      "type": "string"
    },
    "marginLeft": {
      "type": "string"
    },
    "marginRight": {
      "type": "string"
    }
  }
}

 * **/

/**
 * {
  "kind": "collectionType",
  "collectionName": "pages",
  "info": {
    "singularName": "page",
    "pluralName": "pages",
    "displayName": "Page",
    "description": ""
  },
  "options": {
    "draftAndPublish": true
  },
  "pluginOptions": {},
  "attributes": {
    "slug": {
      "type": "string",
      "unique": true,
      "required": true,
      "regex": "^\\/"
    },
    "blocks": {
      "type": "dynamiczone",
      "components": [
        "elements.banner",
        "elements.rich-text",
        "elements.articles-list",
        "elements.slider-item",
        "elements.carousel",
        "elements.divider",
        "elements.iframe",
        "elements.image",
        "elements.video",
        "elements.card-grid",
        "elements.title",
        "elements.button",
        "elements.form",
        "elements.button-grid",
        "elements.banner-investors",
        "elements.dialog-container",
        "templates.share-holder-meetings-container",
        "templates.table-list-files"
      ]
    },
    "index": {
      "type": "component",
      "repeatable": false,
      "component": "layout.index"
    },
    "firstBlock": {
      "type": "dynamiczone",
      "components": ["elements.banner"]
    },
    "seo": {
      "type": "component",
      "repeatable": false,
      "component": "shared.seo"
    }
  }
}

 * 
 * **/
