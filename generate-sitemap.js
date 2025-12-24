const fs = require('fs');
const knex = require("knex");
const knexConfig = require('./config');
const path = require("path");
const db = knex(knexConfig);

async function generateSitemap() {

    try {
        const site_url = await db('settings')
            .select('*')
            .where('key', 'host')
            .first();

        let hostname = '';
        if (process.env.DB_TYPE.toLowerCase() === 'mariadb') {
            hostname = JSON.parse(site_url.value).v;
        } else {
            hostname = site_url.value.v;
        }

        const pages = await db('pages')
            .select('id', 'localeCode', 'path', 'title', 'isPrivate', 'isPublished', 'updatedAt')
            .where({isPrivate: false, isPublished: true});

        // --- modification start: blocklist ---
        let blockedIncludes = [];
        let blockedEndsWith = [];
        const blocklistPath = path.join(__dirname, 'blocklist.txt');
        
        try {
            if (fs.existsSync(blocklistPath)) {
                const fileContent = fs.readFileSync(blocklistPath, 'utf-8');
                const lines = fileContent.split('\n')
                    .map(line => line.trim())
                    .filter(line => line.length > 0);
                
                lines.forEach(line => {
                    const lowerLine = line.toLowerCase();
                    if (lowerLine.startsWith('include ')) {
                        blockedIncludes.push(lowerLine.substring(8).trim());
                    } else if (lowerLine.startsWith('endwith ')) {
                        blockedEndsWith.push(lowerLine.substring(8).trim());
                    }
                });
                
                if(blockedIncludes.length > 0 || blockedEndsWith.length > 0) {
                   console.log(`Loaded ${blockedIncludes.length} include rules and ${blockedEndsWith.length} endwith rules.`);
                }
            }
        } catch (err) {
            console.error('Error reading blocklist.txt:', err.message);
        }
        // --- modification end ---

        if (pages.length > 0) {
            let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n' +
                '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
                '<!-- Wiki.js sitemap generator by https://analog-ic.com -->\n';

            pages.forEach(function (page) {
                // --- modification start: keyword filtering ---
                const pagePath = (page.path || '').toLowerCase();

                // check if the page path matches any of the blocked rules
                const isBlocked = 
                    blockedIncludes.some(k => pagePath.includes(k)) ||
                    blockedEndsWith.some(k => pagePath.endsWith(k));

                if (isBlocked) {
                    // if the page is blocked, skip adding it to the sitemap
                    return; 
                }
                // --- modification end ---

                const page_url = hostname + "/" + page.path;
                const last_update = page.updatedAt;

                sitemap += '<url>\n' +
                    '    <loc>' + page_url + '</loc>\n' +
                    '    <lastmod>' + last_update + '</lastmod>\n' +
                    '  </url>\n';
            });

            sitemap += '</urlset>';

            const directoryPath = path.join(__dirname, 'static');

            if (!fs.existsSync(directoryPath)){
                fs.mkdirSync(directoryPath, { recursive: true });
            }

            fs.writeFileSync(path.join(directoryPath, 'sitemap.xml'), sitemap, 'utf-8');
        }

        // await db.destroy();
        console.log('Database connection kept alive for next cron job.');

    } catch (err) {
        throw new Error('Database connection error: ' + err.message);
    }
}

module.exports = generateSitemap;
