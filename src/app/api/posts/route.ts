import { createPost, getPosts, parsePostInput } from "@/lib/posts";

export async function GET() {
  return Response.json(await getPosts(), { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const input = parsePostInput(await request.json().catch(() => null));
  if (!input) return Response.json({ error: "Title, category, and entry text are required." }, { status: 400 });
  return Response.json(await createPost(input), { status: 201 });
}