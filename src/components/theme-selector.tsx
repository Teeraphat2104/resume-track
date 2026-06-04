"use client";

import { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Palette } from "lucide-react";
import { themes, type ThemeId } from "@/lib/themes";

const STORAGE_KEY = "resume-tracker-theme";

function getStoredTheme(): ThemeId | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && themes.some((t) => t.id === stored)) return stored as ThemeId;
  } catch {}
  return null;
}

function setStoredTheme(id: ThemeId) {
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {}
}

function applyTheme(id: ThemeId) {
  document.documentElement.dataset.theme = id;
}

export function ThemeSelector() {
  const [theme, setTheme] = useState<ThemeId>("sketchpad");

  useEffect(() => {
    const stored = getStoredTheme();
    if (stored) {
      setTheme(stored);
      applyTheme(stored);
    }
  }, []);

  const selectTheme = (id: ThemeId) => {
    setTheme(id);
    setStoredTheme(id);
    applyTheme(id);
  };

  const current = themes.find((t) => t.id === theme);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" />}>
        <Palette className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuRadioGroup
          value={theme}
          onValueChange={(value) => {
            if (value !== null) selectTheme(value as ThemeId);
          }}
        >
          {themes.map((t) => (
            <DropdownMenuRadioItem key={t.id} value={t.id} className="gap-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full ring-1 ring-foreground/10">
                <span
                  className="h-3.5 w-3.5 rounded-full"
                  style={{
                    background: `linear-gradient(135deg, ${t.preview.primary} 50%, ${t.preview.accent} 50%)`,
                  }}
                />
              </span>
              {t.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
