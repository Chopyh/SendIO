FROM node:24-alpine AS build

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@11.1.3 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build \
    && mkdir -p /tmp/nginx-root \
    && if [ -d dist/frontend/browser ]; then cp -a dist/frontend/browser/. /tmp/nginx-root/; \
       elif [ -d dist/frontend ]; then cp -a dist/frontend/. /tmp/nginx-root/; \
       else echo "Angular build output not found" && find dist -maxdepth 3 -type d && exit 1; fi

FROM nginx:1.29-alpine

COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /tmp/nginx-root/ /usr/share/nginx/html/

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
