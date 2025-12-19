### Wiki.js Sitemap Generator (Enhanced Edition)

This software allows you to generate a sitemap for your Wiki.js instance.

**This is a modified version of the original hostwiki/wikijs-sitemap.**

It supports Postgres, MySQL, and MariaDB.

You can run it as a standalone Node.js program or within a Docker container.

#### Key Enhancements in this Version:
* **Configurable Schedule:** You can now set the update frequency via environment variables (default is every 2 hours).
* **Keyword Blocking:** Exclude specific pages from the sitemap by keywords using a `blocklist.txt` file.
* **Stability Fix:** Fixed a bug in the original code where the database connection would close after the first run, preventing the Cron job from running continuously.
* **Node.js 20:** Updated base image to Node.js 20 Alpine.

#### How it works:
1.  It connects to your Wiki.js database.
2.  It filters out pages matching keywords in your `blocklist.txt`.
3.  It generates a sitemap for public posts.

#### Demo
You can view a demo of the sitemap on the following Wiki.js site: https://testwiki.hostwiki.io  
The sitemap can be accessed at: https://testwiki.hostwiki.io/sitemap.xml

#### Limitations
-   Does not handle splitting the sitemap in the event of exceeding the 50,000 URL limit for sitemaps.

#### Requirements
-   Wiki.js (with Postgres, MySQL or MariaDB)
-   Reverse proxy (e.g Nginx, Apache)

To use, you must be serving your Wiki.js instance over a reverse proxy server.

### Installation

#### .env config file content
The service is exposed via port 3012 to avoid any port conflicts with Wiki.js.

#### Standalone Nodejs
Edit the `.env` to include your database credential.  

```bash
git clone https://github.com/RingsGit/wikijs-sitemap
```

open directory in **VSCode** and reopen in container

Start the server with 
```bash
node server
```  

To keep the nodejs program running, you can use `pm2` or run it as a service.

#### Docker
Make sure to pass the correct environment variables.  
The `DB_TYPE` accepts `postgres`, `mysql` and `mariadb` as possible values. It defaults to `postgres` if not set.  
You use `DB_PASS` or `DB_PASS_FILE` to set your database password.  
```
-e DB_TYPE=postgres
-e DB_HOST=
-e DB_PORT=
-e DB_PASS=
-e DB_USER=
-e DB_NAME=
```

##### Docker Compose
You can find a Docker Compose examples for Postgres and MySQL in the `example` directory.  

#### Docker create
If you wish to run it via docker create:   
```bash
docker create --name=wikijs-sitemap -e DB_TYPE=postgres -e DB_HOST=db -e DB_PORT=5432 -e DB_PASS_FILE=/etc/wiki/.db-secret -v /etc/wiki/.db-secret:/etc/wiki/.db-secret:ro -e DB_USER=wiki -e DB_NAME=wiki --restart=unless-stopped --network=wikinet -p 3012:3012 hostwiki/wikijs-sitemap:latest
```  
```bash
docker start wikijs-sitemap
````  

#### Docker run
If you wish to run it via docker run:  
```bash
docker run --name wikijs-sitemap -e DB_TYPE=postgres -e DB_HOST=db -e DB_PORT=5432 -e DB_PASS_FILE=/etc/wiki/.db-secret -v /etc/wiki/.db-secret:/etc/wiki/.db-secret:ro -e DB_USER=wiki -e DB_NAME=wiki --restart=unless-stopped --network=wikinet -p 3012:3012 -d hostwiki/wikijs-sitemap:latest
```

After a successful setup, the sitemap will be available at `localhost:3012/sitemap.xml`.
Next, you have to proxy it via a reverse proxy server like Nginx or Apache.

#### Reverse proxy configuration for Nginx

```
location /sitemap.xml {
    proxy_pass http://127.0.0.1:3012/sitemap.xml;
    proxy_http_version 1.1;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $http_host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

#### Reverse proxy configuration for Apache
Make sure to install the necessary Apache mods.  

```bash
sudo a2enmod proxy proxy_http
```

Then add this to your Wiki.js apache configuration file.  
```
ProxyPreserveHost On
ProxyPass /sitemap.xml http://localhost:3012/sitemap.xml
ProxyPassReverse /sitemap.xml http://localhost:3012/sitemap.xml
```