import { FileText, Search, PenLine, Shield, BookOpen, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const actions = [
  {
    icon: FileText,
    label: "Zhrnúť dokument",
    description: "Nahrať a získať prehľadné zhrnutie",
  },
  {
    icon: Search,
    label: "Vysvetliť jednoducho",
    description: "Zrozumiteľné vysvetlenie zložitého textu",
  },
  {
    icon: Shield,
    label: "Nájsť riziká",
    description: "Upozornenie na dôležité body a riziká",
  },
  {
    icon: BookOpen,
    label: "Nájsť kľúčové body",
    description: "Najdôležitejšie informácie na jednom mieste",
  },
  {
    icon: PenLine,
    label: "Napísať odpoveď",
    description: "Napíšeme formálny list alebo e-mail za Vás",
  },
  {
    icon: HelpCircle,
    label: "Opýtať sa",
    description: "Položte akúkoľvek otázku k dokumentu",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col gap-8">
      {/* Upload zone */}
      <Card className="border-dashed border-2">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold mb-1">Nahrajte dokument</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Pretiahnite sem alebo kliknite pre výber súboru
          </p>
          <Button size="lg">Vybrať súbor</Button>
          <p className="text-xs text-muted-foreground mt-3">
            PDF, DOCX, JPG, PNG — max. 10 MB
          </p>
        </CardContent>
      </Card>

      {/* Action buttons grid */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Čo pre Vás môžem urobiť?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {actions.map((action) => (
            <button
              key={action.label}
              className="flex items-start gap-3 rounded-lg border bg-card p-4 text-left transition-colors hover:bg-secondary min-h-[64px]"
            >
              <action.icon className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <div className="font-medium text-sm">{action.label}</div>
                <div className="text-xs text-muted-foreground">
                  {action.description}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Search-bar style input */}
      <div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Napr.: Môžem túto zmluvu vypovedať?"
            className="w-full rounded-lg border bg-background py-3 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>
    </div>
  );
}
