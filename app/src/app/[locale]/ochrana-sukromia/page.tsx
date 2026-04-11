import { useTranslations } from "next-intl";
import { Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PrivacyPage() {
  const t = useTranslations("legal");

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-8">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-xl">{t("privacyTitle")}</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            {t("privacyIntro")}
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-5 text-sm leading-relaxed">
          <section className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <h3 className="font-semibold mb-1">{t("privacyEncryptionTitle")}</h3>
            <p className="text-muted-foreground">{t("privacyEncryption")}</p>
            <p className="text-muted-foreground mt-2">
              {t("privacyEncryptionCode")}{" "}
              <a
                href="https://github.com/dzino-app/souli-crypto"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                github.com/dzino-app/souli-crypto
              </a>
            </p>
          </section>
          <section>
            <h3 className="font-semibold mb-1">{t("privacyDataTitle")}</h3>
            <p className="text-muted-foreground">{t("privacyData")}</p>
          </section>
          <section>
            <h3 className="font-semibold mb-1">{t("privacyLlmTitle")}</h3>
            <p className="text-muted-foreground">{t("privacyLlm")}</p>
          </section>
          <section>
            <h3 className="font-semibold mb-1">{t("privacyBYOKeyTitle")}</h3>
            <p className="text-muted-foreground">{t("privacyBYOKey")}</p>
          </section>
          <section>
            <h3 className="font-semibold mb-1">{t("privacyExportTitle")}</h3>
            <p className="text-muted-foreground">{t("privacyExport")}</p>
          </section>
          <section>
            <h3 className="font-semibold mb-1">{t("privacyThirdPartyTitle")}</h3>
            <p className="text-muted-foreground">{t("privacyThirdParty")}</p>
          </section>
          <section>
            <h3 className="font-semibold mb-1">{t("privacyAnalyticsTitle")}</h3>
            <p className="text-muted-foreground">{t("privacyAnalytics")}</p>
          </section>
          <section className="bg-orange-500/5 border border-orange-500/20 rounded-lg p-4">
            <h3 className="font-semibold mb-1">{t("privacyRecoveryTitle")}</h3>
            <p className="text-muted-foreground">{t("privacyRecovery")}</p>
          </section>
          <section>
            <h3 className="font-semibold mb-1">{t("privacyPasswordInputTitle")}</h3>
            <p className="text-muted-foreground">{t("privacyPasswordInput")}</p>
          </section>
          <section>
            <h3 className="font-semibold mb-1">{t("privacyContactTitle")}</h3>
            <p className="text-muted-foreground">
              {t("privacyContact")}{" "}
              <a
                href="mailto:privacy@dzino.app"
                className="underline hover:text-foreground"
              >
                privacy@dzino.app
              </a>
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
