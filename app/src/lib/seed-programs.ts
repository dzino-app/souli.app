/**
 * Seed official 30-day programs — universal themes, not locale-specific.
 * Language: all stored in English; clients can re-translate if needed.
 * First 5 are the core library; more can be added later.
 */

export interface SeedProgram {
  title: string;
  description: string;
  category: string;
  days: { day: number; prompt: string; focus: string }[];
}

function makeDays(template: (day: number) => { prompt: string; focus: string }): SeedProgram["days"] {
  return Array.from({ length: 30 }, (_, i) => {
    const d = i + 1;
    const t = template(d);
    return { day: d, prompt: t.prompt, focus: t.focus };
  });
}

const GRATITUDE = makeDays((d) => {
  if (d <= 10) {
    const prompts = [
      "Name three things you're grateful for right now. Why each?",
      "Think of someone who made you smile this week. What did they do?",
      "Recall a small moment from today that you enjoyed.",
      "What part of your body are you grateful for today?",
      "Name a possession you're thankful to have — and why it matters.",
      "Who in your past shaped you in a positive way?",
      "What's a food or drink you're grateful exists?",
      "Where is a place that makes you feel safe?",
      "What skill of yours makes your life easier?",
      "What's one thing in nature that you find beautiful?",
    ];
    return { prompt: prompts[d - 1], focus: "Small thanks" };
  }
  if (d <= 20) {
    const prompts = [
      "Write a thank-you letter (unsent) to someone who shaped you.",
      "What's a hardship that taught you something valuable?",
      "Who would you most want to spend tomorrow with?",
      "Recall a stranger's kindness. What did it feel like?",
      "What's a challenge you've overcome that you once doubted you would?",
      "Who do you owe an overdue thank-you to?",
      "What's a recent setback hiding a gift?",
      "Name three things your body let you do today.",
      "What's a song or book that saved you once?",
      "What part of your routine brings you quiet joy?",
    ];
    return { prompt: prompts[d - 11], focus: "Deeper thanks" };
  }
  const prompts = [
    "Tell someone out loud what you're grateful for in them.",
    "Do a small act of kindness and notice how it feels.",
    "Write a list of 30 things you're grateful for. Don't stop until you reach 30.",
    "What's a recent mistake you're secretly grateful for?",
    "Thank a part of yourself you usually criticize.",
    "Spend 10 minutes enjoying a simple pleasure with full attention.",
    "What have you already survived that you once thought you couldn't?",
    "Send a message to someone who helped you, just to thank them.",
    "What's one thing future-you will thank present-you for?",
    "Look back at the last 30 days. What are the three brightest moments?",
  ];
  return { prompt: prompts[d - 21], focus: "Gratitude in action" };
});

const MINDFULNESS = makeDays((d) => {
  if (d <= 10) {
    const prompts = [
      "Take five slow breaths. Count them: in (4), hold (2), out (6). Notice.",
      "Feel your feet on the ground for one minute.",
      "Eat one bite of food in total silence. What flavors appear?",
      "Do a 3-minute body scan from head to toe.",
      "Watch your thoughts for 5 minutes without steering them.",
      "Close your eyes and listen to every sound around you for 2 minutes.",
      "Wash your hands mindfully — feel water, soap, temperature.",
      "Notice three things you see, three you hear, three you feel.",
      "Stretch slowly for 3 minutes, focusing on sensation, not form.",
      "Sip a drink and track how it moves through you.",
    ];
    return { prompt: prompts[d - 1], focus: "Come back to now" };
  }
  if (d <= 20) {
    const prompts = [
      "Meditate for 10 minutes. Focus on your breath. Return when you drift.",
      "Take a 15-minute silent walk. No phone. Notice everything.",
      "Eat a full meal without distractions. No screens, no reading.",
      "Do one routine task (dishes, folding laundry) with full attention.",
      "Name your emotions when they appear, without judging them.",
      "Try a 10-minute loving-kindness meditation for someone difficult.",
      "Sit still for 5 minutes. Don't move. What happens?",
      "Notice your inner critic today. Just notice. Don't fight.",
      "Do something slowly — half your usual speed.",
      "Spend 10 minutes outside, just being, not doing.",
    ];
    return { prompt: prompts[d - 11], focus: "Deeper presence" };
  }
  const prompts = [
    "Practice 15-minute meditation. Choose: breath, body, or open awareness.",
    "Spend an hour without your phone. Note the urge to check.",
    "Have a full conversation where you only listen, don't plan replies.",
    "Do nothing for 20 minutes. Resist the pull to entertain yourself.",
    "Meditate on impermanence — everything changing, even this moment.",
    "Spend a meal eating what truly nourishes you, no guilt, no rush.",
    "Track your breath through one full task today.",
    "Write what you notice about your mind after 20 days of practice.",
    "Meditate in a new place — park, stairwell, bus.",
    "Sit in silence for 30 minutes. No phone, no timer visible.",
  ];
  return { prompt: prompts[d - 21], focus: "Integration" };
});

const CREATIVITY = makeDays((d) => {
  if (d <= 10) {
    const prompts = [
      "Write a 6-word story about today.",
      "Draw (or describe) your mood as a weather pattern.",
      "Make up a new word and define it.",
      "Describe your morning as if it were a fairytale.",
      "Photograph or sketch something usually ignored.",
      "Write a haiku about your breakfast.",
      "Rearrange one object at home into something unexpected.",
      "Invent an alternate use for a common object.",
      "Write a letter from your future self, 10 years from now.",
      "Describe a color without naming it.",
    ];
    return { prompt: prompts[d - 1], focus: "Small sparks" };
  }
  if (d <= 20) {
    const prompts = [
      "Write a short story starting with: 'The door had always been locked until today.'",
      "Describe someone you love using only senses — no adjectives.",
      "Create a playlist that tells the story of your week.",
      "Make something with your hands (food, drawing, craft).",
      "Give your worst fear a face and a name.",
      "Rewrite a childhood memory as a myth.",
      "Design the perfect imaginary room for your mood today.",
      "Write a song chorus about a small moment.",
      "Describe a smell that takes you back in time.",
      "Invent a recipe from what's in your kitchen right now.",
    ];
    return { prompt: prompts[d - 11], focus: "Go deeper" };
  }
  const prompts = [
    "Start a 30-minute creative session with no goal. See what emerges.",
    "Collaborate: ask someone to add one line to something you made.",
    "Remake something you created earlier this month in a new form.",
    "Share one creation with someone — even if scared to.",
    "Make something intentionally bad. Enjoy the freedom.",
    "Write a fable where you are the teacher character.",
    "Capture a whole day in 5 frames (photos, sketches, sentences).",
    "Pick an old half-finished project and finish one piece of it.",
    "Create something inspired by your least favorite thing.",
    "Look at everything you've made in 30 days. Notice what surprised you.",
  ];
  return { prompt: prompts[d - 21], focus: "Bolder work" };
});

const SELF_DISCOVERY = makeDays((d) => {
  if (d <= 10) {
    const prompts = [
      "Write three words that describe you today. Why these?",
      "What were you doing this time last year? Who were you then?",
      "What do you love that you hide from most people?",
      "When do you feel most like yourself?",
      "What belief about yourself might not actually be true?",
      "Name one thing you'd do if nobody was watching.",
      "What's a compliment you struggle to accept?",
      "What drains you that you pretend doesn't?",
      "What did you want to be as a child? What's left of that?",
      "Who makes you feel fully seen?",
    ];
    return { prompt: prompts[d - 1], focus: "Surface mirror" };
  }
  if (d <= 20) {
    const prompts = [
      "What's a fear that's been running your life quietly?",
      "Write about a version of yourself you've outgrown.",
      "What pattern do you keep repeating?",
      "What makes you angry — and what does that anger protect?",
      "Who would you be if you weren't afraid of disappointing anyone?",
      "Write about a choice you regret and what it taught you.",
      "What part of yourself do you silence around family?",
      "What would your 5-year-old self say about your life now?",
      "What do you need that you rarely ask for?",
      "What would you do tomorrow if today were your last?",
    ];
    return { prompt: prompts[d - 11], focus: "Deeper layers" };
  }
  const prompts = [
    "Write a letter to the version of you from 10 years ago.",
    "What are three truths about yourself you've learned this month?",
    "What's something you used to believe that you've grown out of?",
    "Pick one word that describes who you want to become.",
    "What would you choose if money and approval didn't matter?",
    "Forgive yourself for something. Say it out loud.",
    "What is one boundary you need to finally set?",
    "Write down what you've always wanted but feared asking for.",
    "What do you now know about yourself that you didn't 30 days ago?",
    "What will you carry forward from this journey?",
  ];
  return { prompt: prompts[d - 21], focus: "Integration" };
});

const SLEEP = makeDays((d) => {
  if (d <= 10) {
    const prompts = [
      "Set a consistent bedtime for tonight. Stick to it within 15 minutes.",
      "Avoid screens for the last 30 minutes before bed tonight.",
      "Dim the lights in your home one hour before sleep.",
      "Write down tomorrow's top 3 tasks so your mind can release them.",
      "Do a 5-minute body scan in bed tonight.",
      "Take a warm shower 60-90 minutes before bed.",
      "Keep your bedroom cool (18-20°C). Notice the difference.",
      "No caffeine after 2pm today.",
      "Write one thing you're grateful for just before sleep.",
      "Try reading (paper, not screen) for 15 minutes before bed.",
    ];
    return { prompt: prompts[d - 1], focus: "Evening setup" };
  }
  if (d <= 20) {
    const prompts = [
      "Get 15 minutes of morning sunlight within an hour of waking.",
      "Move your body today — even a 20-minute walk helps sleep.",
      "Notice how you feel after 10 days. Any shifts?",
      "Try box breathing (4-4-4-4) before bed for 3 minutes.",
      "No heavy meals in the 3 hours before bed tonight.",
      "Write out any worry loops in your head on paper before sleep.",
      "Try a 10-minute meditation just before lying down.",
      "Skip the midday nap today if you usually take one.",
      "Keep your phone in another room tonight.",
      "If you wake at night, don't check the time. Just breathe.",
    ];
    return { prompt: prompts[d - 11], focus: "Daytime inputs" };
  }
  const prompts = [
    "Track your sleep tonight with your Souli. How did it feel?",
    "Design your ideal wind-down ritual and commit to it.",
    "What's the biggest sleep shift you've noticed this month?",
    "Skip alcohol tonight if it's part of your routine. Notice tomorrow.",
    "Experiment with bedtime 30 minutes earlier.",
    "Try waking without an alarm for one morning.",
    "Evaluate your bedroom: what one change could help?",
    "Share your sleep rituals with someone you live with.",
    "What do mornings feel like now vs. 30 days ago?",
    "Write down your new sleep rules. Keep them simple. Three or less.",
  ];
  return { prompt: prompts[d - 21], focus: "Your own sleep recipe" };
});

export const SEED_PROGRAMS: SeedProgram[] = [
  {
    title: "30 Days of Gratitude",
    description: "A gentle journey from noticing small gifts to living thankfulness out loud.",
    category: "wellness",
    days: GRATITUDE,
  },
  {
    title: "30 Days of Mindfulness",
    description: "Short daily practices that train you to come back to the present moment.",
    category: "wellness",
    days: MINDFULNESS,
  },
  {
    title: "30 Days of Creativity",
    description: "Small daily prompts that wake up the part of you that makes things.",
    category: "growth",
    days: CREATIVITY,
  },
  {
    title: "30 Days of Self-Discovery",
    description: "Questions that peel back the layers and show you who you've become.",
    category: "growth",
    days: SELF_DISCOVERY,
  },
  {
    title: "30 Days of Better Sleep",
    description: "Daily adjustments to rebuild your relationship with rest.",
    category: "wellness",
    days: SLEEP,
  },
];
