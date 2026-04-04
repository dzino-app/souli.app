import { useTranslations } from "next-intl";
import { FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TermsPage() {
  const t = useTranslations("legal");

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-8">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <CardTitle className="text-xl">{t("termsTitle")}</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            {t("termsIntro")}
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 text-sm leading-relaxed">
          <section>
            <h3 className="font-semibold mb-1">{t("termsAccuracyTitle")}</h3>
            <p className="text-muted-foreground">{t("termsAccuracy")}</p>
          </section>
          <section>
            <h3 className="font-semibold mb-1">{t("termsAgeTitle")}</h3>
            <p className="text-muted-foreground">{t("termsAge")}</p>
          </section>
          <section>
            <h3 className="font-semibold mb-1">{t("termsHealthTitle")}</h3>
            <p className="text-muted-foreground">{t("termsHealth")}</p>
          </section>
          <section>
            <h3 className="font-semibold mb-1">{t("termsContentTitle")}</h3>
            <p className="text-muted-foreground">{t("termsContent")}</p>
          </section>
          <section>
            <h3 className="font-semibold mb-1">{t("termsFreeTitle")}</h3>
            <p className="text-muted-foreground">{t("termsFree")}</p>
          </section>
          <section>
            <h3 className="font-semibold mb-1">{t("termsSuspensionTitle")}</h3>
            <p className="text-muted-foreground">{t("termsSuspension")}</p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
