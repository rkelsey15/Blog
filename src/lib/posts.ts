import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

export type Post = {
  id: string;
  title: string;
  category: string;
  excerpt: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export type PostInput = Pick<Post, "title" | "category" | "excerpt" | "content">;

const postsPath = join(process.cwd(), "data", "posts.json");
let writeQueue = Promise.resolve();

export function parsePostInput(value: unknown): PostInput | null {
  if (!value || typeof value !== "object") return null;
  const post = value as Record<string, unknown>;
  if (typeof post.title !== "string" || typeof post.category !== "string" || typeof post.excerpt !== "string" || typeof post.content !== "string" || !post.title.trim() || !post.category.trim() || !post.content.trim()) return null;
  return { title: post.title.trim(), category: post.category.trim(), excerpt: post.excerpt.trim(), content: post.content.trim() };
}

async function readPosts(): Promise<Post[]> {
  await mkdir(dirname(postsPath), { recursive: true });
  try {
    return JSON.parse(await readFile(postsPath, "utf8")) as Post[];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

async function writePosts(posts: Post[]) {
  const temporaryPath = `${postsPath}.tmp`;
  await writeFile(temporaryPath, JSON.stringify(posts, null, 2), "utf8");
  await rename(temporaryPath, postsPath);
}

function serializeWrite<T>(operation: () => Promise<T>): Promise<T> {
  const result = writeQueue.then(operation, operation);
  writeQueue = result.then(() => undefined, () => undefined);
  return result;
}

export async function getPosts() {
  return readPosts();
}

export function createPost(input: PostInput) {
  return serializeWrite(async () => {
    const now = new Date().toISOString();
    const post: Post = { ...input, id: randomUUID(), createdAt: now, updatedAt: now };
    await writePosts([post, ...(await readPosts())]);
    return post;
  });
}

export function updatePost(id: string, input: PostInput) {
  return serializeWrite(async () => {
    const posts = await readPosts();
    const index = posts.findIndex((post) => post.id === id);
    if (index === -1) return null;
    const post = { ...posts[index], ...input, updatedAt: new Date().toISOString() };
    posts[index] = post;
    await writePosts(posts);
    return post;
  });
}

export function deletePost(id: string) {
  return serializeWrite(async () => {
    const posts = await readPosts();
    const remaining = posts.filter((post) => post.id !== id);
    if (remaining.length === posts.length) return false;
    await writePosts(remaining);
    return true;
  });
}