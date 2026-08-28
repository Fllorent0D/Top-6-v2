FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000

COPY server.mjs realtime-channel.js style.css ./
COPY index1.html index2.html index3.html joueurs.html remise-prix.html control.html ./
COPY logo.png top-6-verviers.png nat.jpg nat.png ./
COPY p1.jpg p1.png p2.jpg p2.png p3.jpg p3.png p4.jpg p4.png p5.jpg p5.png ./
COPY sponsor1.jpg sponsor1.png sponsor2.jpg sponsor3.jpg sponsor4.png sponsor5.png sponsor6.png ./

EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -qO- http://127.0.0.1:3000/health >/dev/null || exit 1

CMD ["node", "server.mjs"]
