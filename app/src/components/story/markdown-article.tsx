import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownArticleProps {
  source: string;
}

export function MarkdownArticle({ source }: MarkdownArticleProps) {
  return (
    <article className="story-prose">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{source}</ReactMarkdown>
    </article>
  );
}
