import type { TrashType } from "./types";

export type Difficulty = "easy" | "medium" | "hard";

export interface Guide {
  id: string; // kebab-case, unique
  title: string;
  emoji: string;
  types: TrashType[]; // trash types this guide reuses, at least one
  difficulty: Difficulty;
  minutes: number; // time needed
  blurb: string; // one short sentence
  materials: string[]; // "You'll need"
  steps: string[]; // numbered steps, 3-7
  safety: string; // one safety tip
}

export const GUIDES: Guide[] = [
  {
    id: "eco-brick",
    title: "Eco-brick",
    emoji: "🧱",
    types: ["plastic"],
    difficulty: "easy",
    minutes: 45,
    blurb: "Pack clean, dry plastic wrappers into a bottle to make a strong building block.",
    materials: [
      "1 clean, dry plastic bottle with a cap (500 ml to 1 liter)",
      "Clean, dry soft plastic: wrappers, bags, sachets",
      "Scissors",
      "A thin stick, like a wooden spoon handle",
    ],
    steps: [
      "Wash all the plastic with soap and water. Let it dry in the sun until there is no water at all.",
      "Cut the plastic into small pieces, about the size of a coin.",
      "Put a few pieces into the bottle.",
      "Push them down hard with the stick. Pack them very tight.",
      "Keep adding small amounts and pushing down until the bottle is full and hard like a brick.",
      "Put the cap on tight. Use the brick for a stool, a garden border or a small wall.",
    ],
    safety: "Never pack wet, dirty or food plastic. It can rot and smell. Wear gloves when you pick up beach plastic.",
  },
  {
    id: "woven-sachet-pouch",
    title: "Woven sachet pouch",
    emoji: "👜",
    types: ["plastic"],
    difficulty: "hard",
    minutes: 120,
    blurb: "Fold and weave colorful snack wrappers into a small bag or purse.",
    materials: [
      "About 30 clean, dry wrappers or sachets of the same size",
      "Scissors",
      "Strong thread and a big needle, or a stapler",
      "A zip or a button (optional)",
    ],
    steps: [
      "Wash the wrappers with soap and water. Dry them well in the sun.",
      "Cut open the top and bottom of each wrapper to make a flat strip.",
      "Fold each strip in half along its length two times. You get a thin, strong band.",
      "Weave the bands over and under each other, like a mat, to make two flat squares.",
      "Put the two squares together. Sew or staple the sides and the bottom.",
      "Add a band of folded wrapper as a handle. Sew it on at both sides.",
    ],
    safety: "Ask an adult to help with sharp scissors and needles. Do not use wrappers that held oil or chemicals.",
  },
  {
    id: "bottle-planter",
    title: "Self-watering bottle planter",
    emoji: "🪴",
    types: ["bottles"],
    difficulty: "easy",
    minutes: 30,
    blurb: "Turn a plastic bottle into a small pot that waters the plant by itself.",
    materials: [
      "1 plastic bottle (1.5 liter is good)",
      "Scissors or a small knife",
      "A piece of old cloth or a thick string",
      "Soil",
      "A small plant or seeds",
    ],
    steps: [
      "Wash the bottle inside and out. Take off the label.",
      "Ask an adult to cut the bottle in half. Keep the bottom part and the top part with the neck.",
      "Ask an adult to make a small hole in the cap with a nail or the tip of the scissors. Push the cloth or string through it, so it hangs down on both sides.",
      "Put the cap back on. Turn the top part upside down and set it inside the bottom part, like a funnel.",
      "Pour water into the bottom part. The string should touch the water.",
      "Fill the top part with soil and plant your seeds. The string pulls water up to the soil.",
    ],
    safety: "Ask an adult to cut the bottle. Smooth any sharp plastic edge with sandpaper or by folding tape over it. Only use a bottle that held water or a drink. Do not use bottles that held bleach, detergent, pesticide, oil or fuel, and do not grow food plants in a beach bottle.",
  },
  {
    id: "bottle-broom",
    title: "Bottle broom",
    emoji: "🧹",
    types: ["bottles", "plastic"],
    difficulty: "medium",
    minutes: 40,
    blurb: "Cut plastic bottles into strips to make a strong, free broom.",
    materials: [
      "3 to 5 clean plastic bottles",
      "Scissors",
      "A wooden stick or old broom handle",
      "Strong string or wire",
    ],
    steps: [
      "Wash the bottles well and let them dry.",
      "Cut off the bottom of each bottle and throw it away or save it for another project. Keep the neck part. Take the caps off and save them.",
      "Cut the rest of each bottle into thin strips, from the open end up to about 3 cm from the top. Do not cut all the way.",
      "Put all the bottle tops on the end of the stick. Make the strips hang down like a broom.",
      "Tie the bottle necks tight to the stick with string or wire. Wrap it many times.",
      "Shake and trim the strips so they are about the same length.",
    ],
    safety: "Cut plastic can have sharp edges. Wear gloves and let an adult do the cutting if you are young. Skip bottles that held chemicals or oil.",
  },
  {
    id: "net-produce-bag",
    title: "Net shopping bag",
    emoji: "🛍️",
    types: ["nets"],
    difficulty: "medium",
    minutes: 60,
    blurb: "Make a light bag for the market from a piece of clean fishing net.",
    materials: [
      "A piece of clean fishing net, about 1 meter long",
      "Scissors",
      "Strong rope or old cloth strips for handles",
      "A bucket and soap",
    ],
    steps: [
      "Check the net for trapped animals first. If any are alive, do not cut the net. Call a wildlife or rescue group. Never pull or cut a big net stuck in sand, rocks or water. Report it to the cleanup group or local authority.",
      "Cut the net free from any rope, hooks, floats or weights. Take care with sharp parts.",
      "Soak the net in soapy water. Rub it to remove sand and salt. Rinse and dry it in the sun.",
      "Fold the net in half to make a bag shape. The fold is the bottom.",
      "Tie the two sides together with knots every 5 cm. Pull each knot tight.",
      "Tie a rope or cloth strip to each top corner to make two handles.",
      "Test the bag with a light load first, like a few fruits.",
    ],
    safety: "Check the net for hooks and sharp metal first. Never use a net that smells of oil or chemicals, or that tears or crumbles easily. Wear gloves and wash your hands after you touch lead weights.",
  },
  {
    id: "net-plant-hanger",
    title: "Net hanging plant holder",
    emoji: "🌿",
    types: ["nets"],
    difficulty: "easy",
    minutes: 30,
    blurb: "Hang a small pot from old net and rope. It looks good and costs nothing.",
    materials: [
      "A piece of clean net, about 1 meter by 1 meter",
      "A small pot or a cut plastic bottle with soil",
      "A ring, or a strong stick, to hang it from",
      "Scissors",
    ],
    steps: [
      "Check the net for trapped animals first. If any are alive, do not cut the net. Call a wildlife or rescue group. Never pull or cut a big net stuck in sand, rocks or water. Report it to the cleanup group or local authority.",
      "Clean the net with soap and water. Dry it in the sun.",
      "Cut away any hooks, weights or damaged parts.",
      "Put the pot in the middle of the net.",
      "Lift the four corners of the net up around the pot. Hold them together above it.",
      "Tie all four corners to the ring or stick with a strong knot.",
      "Hang it from a tree branch or hook. Pull down on it to test it before you add the plant.",
    ],
    safety: "Test that it holds the weight before you hang it above people. Wet soil is heavy. Do not use net that tears or crumbles easily. Wear gloves and wash your hands after you touch lead weights.",
  },
  {
    id: "compost-bin",
    title: "Simple compost pile",
    emoji: "🍂",
    types: ["organic"],
    difficulty: "easy",
    minutes: 30,
    blurb: "Turn leaves and fruit waste into soil food for plants.",
    materials: [
      "Dry leaves, grass and coconut husk",
      "Fruit and vegetable scraps",
      "Fresh water to rinse sea-washed material",
      "A stick or small shovel",
    ],
    steps: [
      "Pick a shady spot on the ground, away from the sea and far from your kitchen door.",
      "Rinse any seaweed or coconut husk from the beach with fresh water to remove salt. Salt can harm plants and slow the compost.",
      "Put a layer of dry leaves or husk at the bottom, about 10 cm.",
      "Add a layer of fruit and vegetable scraps, about 5 cm.",
      "Cover the scraps with more dry leaves. Brown layers stop bad smells.",
      "Wet the pile a little. It should feel like a squeezed sponge.",
      "Turn the pile with a stick every week. After 2 to 3 months it turns dark and smells like earth.",
    ],
    safety: "Use only plant waste. Never add meat, fish, oil, plastic or animal remains. Report dead animals to the local authority. Wash your hands after.",
  },
  {
    id: "driftwood-decor",
    title: "Driftwood and shell decor",
    emoji: "🪵",
    types: ["organic"],
    difficulty: "easy",
    minutes: 60,
    blurb: "Make a wall hanging from washed-up wood and shells.",
    materials: [
      "Clean pieces of driftwood",
      "Empty shells or dry coconut shell pieces",
      "Strong glue or string",
      "Sandpaper",
      "Soap and water",
    ],
    steps: [
      "Choose pieces of wood with no nails, no paint and no strange smell.",
      "Scrub the wood and shells with soap and water. Dry them in the sun for 2 days.",
      "Sand rough or sharp parts of the wood until they feel smooth.",
      "Lay the pieces on a table. Try different shapes before you glue.",
      "Glue the pieces together, or tie them with string. Let the glue dry for a full day.",
      "Tie a string to the top and hang it on a wall.",
    ],
    safety: "Do not use wood with rusty nails or old paint. It can hurt you. Sand outdoors with a cloth over your nose and mouth. Do not sand or use wood that smells like tar or oil, or has a greenish tint. Glue in an open, airy place. Check shell and coconut pieces for sharp edges. Do not take shells that still have a living animal inside.",
  },
  {
    id: "bottle-cap-art",
    title: "Bottle cap mosaic",
    emoji: "🎨",
    types: ["plastic", "bottles"],
    difficulty: "medium",
    minutes: 90,
    blurb: "Use colorful bottle caps to make a picture for a wall or a table.",
    materials: [
      "Many clean bottle caps in different colors",
      "A flat board or piece of wood",
      "Strong glue",
      "A pencil",
    ],
    steps: [
      "Wash the caps with soap and water. Dry them well.",
      "Sort the caps by color into small piles.",
      "Draw a simple picture on the board with a pencil, such as a fish or a sun.",
      "Put the caps on the drawing without glue first. Move them until you like it.",
      "Glue the caps one by one, with the open side facing down.",
      "Let it dry for a full day before you hang it or stand it up.",
    ],
    safety: "Keep small caps away from young children. They can put them in their mouth. Skip caps that held chemicals or oil.",
  },
  {
    id: "flipflop-coaster",
    title: "Flip-flop sole coasters",
    emoji: "🩴",
    types: ["other"],
    difficulty: "medium",
    minutes: 45,
    blurb: "Cut old rubber sandals into soft pads for cups and plant pots.",
    materials: [
      "Old rubber flip-flops, clean",
      "Sharp scissors or a craft knife",
      "A cup or a lid to trace a circle",
      "A marker",
      "Soap and water",
    ],
    steps: [
      "Wash the flip-flops with soap and water. Dry them.",
      "Cut off the straps and throw them away or keep them for other use.",
      "Trace a circle on the sole with a cup or a lid and the marker.",
      "Ask an adult to cut along the line. Cut slowly in small steps.",
      "Wash the circles and dry them.",
      "Use them under cups, plant pots or tools to protect a table.",
    ],
    safety: "Rubber is hard to cut. Ask an adult to use the knife or sharp scissors. Cut away from your body. Do not use these under hot pots, pans or hot drinks straight from the stove. Rubber and foam can melt.",
  },
  {
    id: "sort-and-drop-off",
    title: "Sort it and drop it off",
    emoji: "♻️",
    types: ["mixed", "other"],
    difficulty: "easy",
    minutes: 20,
    blurb: "Split mixed trash by type, keep what is safe to reuse and give the rest to a proper waste service.",
    materials: [
      "Strong gloves",
      "2 or 3 bags or buckets",
      "A marker to label them",
      "A pair of tongs or a litter picker (optional)",
    ],
    steps: [
      "Put on gloves before you touch any trash.",
      "Split the mixed trash by type. Put the clean plastic and bottles in one bag, and set nets aside. You can reuse these in the plastic, bottle and net guides.",
      "Put the plant waste in a second bag for compost.",
      "Put everything else in a third bag: dirty trash, foam, dirty or damaged rubber, metal and things you do not know. Do NOT pick up broken glass, needles, medicine, batteries or oily trash. Leave them where they are and report them to the local waste service.",
      "Close the bags tight and label them.",
      "Ask your local waste collection or beach cleanup group where to take the last bag. Do not burn it.",
    ],
    safety: "Never touch needles, medicine, broken glass, batteries or oily trash. Leave them and tell an adult or the local waste service. Never burn plastic. The smoke is poison.",
  },
];

export function guidesFor(type: TrashType | null): Guide[] {
  if (type === null) return GUIDES;
  return GUIDES.filter((g) => g.types.includes(type));
}

export function guideById(id: string): Guide | undefined {
  return GUIDES.find((g) => g.id === id);
}
