import fs from "fs";
import path from "path";

// === CONFIG ===
const jsonPath = "./data/miscrits.json";
const templatePath = "./template/miscrit.html";
const outputBase = "./details/";
const baseURL = "https://luciferx86.github.io/details/";
const imageBase = "https://cdn.worldofmiscrits.com/miscrits/";

// Standard level progression for abilities
const LEVEL_UNLOCKS = [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 30, 35];

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

// Ensure first letter is capitalized for classes
function capitalize(s) {
    if (!s) return "";
    return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

// Map generic stat text to a CSS class
function getStatClass(val) {
    if (!val) return "moderate";
    const v = val.toLowerCase();
    if (v === "max") return "max";
    if (v === "strong" || v === "high") return "strong";
    if (v === "weak" || v === "low") return "weak";
    return "moderate";
}

// === MAIN ===
const rawTemplate = fs.readFileSync(templatePath, "utf8");
const items = JSON.parse(fs.readFileSync(jsonPath, "utf8"));

for (const miscrit of items) {
    const id = miscrit.id;
    // We use the final evolution name for main display if we want, or the first. Let's use first as the primary ID name usually
    const name = miscrit.names?.[0] || "Unknown Miscrit";
    const finalName = miscrit.names?.[miscrit.names.length - 1] || name;
    
    const description = miscrit.descriptions?.[0] || "Description not available.";
    const imageName = imageFileNameFor(finalName);
    const imageUrl = `${imageBase}${imageName}`;
    const pageUrl = `${baseURL}${id}/`;

    // 1. Meta Tags
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

    // 2. Locations HTML
    let locationsHtml = "";
    if (miscrit.locations && typeof miscrit.locations === 'object') {
        const locs = Object.keys(miscrit.locations);
        if (locs.length > 0) {
            locationsHtml = locs.map(loc => `<div class="badge" style="border-color:#ccc; color:#ccc;">${escapeHtml(loc)}</div>`).join("");
        }
    }

    // 3. Stats HTML
    const statMapping = {
        "Health": miscrit.hp,
        "Speed": miscrit.spd,
        "Elemental Attack": miscrit.ea,
        "Physical Attack": miscrit.pa,
        "Elemental Defense": miscrit.ed,
        "Physical Defense": miscrit.pd
    };
    
    let statsHtml = "";
    for (const [sName, sVal] of Object.entries(statMapping)) {
        if (sVal) {
            statsHtml += `
            <div class="stat-card">
                <div class="stat-name">${sName}</div>
                <div class="stat-value ${getStatClass(sVal)}">${escapeHtml(sVal)}</div>
            </div>`;
        }
    }

    // 4. Evolutions HTML
    let evolutionsHtml = "";
    if (miscrit.names && miscrit.descriptions) {
        miscrit.names.forEach((evoName, idx) => {
            const evoDesc = miscrit.descriptions[idx] || "";
            evolutionsHtml += `
            <div class="evolution-card">
                <h3>${idx + 1}. ${escapeHtml(evoName)}</h3>
                <p>${escapeHtml(evoDesc)}</p>
            </div>`;
        });
    }

    // 5. Abilities HTML
    let abilitiesHtml = "";
    if (miscrit.ability_order && miscrit.abilities) {
        // Create a map of abilities by ID
        const abilityMap = {};
        miscrit.abilities.forEach(ab => { abilityMap[ab.id] = ab; });

        miscrit.ability_order.forEach((abId, idx) => {
            const ab = abilityMap[abId];
            if (ab) {
                const lvl = LEVEL_UNLOCKS[idx] || (idx * 3);
                const elemClass = ab.element ? ab.element.toLowerCase() : 'misc';
                const typeText = ab.type || 'Misc';
                
                let apAcc = "";
                if (ab.ap) apAcc += `AP: ${ab.ap}`;
                if (ab.accuracy) apAcc += (apAcc ? " / " : "") + `Acc: ${ab.accuracy}%`;
                
                let enchantDesc = ab.enchant_desc ? `<div style="color: #ff9800; font-size: 0.85rem; margin-top: 4px;">Enchant: ${escapeHtml(ab.enchant_desc)}</div>` : '';

                abilitiesHtml += `
                <tr>
                    <td><div class="tag">${lvl}</div></td>
                    <td>
                        <div class="ability-name">${escapeHtml(ab.name)}</div>
                        <div class="ability-desc">${escapeHtml(ab.desc || '')}</div>
                        ${enchantDesc}
                    </td>
                    <td>
                        <span class="tag ${elemClass}">${escapeHtml(ab.element || 'Misc')}</span>
                        <span class="tag">${escapeHtml(typeText)}</span>
                    </td>
                    <td style="white-space:nowrap; color:#aaa;">${escapeHtml(apAcc)}</td>
                    <td style="font-size: 0.85rem;">${ab.turns ? escapeHtml(ab.turns + ' turns') : '-'}</td>
                </tr>`;
            }
        });
    }

    // Construct final HTML
    let html = rawTemplate
        .replace(/{{NAME}}/g, escapeHtml(name))
        .replace(/{{ELEMENT}}/g, escapeHtml(miscrit.element || "Unknown"))
        .replace(/{{RARITY}}/g, escapeHtml(miscrit.rarity || "Unknown"))
        .replace(/{{IMAGE_URL}}/g, escapeHtml(imageUrl))
        .replace("{{META}}", metaBlock)
        .replace("{{LOCATIONS}}", locationsHtml)
        .replace("{{STATS}}", statsHtml)
        .replace("{{EVOLUTIONS}}", evolutionsHtml)
        .replace("{{ABILITIES}}", abilitiesHtml);

    const dirPath = path.join(outputBase, String(id));
    fs.mkdirSync(dirPath, { recursive: true });
    fs.writeFileSync(path.join(dirPath, "index.html"), html, "utf8");

    // Only log the first one or occasionally to avoid spam
    if (id === 1) {
        console.log(`✅ Generated Details For ID 1: ${dirPath}/index.html`);
    }
}

console.log("\n🎉 All 600+ pages generated successfully with rich content!");
