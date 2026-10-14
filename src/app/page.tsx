"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import type { Post } from "@/lib/posts";

type PostForm = Pick<Post, "title" | "category" | "excerpt" | "content">;
const blankPost: PostForm = { title: "", category: "Notes", excerpt: "", content: "" };

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Post | null>(null);
  const [form, setForm] = useState<PostForm>(blankPost);
  const [error, setError] = useState("");

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("margin-theme");
    document.documentElement.dataset.theme = savedTheme === "dark" ? "dark" : "light";
  }, []);

  function toggleTheme() {
    const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem("margin-theme", nextTheme);
  }

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/posts", { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Posts could not be loaded.");
        return response.json() as Promise<Post[]>;
      })
      .then((data) => { setPosts(data); setSelectedId(data[0]?.id ?? null); })
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : "Something went wrong.");
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);

  const visiblePosts = posts.filter((post) => `${post.title} ${post.category} ${post.excerpt}`.toLowerCase().includes(query.toLowerCase()));
  const selected = posts.find((post) => post.id === selectedId) ?? null;

  function openEditor(post: Post | null) {
    setError("");
    setEditing(post);
    setForm(post ? { title: post.title, category: post.category, excerpt: post.excerpt, content: post.content } : blankPost);
    setEditorOpen(true);
  }

  async function savePost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const response = await fetch(editing ? `/api/posts/${editing.id}` : "/api/posts", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = (await response.json()) as Post | { error?: string };
      if (!response.ok || !("id" in result)) throw new Error("error" in result ? result.error : "Could not save this entry.");
      setPosts((current) => editing ? current.map((post) => post.id === result.id ? result : post) : [result, ...current]);
      setSelectedId(result.id);
      setEditorOpen(false);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not save this entry.");
    } finally {
      setSaving(false);
    }
  }

  async function removePost(post: Post) {
    if (!window.confirm(`Delete “${post.title}”? This cannot be undone.`)) return;
    setError("");
    try {
      const response = await fetch(`/api/posts/${post.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Could not delete this entry.");
      const remaining = posts.filter((item) => item.id !== post.id);
      setPosts(remaining);
      setSelectedId(remaining[0]?.id ?? null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not delete this entry.");
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <Link className="wordmark" href="/" aria-label="Margin home"><span className="wordmark-mark">m</span> margin</Link>
        <div className="topbar-tools"><button aria-label="Toggle light/dark mode" className="theme-toggle" onClick={toggleTheme} title="Toggle light/dark mode" type="button"><span aria-hidden="true">◐</span></button><div className="topbar-status"><span /> Your private notebook</div></div>
      </header>
      <section className="intro">
        <div><p className="eyebrow">THE WRITING ROOM <span>/</span> 01</p><h1>Good ideas deserve<br />a place to <em>land.</em></h1></div>
        <p className="intro-note">A quiet corner for the things<br className="desktop-break" /> you want to remember.</p>
      </section>
      {error && !editorOpen && <p className="notice" role="alert">{error}</p>}

      <section className="workspace" aria-label="Blog posts">
        <aside className="library">
          <div className="library-heading"><div><p className="eyebrow">YOUR LIBRARY</p><h2>Entries <span>{posts.length.toString().padStart(2, "0")}</span></h2></div><button className="new-button" onClick={() => openEditor(null)} type="button"><span aria-hidden="true">+</span> New entry</button></div>
          <label className="search-box"><span className="search-icon" aria-hidden="true">⌕</span><input aria-label="Search entries" onChange={(event) => setQuery(event.target.value)} placeholder="Find a thought..." type="search" value={query} /><span className="search-shortcut">↵</span></label>
          <div className="post-list" aria-live="polite">
            {loading ? <p className="list-message">Gathering your words...</p> : visiblePosts.length ? visiblePosts.map((post, index) => (
              <button aria-current={post.id === selectedId ? "true" : undefined} className={`post-row${post.id === selectedId ? " is-selected" : ""}`} key={post.id} onClick={() => setSelectedId(post.id)} type="button">
                <span className="post-row-top"><span className={`category-dot dot-${index % 3}`} /><span className="post-category">{post.category}</span><time dateTime={post.updatedAt}>{formatDate(post.updatedAt)}</time></span>
                <strong>{post.title}</strong><span className="post-excerpt">{post.excerpt || post.content}</span>
              </button>
            )) : <div className="list-message empty-list"><span className="empty-mark" aria-hidden="true">✳</span><p>{query ? "No entries found. Try another search." : "Your next good idea starts here."}</p>{!query && <button onClick={() => openEditor(null)} type="button">Write your first entry <span aria-hidden="true">↗</span></button>}</div>}
          </div>
          <p className="library-foot">SAVED ON THIS DEVICE <span>↗</span></p>
        </aside>

        <article className="reading-pane">
          {selected ? <>
            <div className="reading-toolbar"><span className="reading-label"><span /> READING ROOM</span><div className="post-actions"><button className="text-action" onClick={() => openEditor(selected)} type="button">Edit <span aria-hidden="true">↗</span></button><button className="text-action delete-action" onClick={() => void removePost(selected)} type="button">Delete</button></div></div>
            <div className="article-content"><div className="article-meta"><span className="category-pill">{selected.category}</span><time dateTime={selected.updatedAt}>UPDATED {formatDate(selected.updatedAt).toUpperCase()}</time></div><h2>{selected.title}</h2>{selected.excerpt && <p className="article-deck">{selected.excerpt}</p>}<div className="article-rule"><span>✳</span></div><div className="article-body">{selected.content}</div><p className="article-end">— End of entry —</p></div>
          </> : <div className="welcome-state"><span className="welcome-symbol" aria-hidden="true">✳</span><p className="eyebrow">A LITTLE SPACE TO THINK</p><h2>Start with a<br /><em>single sentence.</em></h2><p>Your entries stay right here, on your device.</p><button className="new-button" onClick={() => openEditor(null)} type="button"><span aria-hidden="true">+</span> Write an entry</button></div>}
        </article>
      </section>

      {editorOpen && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setEditorOpen(false); }}>
        <section aria-labelledby="editor-title" aria-modal="true" className="editor-modal" role="dialog">
          <div className="editor-heading"><div><p className="eyebrow">{editing ? "REFINE YOUR THOUGHT" : "MAKE A NOTE"}</p><h2 id="editor-title">{editing ? "Edit entry" : "A new entry"}</h2></div><button aria-label="Close editor" className="close-button" onClick={() => setEditorOpen(false)} type="button">×</button></div>
          <form className="editor-form" onSubmit={savePost}>
            <label>Title<input autoFocus maxLength={140} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Give this thought a name" required value={form.title} /></label>
            <label>Category<input maxLength={40} onChange={(event) => setForm({ ...form, category: event.target.value })} placeholder="Notes" required value={form.category} /></label>
            <label>Short introduction<textarea maxLength={240} onChange={(event) => setForm({ ...form, excerpt: event.target.value })} placeholder="A line to set the scene..." rows={2} value={form.excerpt} /></label>
            <label>Your entry<textarea className="content-input" onChange={(event) => setForm({ ...form, content: event.target.value })} placeholder="Let the thought unfold..." required rows={7} value={form.content} /></label>
            {error && <p className="form-error" role="alert">{error}</p>}
            <div className="editor-footer"><p>Saved to your local notebook when published.</p><button className="publish-button" disabled={saving} type="submit">{saving ? "Saving..." : editing ? "Save changes" : "Publish entry"}<span aria-hidden="true">↗</span></button></div>
          </form>
        </section>
      </div>}
    </main>
  );
}
