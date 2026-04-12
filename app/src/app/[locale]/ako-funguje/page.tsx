import { useTranslations } from "next-intl";
import { Brain, Shield, Eye, Server } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function HowItWorksPage() {
  const t = useTranslations("transparency");

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-8">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <Brain className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-xl">{t("title")}</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            {t("intro")}
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-5 text-sm leading-relaxed">
          <section>
            <div className="flex items-center gap-2 mb-1">
              <Brain className="h-4 w-4 text-primary shrink-0" />
              <h3 className="font-semibold">{t("modelTitle")}</h3>
            </div>
            <p className="text-muted-foreground">{t("model")}</p>
          </section>
          <section>
            <div className="flex items-center gap-2 mb-1">
              <Eye className="h-4 w-4 text-primary shrink-0" />
              <h3 className="font-semibold">{t("dataTitle")}</h3>
            </div>
            <p className="text-muted-foreground">{t("data")}</p>
          </section>
          <section>
            <div className="flex items-center gap-2 mb-1">
              <Shield className="h-4 w-4 text-primary shrink-0" />
              <h3 className="font-semibold">{t("encryptionTitle")}</h3>
            </div>
            <p className="text-muted-foreground">{t("encryption")}</p>
          </section>
          <section>
            <div className="flex items-center gap-2 mb-1">
              <Server className="h-4 w-4 text-primary shrink-0" />
              <h3 className="font-semibold">{t("storageTitle")}</h3>
            </div>
            <p className="text-muted-foreground">{t("storage")}</p>
          </section>
          <section className="bg-orange-500/5 border border-orange-500/20 rounded-lg p-4">
            <h3 className="font-semibold mb-1">{t("limitationsTitle")}</h3>
            <p className="text-muted-foreground">{t("limitations")}</p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
