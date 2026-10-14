import { deletePost, parsePostInput, updatePost } from "@/lib/posts";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const input = parsePostInput(await request.json().catch(() => null));
  if (!input) return Response.json({ error: "Title, category, and entry text are required." }, { status: 400 });
  const { id } = await params;
  const post = await updatePost(id, input);
  if (!post) return Response.json({ error: "Entry not found." }, { status: 404 });
  return Response.json(post);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!(await deletePost(id))) return Response.json({ error: "Entry not found." }, { status: 404 });
  return new Response(null, { status: 204 });
}