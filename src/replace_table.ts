#!/usr/bin/env -S deno run -A

import { DOMParser, Element } from "https://deno.land/x/deno_dom/deno-dom-wasm.ts";

const htmlContent = Deno.readTextFileSync(Deno.args[0]);

const document = new DOMParser().parseFromString(htmlContent, "text/html");

// Make sure the document was parsed correctly
if (document) {
  // Get all img elements
  const imgs = document.querySelectorAll("img");

  imgs.forEach((table) => {
    // Create a new image element
    const img = document.createElement("img") as Element;
    img.setAttribute("src", "image_placeholder.png"); // Set the image source
    img.setAttribute("alt", "Image Placeholder"); // Set the alt text

    // Replace the table with the new image element
    table.replaceWith(img);
  });

  // Get all table elements
  const tables = document.querySelectorAll("table");

  tables.forEach((table) => {
    // Create a new image element
    const img = document.createElement("img") as Element;
    img.setAttribute("src", "code_placeholder.png"); // Set the image source
    img.setAttribute("alt", "Code Placeholder"); // Set the alt text

    // Replace the table with the new image element
    table.replaceWith(img);
  });

  // Print out the updated HTML
  console.log(document.documentElement.outerHTML);
} else {
  console.error("Error parsing the HTML");
}
