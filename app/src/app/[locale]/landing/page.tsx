import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  MessageCircle,
  Calendar,
  Brain,
  Heart,
  Sparkles,
  BookOpen,
  Target,
  Check,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { HeroAvatar } from "@/components/landing/hero-avatar";

const useCases = [
  { key: "useCase1", icon: Heart },
  { key: "useCase2", icon: Calendar },
  { key: "useCase3", icon: Brain },
] as const;

const steps = [
  { key: "how1", icon: MessageCircle },
  { key: "how2", icon: BookOpen },
  { key: "how3", icon: Sparkles },
] as const;

const features = [
  { key: "feature1", icon: Sparkles },
  { key: "feature2", icon: BookOpen },
  { key: "feature3", icon: Calendar },
  { key: "feature4", icon: Target },
] as const;

const pricing = [
  { key: "Free", featured: false },
  { key: "Credits", featured: false },
  { key: "Monthly", featured: true },
  { key: "Yearly", featured: false },
] as const;

const faqs = ["faq1", "faq2", "faq3", "faq4"] as const;

export default function LandingPage() {
  const t = useTranslations("landing");

  return (
    <div className="flex flex-col gap-16 -mt-2">
      {/* Hero */}
      <section className="text-center py-12">
        <div className="flex justify-center mb-6">
          <HeroAvatar />
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
          {t("hero")}
        </h1>
        <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
          {t("heroSub")}
        </p>
        <Link href="/registracia">
          <Button size="lg" className="text-base px-8 py-6">
            {t("cta")}
          </Button>
        </Link>
        <p className="text-xs text-muted-foreground mt-3">{t("ctaSub")}</p>
      </section>

      {/* Use cases */}
      <section>
        <h2 className="text-2xl font-bold text-center mb-8">
          {t("useCasesTitle")}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {useCases.map(({ key, icon: Icon }) => (
            <Card key={key}>
              <CardContent className="pt-6 text-center">
                <div className="rounded-full bg-primary/10 p-3 w-fit mx-auto mb-4">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{t(key)}</h3>
                <p className="text-sm text-muted-foreground">
                  {t(`${key}Desc`)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section>
        <h2 className="text-2xl font-bold text-center mb-8">
          {t("howTitle")}
        </h2>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
          {steps.map(({ key, icon: Icon }, i) => (
            <div key={key} className="flex items-center gap-4">
              <div className="text-center">
                <div className="rounded-full bg-primary text-primary-foreground w-12 h-12 flex items-center justify-center mx-auto mb-2">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="font-semibold text-sm">{t(key)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t(`${key}Desc`)}
                </p>
              </div>
              {i < steps.length - 1 && (
                <ChevronDown className="h-5 w-5 text-muted-foreground sm:rotate-[-90deg] shrink-0" />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section>
        <h2 className="text-2xl font-bold text-center mb-8">
          {t("featureTitle")}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {features.map(({ key, icon: Icon }) => (
            <Card key={key}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className="rounded-md bg-primary/10 p-2 shrink-0">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{t(key)}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t(`${key}Desc`)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section>
        <h2 className="text-2xl font-bold text-center mb-8">
          {t("pricingTitle")}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {pricing.map(({ key, featured }) => (
            <Card
              key={key}
              className={featured ? "border-primary shadow-md" : ""}
            >
              <CardContent className="pt-6">
                <h3 className="font-semibold">{t(`pricing${key}`)}</h3>
                <p className="text-2xl font-bold mt-1">
                  {t(`pricing${key}Price`)}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  {t(`pricing${key}Desc`)}
                </p>
                {featured && (
                  <div className="flex items-center gap-1 text-primary text-xs mt-3">
                    <Check className="h-3.5 w-3.5" />
                    <span>Najobľúbenejší</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section>
        <h2 className="text-2xl font-bold text-center mb-8">
          {t("faqTitle")}
        </h2>
        <div className="flex flex-col gap-3 max-w-xl mx-auto">
          {faqs.map((key) => (
            <Card key={key}>
              <CardContent className="py-4">
                <h3 className="font-semibold text-sm">{t(`${key}q`)}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {t(`${key}a`)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="text-center py-8">
        <Link href="/registracia">
          <Button size="lg" className="text-base px-8 py-6">
            {t("cta")}
          </Button>
        </Link>
        <p className="text-sm text-muted-foreground mt-6">{t("footer")}</p>
      </section>
    </div>
  );
}
