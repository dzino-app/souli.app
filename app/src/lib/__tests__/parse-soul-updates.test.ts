import { describe, it, expect } from "bun:test";
import { parseResponse } from "../parse-soul-updates";

describe("parse-soul-updates", () => {
  it("parses a response with no updates", () => {
    const result = parseResponse("Ahoj! Ako sa máte?");
    expect(result.text).toBe("Ahoj! Ako sa máte?");
    expect(result.soulUpdates).toHaveLength(0);
    expect(result.eventProposals).toHaveLength(0);
  });

  it("parses a soul update block", () => {
    const input = `Rozumiem, rád behávate!

:::aktualizacia
subor: zaujmy.md
operacia: pridat
obsah: |
  - Rád beháva po večeroch
:::`;

    const result = parseResponse(input);
    expect(result.text).toBe("Rozumiem, rád behávate!");
    expect(result.soulUpdates).toHaveLength(1);
    expect(result.soulUpdates[0].slug).toBe("zaujmy");
    expect(result.soulUpdates[0].operation).toBe("pridat");
    expect(result.soulUpdates[0].content).toContain("Rád beháva");
  });

  it("parses multiple soul updates", () => {
    const input = `Super!

:::aktualizacia
subor: osobnost.md
operacia: pridat
obsah: |
  - Je extrovert
:::

:::aktualizacia
subor: zaujmy.md
operacia: pridat
obsah: |
  - Hrá na gitaru
:::`;

    const result = parseResponse(input);
    expect(result.soulUpdates).toHaveLength(2);
    expect(result.soulUpdates[0].slug).toBe("osobnost");
    expect(result.soulUpdates[1].slug).toBe("zaujmy");
  });

  it("parses an event proposal", () => {
    const input = `Dohodnuté!

:::udalost
typ: plan
datum: 2026-04-05
cas: 09:00
nazov: Ranný beh
popis: Dohodli sme sa na behu
pripomienka: 30
:::`;

    const result = parseResponse(input);
    expect(result.text).toBe("Dohodnuté!");
    expect(result.eventProposals).toHaveLength(1);
    expect(result.eventProposals[0].title).toBe("Ranný beh");
    expect(result.eventProposals[0].date).toBe("2026-04-05");
    expect(result.eventProposals[0].time).toBe("09:00");
    expect(result.eventProposals[0].remindBefore).toBe(30);
  });

  it("parses mixed soul updates and events", () => {
    const input = `Fajn!

:::aktualizacia
subor: ciele.md
operacia: pridat
obsah: |
  - Chce začať behať
:::

:::udalost
typ: plan
datum: 2026-04-10
nazov: Prvý beh
popis: Skúsiť 2km
:::`;

    const result = parseResponse(input);
    expect(result.soulUpdates).toHaveLength(1);
    expect(result.eventProposals).toHaveLength(1);
    expect(result.text).toBe("Fajn!");
  });

  it("handles inline single-line obsah", () => {
    const input = `OK

:::aktualizacia
subor: humor.md
operacia: pridat
obsah: Má rád sarkastický humor
:::`;

    const result = parseResponse(input);
    expect(result.soulUpdates).toHaveLength(1);
    expect(result.soulUpdates[0].content).toBe("Má rád sarkastický humor");
  });

  it("defaults mood to happy when no :::nalada block", () => {
    const result = parseResponse("Super odpoveď!");
    expect(result.mood).toBe("happy");
  });

  it("parses mood from :::nalada block", () => {
    const input = `To ma mrzí...

:::nalada
stav: sad
:::`;

    const result = parseResponse(input);
    expect(result.text).toBe("To ma mrzí...");
    expect(result.mood).toBe("sad");
  });

  it("parses mood + soul update together", () => {
    const input = `Rád behávate!

:::aktualizacia
subor: zaujmy.md
operacia: pridat
obsah: |
  - Rád beháva
:::

:::nalada
stav: happy
:::`;

    const result = parseResponse(input);
    expect(result.text).toBe("Rád behávate!");
    expect(result.soulUpdates).toHaveLength(1);
    expect(result.mood).toBe("happy");
  });

  it("ignores invalid mood values", () => {
    const input = `Hmm

:::nalada
stav: angry
:::`;

    const result = parseResponse(input);
    expect(result.mood).toBe("happy"); // falls back to default
  });
});
