# syntax=docker/dockerfile:1
FROM golang:1.21 AS builder
WORKDIR /app

COPY go.mod ./
COPY go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o server ./cmd/api

FROM gcr.io/distroless/base-debian12
WORKDIR /app
COPY --from=builder /app/server ./server
COPY .env.example .env
EXPOSE 8080
ENTRYPOINT ["/app/server"]
