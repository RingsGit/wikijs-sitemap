
FROM node:19-bullseye 

RUN mkdir -p /wiki/sitemap/node_modules && chown -R node:node /wiki/sitemap

RUN apt-get update && apt-get install -y git

WORKDIR /wiki/sitemap

CMD ["bash"]