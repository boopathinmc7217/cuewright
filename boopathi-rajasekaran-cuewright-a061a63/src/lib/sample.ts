import type { Project } from "@/lib/types";

export const SAMPLE_ID = "sample-last-light";

export function createSample(): Project {
  const now = Date.now();
  return {
    id: SAMPLE_ID,
    title: "Last Light at Kovil Station",
    author: "Meera Raman",
    contact: "meera.raman@example.com",
    logline:
      "A night-shift announcer and a runaway tailor share one platform, one coat, and the last train that still stops.",
    draft: "First draft",
    createdAt: now,
    updatedAt: now,
    characters: [
      {
        id: "char-meera",
        name: "Meera",
        role: "Lead",
        age: "34",
        pronouns: "she/her",
        hairStyle: "Low bun, a few escaped strands",
        hairColor: "Black, with a silver streak at the left temple",
        dressColors: ["#243e6b", "#c9962e", "#8b1e3f"],
        wardrobeNotes:
          "Indigo cotton saree, brass border, maroon blouse. Pallu tucked so it stays off the microphone. Small gold studs. No watch.",
      },
      {
        id: "char-arun",
        name: "Arun",
        role: "Lead",
        age: "19",
        pronouns: "he/him",
        hairStyle: "Uneven crop, grown out",
        hairColor: "Black, rain-dark",
        dressColors: ["#d4572a", "#5c6b73"],
        wardrobeNotes:
          "Faded mustard shirt, charcoal trousers with a mended hem. A tailor's measuring tape worn like a lanyard. Canvas shoes, soaked.",
      },
    ],
    scenes: [
      {
        id: "scene-booth",
        synopsis: "Meera holds the last train. Arun asks for a coat, not a ticket.",
        continuity:
          "Rain is active. Meera's silver streak is visible. The coat is still on the hook, not yet in her hands.",
        intExt: "INT.",
        place: "KOVIL STATION - ANNOUNCEMENT BOOTH",
        time: "NIGHT",
        lines: [
          {
            id: "line-1",
            type: "action",
            text: "Rain needles the glass. MEERA, 34, sits in a pool of green monitor light. Her indigo saree is tucked under the desk so the brass border never ticks the microphone.",
          },
          {
            id: "line-2",
            type: "character",
            text: "Meera",
          },
          {
            id: "line-3",
            type: "parenthetical",
            text: "into the mic",
          },
          {
            id: "line-4",
            type: "dialogue",
            text: "Platform two. The last train is holding for a signal at the bridge.",
          },
          {
            id: "line-5",
            type: "action",
            text: "She clicks the mic off. A knock on the booth door. She does not turn.",
          },
          {
            id: "line-6",
            type: "character",
            text: "Meera",
          },
          {
            id: "line-7",
            type: "dialogue",
            text: "If you want a ticket, the window closed at eleven.",
          },
          {
            id: "line-8",
            type: "character",
            text: "Arun (O.S.)",
          },
          {
            id: "line-9",
            type: "dialogue",
            text: "I don't want a ticket. I want the coat.",
          },
        ],
        cast: [
          {
            characterId: "char-meera",
            override: false,
            hairStyle: "",
            hairColor: "",
            dressColors: [],
            wardrobeNotes: "",
          },
          {
            characterId: "char-arun",
            override: true,
            hairStyle: "Uneven crop, plastered to his forehead",
            hairColor: "Black, wet",
            dressColors: ["#d4572a", "#5c6b73"],
            wardrobeNotes:
              "Seen only through the booth glass. Mustard shirt gone dark at the shoulders. Tape still around his neck. He is not wearing the coat yet.",
          },
        ],
        location: {
          name: "Decommissioned meter-gauge booth",
          address: "Platform 1 end, Kovil Station yard",
          mapsUrl: "https://maps.google.com/?q=Chennai+Central",
          notes:
            "Peeling pistachio paint, one working bulb, a hook behind the door for lost coats. Shoot after the last passenger service so the PA is ours. Practical monitor glow, no beauty light.",
          photoIds: [],
        },
        mediaIds: [],
        links: [
          {
            id: "link-booth-ref",
            url: "https://example.com/refs/night-booth",
            label: "Booth lighting reference",
            kind: "video",
          },
        ],
      },
      {
        id: "scene-platform",
        synopsis: "On the platform, Meera returns the coat and sends Arun toward the train.",
        continuity:
          "Coat is now in Meera's hands, maroon lining flashing. Arun's hair is pushed back with a borrowed clip. Rain has eased to mist.",
        intExt: "EXT.",
        place: "PLATFORM 2",
        time: "NIGHT",
        lines: [
          {
            id: "line-10",
            type: "action",
            text: "The platform is a wet ribbon of tile. ARUN stands under a dead lamp. A measuring tape hangs around his neck.",
          },
          {
            id: "line-11",
            type: "character",
            text: "Meera",
          },
          {
            id: "line-12",
            type: "parenthetical",
            text: "offering the coat",
          },
          {
            id: "line-13",
            type: "dialogue",
            text: "Maroon lining. Your mother described the stitch, not the boy.",
          },
          {
            id: "line-14",
            type: "character",
            text: "Arun",
          },
          {
            id: "line-15",
            type: "dialogue",
            text: "She always starts with the thread.",
          },
          {
            id: "line-16",
            type: "action",
            text: "A distant horn. The signal flips green.",
          },
          {
            id: "line-17",
            type: "character",
            text: "Meera",
          },
          {
            id: "line-18",
            type: "dialogue",
            text: "Hair's in your eyes. If you're getting on, tie it back. The door doesn't wait.",
          },
          {
            id: "line-19",
            type: "transition",
            text: "Cut to:",
          },
        ],
        cast: [
          {
            characterId: "char-meera",
            override: true,
            hairStyle: "Low bun, silver streak pinned back",
            hairColor: "Black, silver streak hidden",
            dressColors: ["#243e6b", "#5c6b73", "#8b1e3f"],
            wardrobeNotes:
              "Same saree, plus a charcoal station coat over it. She carries the lost coat on her forearm, maroon lining out.",
          },
          {
            characterId: "char-arun",
            override: true,
            hairStyle: "Crop pushed back with a borrowed steel clip",
            hairColor: "Black, drying at the ends",
            dressColors: ["#d4572a", "#5c6b73"],
            wardrobeNotes:
              "Sleeves rolled once. Tape still on. He puts the coat on only after the last line, if the actor can do it in one move.",
          },
        ],
        location: {
          name: "Platform 2, night shoot",
          address: "Kovil Station, island platform",
          mapsUrl: "https://maps.google.com/?q=Chennai+Central",
          notes:
            "Wet tile, one dead lamp, sodium practicals at the far end. Nearest covered waiting room is the rain cover. Keep the train headlight for the final frame.",
          photoIds: [],
        },
        mediaIds: [],
        links: [],
      },
    ],
  };
}
