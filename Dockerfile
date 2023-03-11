FROM node:alpine as base

WORKDIR /app

COPY ./client ./

RUN npm i -g pnpm

RUN pnpm i

RUN pnpm run build

FROM golang

WORKDIR /app

COPY ./server ./
RUN go build main.go

COPY --from=base /app/out ./out

ENTRYPOINT ["./main"]
