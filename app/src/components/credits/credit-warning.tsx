"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface CreditWarningProps {
  onDismiss: () => void;
}

const PLANS = [
  {
    id: "credits" as const,
    name: "50 kreditov",
    price: "3 €",
    description: "Jednorazovy doboj",
    href: "/platba?plan=credits",
  },
  {
    id: "monthly" as const,
    name: "Mesacny plan",
    price: "4,99 €/mes.",
    description: "200 sprav mesacne",
    href: "/platba?plan=monthly",
    popular: true,
  },
  {
    id: "yearly" as const,
    name: "Rocny plan",
    price: "39,99 €/rok",
    description: "200 sprav mesacne, uspora 33%",
    href: "/platba?plan=yearly",
  },
];

export function CreditWarning({ onDismiss }: CreditWarningProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <Card className="w-full max-w-sm mx-4 shadow-xl border-2">
        <CardContent className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold">
                Tvoje spravy sa minuli
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Dokup kredity alebo si vyber plan
              </p>
            </div>
            <button
              type="button"
              onClick={onDismiss}
              className="rounded-full p-1 hover:bg-muted transition-colors"
              aria-label="Zavriet"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          {/* Plan options */}
          <div className="space-y-2.5">
            {PLANS.map((plan) => (
              <Link key={plan.id} href={plan.href}>
                <div
                  className={`rounded-lg border p-3 transition-colors hover:bg-muted/50 cursor-pointer ${
                    plan.popular
                      ? "border-primary/50 bg-primary/5"
                      : "border-border"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{plan.name}</span>
                        {plan.popular && (
                          <span className="text-[10px] font-medium bg-primary text-primary-foreground rounded-full px-1.5 py-0.5">
                            Popularne
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {plan.description}
                      </p>
                    </div>
                    <span className="text-sm font-semibold whitespace-nowrap">
                      {plan.price}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Dismiss */}
          <div className="mt-4 text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="text-xs text-muted-foreground"
            >
              Zatvorit
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
