export async function extractDocumentText(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/documents/extract", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || "Nepodarilo sa spracovať súbor");
  }

  const { text } = await response.json();
  return text;
}
