# Margin

A small, local-first blog notebook. Create, read, edit, and delete entries in the browser; the Node.js server saves them to `data/posts.json` in this repository.

## Run

Install dependencies once with `npm install`, then start the development app with:

```bash
npm run blog
```

This starts Next.js in development mode with hot reload and opens [http://localhost:3000](http://localhost:3000) in your browser. Stop the server with `Ctrl+C`.

To build and run the production app instead, use `npm run blog:prod`. For a build without starting the server, use `npm run build`.

## Data

Entries are written to `data/posts.json` when the first post is created. Keep this file to preserve your posts and back it up like any other local document. Deployments with ephemeral filesystems will not provide durable storage.
