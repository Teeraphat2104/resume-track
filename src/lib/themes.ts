export type ThemeId = "sketchpad" | "blue" | "slate";

export interface Theme {
  id: ThemeId;
  label: string;
  preview: {
    primary: string;
    accent: string;
    bg: string;
  };
}

export const themes: Theme[] = [
  {
    id: "sketchpad",
    label: "Sketchpad",
    preview: {
      primary: "#6b5ce7",
      accent: "#7a6f9a",
      bg: "#f7f5e8",
    },
  },
  {
    id: "blue",
    label: "Blue",
    preview: {
      primary: "#4a7cf7",
      accent: "#3bc4b7",
      bg: "#ffffff",
    },
  },
  {
    id: "slate",
    label: "Slate",
    preview: {
      primary: "#1a1a1a",
      accent: "#6b6b6b",
      bg: "#ffffff",
    },
  },
];
