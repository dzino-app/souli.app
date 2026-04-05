import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateContent } from "@/lib/llm";

const BUCKET = "souls";

// Max chars to include per soul file summary
const FILE_SUMMARY_LIMIT = 300;
// Max recent messages to include
const MAX_MESSAGES = 20;

const COMPILATION_PROMPT = `You are a Knowledge Base compiler for a personal AI companion called Dzino.

Your job is to compile a structured _index.md that summarizes and cross-references the user's soul files.

== INPUT ==
Current _index.md (may be empty for first compile):
{currentIndex}

Soul files:
{soulSummaries}

Recent messages:
{recentMessages}

== YOUR TASK ==

Generate a COMPLETE updated _index.md in this exact format:

# Soul Index

## File Summaries
For each soul file, write 1-2 sentence summary and note what's new since last compile.
Use cross-references like [-> slug] to link related files.

## Cross-References
List connections between files (e.g., "osobnost mentions humor style [-> humor], work stress [-> praca]")

## Open Threads
List ongoing topics, unresolved questions, or things the user mentioned wanting to do.
These are temporal context items that matter for future conversations.

## Insights
High-level observations about the user: patterns, preferences, personality traits.
These should be things that emerge from looking at ALL files together.

== ALSO GENERATE ==

If you notice things that should be updated in existing soul files based on recent messages
(cascading updates), suggest them.

Return ONLY valid JSON in this format:
{
  "index": "full _index.md content as string",
  "updates": [
    {"slug": "file-slug", "operation": "pridat", "content": "content to add"}
  ],
  "log": "## YYYY-MM-DD HH:MM\\n- compiled X files, Y messages\\n- key findings: ..."
}

IMPORTANT:
- Write summaries in the same language as the soul files (usually Slovak)
- Be concise but thorough
- Cross-references use [-> slug] format
- updates array can be empty if no changes needed
- For log, use the current timestamp`;

export async function POST() {
  try {
    const supabase = await createClient();

    // Authenticate
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = user.id;

    // 1. Read soul file metadata
    const { data: soulMeta } = await supabase
      .from("soul_files")
      .select("slug, display_name, category, updated_by, updated_at")
      .eq("user_id", userId)
      .order("created_at");

    if (!soulMeta || soulMeta.length === 0) {
      return NextResponse.json(
        { error: "No soul files found" },
        { status: 404 }
      );
    }

    // 2. Read all soul file contents (first FILE_SUMMARY_LIMIT chars each)
    const soulSummaries: string[] = [];
    for (const meta of soulMeta) {
      // Skip system files from the input
      if (meta.slug === "_index" || meta.slug === "_log") continue;

      const { data: fileData } = await supabase.storage
        .from(BUCKET)
        .download(`${userId}/${meta.slug}.md`);

      let content = "";
      if (fileData) {
        const fullContent = await fileData.text();
        content = fullContent.length > FILE_SUMMARY_LIMIT
          ? fullContent.slice(0, FILE_SUMMARY_LIMIT) + "..."
          : fullContent;
      }

      soulSummaries.push(
        `### ${meta.slug}.md (${meta.display_name || meta.slug})\n` +
        `Category: ${meta.category} | Updated: ${meta.updated_at} | By: ${meta.updated_by}\n` +
        `Content:\n${content}`
      );
    }

    // 3. Read current _index.md (if exists)
    let currentIndex = "";
    const { data: indexData } = await supabase.storage
      .from(BUCKET)
      .download(`${userId}/_index.md`);

    if (indexData) {
      currentIndex = await indexData.text();
    }

    // 4. Read recent messages
    const { data: conversations } = await supabase
      .from("conversations")
      .select("id")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(3);

    let recentMessages = "";
    if (conversations && conversations.length > 0) {
      const convIds = conversations.map((c) => c.id);
      const { data: messages } = await supabase
        .from("messages")
        .select("role, content, created_at")
        .in("conversation_id", convIds)
        .order("created_at", { ascending: false })
        .limit(MAX_MESSAGES);

      if (messages && messages.length > 0) {
        recentMessages = messages
          .reverse()
          .map((m) => `[${m.role}] ${(m.content as string).slice(0, 200)}`)
          .join("\n");
      }
    }

    // 5. Call LLM for compilation
    const now = new Date().toISOString().slice(0, 16).replace("T", " ");
    const prompt = COMPILATION_PROMPT
      .replace("{currentIndex}", currentIndex || "(first compile - no previous index)")
      .replace("{soulSummaries}", soulSummaries.join("\n\n"))
      .replace("{recentMessages}", recentMessages || "(no recent messages)");

    const result = await generateContent({
      systemInstruction: `You are a precise JSON generator. Current time: ${now}. Return only valid JSON.`,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    // Parse the JSON response
    const jsonStr = result.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(jsonStr);

    // Validate the response shape
    const response = {
      index: typeof parsed.index === "string" ? parsed.index : "",
      updates: Array.isArray(parsed.updates) ? parsed.updates : [],
      log: typeof parsed.log === "string" ? parsed.log : `## ${now}\n- Compiled ${soulMeta.length} files`,
    };

    // 6. Store _index.md directly to Supabase Storage
    if (response.index) {
      await supabase.storage
        .from(BUCKET)
        .upload(
          `${userId}/_index.md`,
          new Blob([response.index], { type: "text/markdown" }),
          { upsert: true }
        );

      await supabase.from("soul_files").upsert(
        {
          user_id: userId,
          slug: "_index",
          display_name: "Index",
          category: "system",
          updated_by: "dzino",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,slug" }
      );
    }

    // 7. Append to _log.md in Supabase Storage
    if (response.log) {
      let existingLog = "";
      const { data: logData } = await supabase.storage
        .from(BUCKET)
        .download(`${userId}/_log.md`);
      if (logData) {
        existingLog = await logData.text();
      }

      const newLog = existingLog
        ? existingLog.trimEnd() + "\n\n" + response.log
        : "# Compilation Log\n\n" + response.log;

      await supabase.storage
        .from(BUCKET)
        .upload(
          `${userId}/_log.md`,
          new Blob([newLog], { type: "text/markdown" }),
          { upsert: true }
        );

      await supabase.from("soul_files").upsert(
        {
          user_id: userId,
          slug: "_log",
          display_name: "Log",
          category: "system",
          updated_by: "dzino",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,slug" }
      );
    }

    return NextResponse.json(response);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[soul/compile]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
