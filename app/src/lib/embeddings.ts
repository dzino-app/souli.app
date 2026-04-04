// NVIDIA NV-Embed-v2 embedding service for hybrid search

const NVIDIA_API_URL = "https://integrate.api.nvidia.com/v1/embeddings";

export async function getEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.NVIDIA_EMBEDDING_KEY;
  if (!apiKey) throw new Error("NVIDIA_EMBEDDING_KEY not set");

  const response = await fetch(NVIDIA_API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "nvidia/nv-embedqa-e5-v5",
      input: [text.slice(0, 8000)], // truncate to fit context
      input_type: "passage",
      encoding_format: "float",
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Embedding API error: ${response.status} ${err}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

/**
 * Build a searchable text blob from avatar data + soul files
 */
export function buildEmbeddingText(
  name: string,
  bio: string | null,
  tags: string[],
  soulFiles: { slug: string; content: string }[],
): string {
  const parts = [
    `Name: ${name}`,
    bio ? `Bio: ${bio}` : "",
    tags.length > 0 ? `Tags: ${tags.join(", ")}` : "",
    ...soulFiles.map((f) => `${f.slug}: ${f.content}`),
  ];
  return parts.filter(Boolean).join("\n\n");
}
