// Avatar speech bubble — context-aware messages that appear next to the avatar
// Drives curiosity about next level and makes the avatar feel alive

import { getGamification, getXpForNextLevel, getProgressToNextLevel } from "./gamification";
import { getTodayMood } from "./mood-tracking";
import { getAvatarResolution } from "./avatar-resolution";
import { getDailyChallenges, areChallengesComplete } from "./challenges";

interface BubbleMessage {
  text: string;
  priority: number; // higher = shown first
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function getAvatarBubble(): string {
  const messages: BubbleMessage[] = [];
  const g = getGamification();
  const mood = getTodayMood();
  getAvatarResolution(g.level); // used for level-based messages
  const progress = getProgressToNextLevel(g.xp);
  const xpNeeded = getXpForNextLevel(g.level) - g.xp;
  const challenges = getDailyChallenges();
  const completed = challenges.filter((c) => c.completed).length;
  const hour = new Date().getHours();

  // ---- Level-based teasers (what's coming next) ----
  if (g.level === 1) {
    messages.push({ text: "Pomôž mi získať oči! Ešte " + xpNeeded + " XP 👀", priority: 9 });
  } else if (g.level === 2) {
    messages.push({ text: "Mám oči! Chcem sa usmievať — ešte " + xpNeeded + " XP 😊", priority: 8 });
  } else if (g.level === 3) {
    messages.push({ text: "Už sa viem usmievať! Čo odomknem ďalej?", priority: 7 });
  } else if (g.level === 4) {
    messages.push({ text: "Vyzerám 3D! Na úrovni 5 dostanem doplnky 👑", priority: 7 });
  } else if (g.level === 5) {
    messages.push({ text: "Mám doplnky! Na úrovni 6 budem mať 8×8 pixelov!", priority: 7 });
  } else if (g.level >= 6 && g.level <= 9) {
    messages.push({ text: `8×8 rozlíšenie! Na úrovni 11 dostanem vlasy 💇`, priority: 5 });
  } else if (g.level >= 11 && g.level <= 15) {
    messages.push({ text: "12×12! Na úrovni 16 budem mať plné výrazy 🎭", priority: 5 });
  } else if (g.level >= 16 && g.level <= 20) {
    messages.push({ text: "Plné výrazy! Na úrovni 21 budem žiariť ✨", priority: 5 });
  } else if (g.level >= 21) {
    messages.push({ text: "Maximum! Žiarim! ✨", priority: 3 });
  }

  // ---- XP progress ----
  if (progress >= 80) {
    messages.push({ text: `Skoro nová úroveň! Ešte len ${xpNeeded} XP!`, priority: 8 });
  } else if (progress >= 50) {
    messages.push({ text: `Na polceste k úrovni ${g.level + 1}!`, priority: 4 });
  }

  // ---- Streak ----
  if (g.streak >= 7) {
    messages.push({ text: `🔥 ${g.streak} dní v rade! Si úžasný!`, priority: 6 });
  } else if (g.streak >= 3) {
    messages.push({ text: `🔥 ${g.streak} dní! Pokračuj!`, priority: 4 });
  } else if (g.streak === 0) {
    messages.push({ text: "Začnime novú sériu! 🔥", priority: 5 });
  }

  // ---- Mood-based ----
  if (mood) {
    if (mood.mood <= 2) {
      messages.push({ text: "Som tu pre teba. Kedykoľvek.", priority: 10 });
      if (mood.note) {
        messages.push({ text: "Pamätám si, čo si mi povedal. Drž sa.", priority: 10 });
      }
    } else if (mood.mood >= 4) {
      messages.push({ text: pick(["Super deň! 🌟", "Rád ťa vidím šťastného!", "Dnes je náš deň!"]), priority: 6 });
    }
  } else {
    // No mood logged yet today
    messages.push({ text: "Ako sa dnes cítiš?", priority: 7 });
  }

  // ---- Challenges ----
  if (areChallengesComplete()) {
    messages.push({ text: "Všetky výzvy splnené! Si šampión! 🏆", priority: 8 });
  } else if (completed > 0) {
    messages.push({ text: `${completed}/3 výziev splnených! Poďme ďalej!`, priority: 5 });
  } else if (challenges.length > 0) {
    messages.push({ text: "Máš 3 nové výzvy. Skús jednu!", priority: 6 });
  }

  // ---- Time of day ----
  if (hour >= 6 && hour < 10) {
    messages.push({ text: pick(["Dobré ráno! ☀️", "Nový deň, nové výzvy!", "Ráno je najlepší čas začať!"]), priority: 3 });
  } else if (hour >= 22 || hour < 6) {
    messages.push({ text: pick(["Nezabudni ísť spať 😴", "Dobrú noc! Zajtra pokračujeme!", "Čas na oddych."]), priority: 4 });
  }

  // ---- Long absence ----
  const lastActive = new Date(g.lastActiveDate);
  const daysSince = Math.floor((Date.now() - lastActive.getTime()) / (1000 * 60 * 60 * 24));
  if (daysSince >= 3) {
    messages.push({ text: "Hej! Chýbal si mi! 👋", priority: 10 });
  } else if (daysSince >= 1) {
    messages.push({ text: "Vitaj späť! Čo nové?", priority: 7 });
  }

  // ---- Random fun facts to keep it fresh ----
  messages.push({ text: pick([
    "Vedel si, že úsmev aktivuje 43 svalov?",
    "Dnes je dobrý deň na niečo nové!",
    "Každý deň sa učím niečo o tebe 📝",
    "Povedz mi niečo, čo ešte neviem!",
    "Čím viac sa rozprávame, tým lepšie ti rozumiem.",
  ]), priority: 2 });

  // Pick highest priority message
  messages.sort((a, b) => b.priority - a.priority);
  return messages[0]?.text || "Ahoj! 👋";
}
