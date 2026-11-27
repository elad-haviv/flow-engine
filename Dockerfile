# Placeholder deployment shell. Phase 0 replaces this with the built web app.
FROM nginx:alpine
COPY apps/web/public/ /usr/share/nginx/html/
EXPOSE 80
