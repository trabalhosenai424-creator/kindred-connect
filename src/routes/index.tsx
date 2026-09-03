import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Tela Branca" },
      { name: "description", content: "Uma tela em branco limpa." },
      { property: "og:title", content: "Tela Branca" },
      { property: "og:description", content: "Uma tela em branco limpa." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

function Index() {
  return <div className="min-h-screen bg-background" />;
}
