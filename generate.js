

// If your Node.js version is older (<18), change these top lines:
// const fs = require("fs");
// const path = require("path");
import fs from "fs";
import path from "path";

// === CONFIG ===
const jsonPath = "./data/miscrits.json";
const templatePath = "./template/miscrit.html";
const outputBase = "./details/";
const baseURL = "https://luciferx86.github.io/details/";
const imageBase = "https://cdn.worldofmiscrits.com/miscrits/";

// === HELPERS ===
function escapeHtml(s) {
    if (s == null) return "";
    return String(s)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

function imageFileNameFor(name) {
    return (
        name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "_")
            .replace(/^_+|_+$/g, "") + "_back.png"
    );
}

// Remove any existing social meta tags
function stripSocialMeta(html) {
    return html.replace(
        /<meta[^>]*(?:property\s*=\s*['"]og:[^'"]*['"]|name\s*=\s*['"]twitter:[^'"]*['"])[^>]*>\s*/gi,
        ""
    );
}

function insertMetaBlock(templateHtml, metaBlock) {
    if (/<\/title>/i.test(templateHtml)) {
        return templateHtml.replace(/<\/title>/i, `</title>\n${metaBlock}`);
    }
    if (/<head[^>]*>/i.test(templateHtml)) {
        return templateHtml.replace(/<head[^>]*>/i, (m) => `${m}\n${metaBlock}`);
    }
    return metaBlock + "\n" + templateHtml;
}

// === MAIN ===
const rawTemplate = fs.readFileSync(templatePath, "utf8");
const items = JSON.parse(fs.readFileSync(jsonPath, "utf8"));

for (const miscrit of items) {
    const id = miscrit.id;
    const name = miscrit.names?.[0] || "Unknown Miscrit";
    const description = miscrit.descriptions?.[0] || "Description not available.";
    const imageName = imageFileNameFor(name);
    const imageUrl = `${imageBase}${imageName}`;
    const pageUrl = `${baseURL}${id}/`;

    const metaBlock = `
<!-- DYNAMIC META START -->
<meta property="og:title" content="${escapeHtml(name + " - Miscridex")}" />
<meta property="og:description" content="${escapeHtml(description)}" />
<meta property="og:image" content="${escapeHtml(imageUrl)}" />
<meta property="og:type" content="website" />
<meta property="og:url" content="${escapeHtml(pageUrl)}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${escapeHtml(name + " - Miscridex")}" />
<meta name="twitter:description" content="${escapeHtml(description)}" />
<meta name="twitter:image" content="${escapeHtml(imageUrl)}" />
<!-- DYNAMIC META END -->
`.trim();

    let html = stripSocialMeta(rawTemplate);

    html = html
        .replace(/<title>.*?<\/title>/is, `<title>${escapeHtml(name)} - Miscridex</title>`)
        .replace(/<h1>.*?<\/h1>/is, `<h1>${escapeHtml(name)} - Miscridex</h1>`)
        .replace(/<p>.*?<\/p>/is, `<p>${escapeHtml(description)}</p>`)
        .replace(
            /<img[^>]*src=(["'])(https?:\/\/cdn\.worldofmiscrits\.com\/miscrits\/[^"']*?_back\.png)\1[^>]*>/i,
            `<img alt="${escapeHtml(name)}" src="${escapeHtml(imageUrl)}" style="max-width: 300px;"/>`
        );

    html = insertMetaBlock(html, metaBlock);

    const dirPath = path.join(outputBase, String(id));
    fs.mkdirSync(dirPath, { recursive: true });
    fs.writeFileSync(path.join(dirPath, "index.html"), html, "utf8");

    console.log(`✅ Generated: ${dirPath}/index.html`);
}

console.log("\n🎉 All pages generated successfully with updated meta tags.");
