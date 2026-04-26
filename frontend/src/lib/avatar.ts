export type AnimalAvatar = {
  id: string;
  label: string;
  emoji: string;
};

export const ANIMAL_AVATARS: AnimalAvatar[] = [
  { id: "cat", label: "Kucing", emoji: "🐱" },
  { id: "dog", label: "Anjing", emoji: "🐶" },
  { id: "panda", label: "Panda", emoji: "🐼" },
  { id: "fox", label: "Rubah", emoji: "🦊" },
  { id: "tiger", label: "Harimau", emoji: "🐯" },
  { id: "koala", label: "Koala", emoji: "🐨" },
  { id: "rabbit", label: "Kelinci", emoji: "🐰" },
  { id: "frog", label: "Katak", emoji: "🐸" },
  { id: "bear", label: "Beruang", emoji: "🐻" },
  { id: "cow", label: "Sapi", emoji: "🐮" },
  { id: "penguin", label: "Pinguin", emoji: "🐧" },
  { id: "owl", label: "Burung Hantu", emoji: "🦉" },
];

const PREFIX = "animal:";

export function toAnimalAvatarToken(id: string): string {
  return `${PREFIX}${id}`;
}

export function parseAnimalAvatarToken(token?: string | null): AnimalAvatar | null {
  if (!token || !token.startsWith(PREFIX)) return null;
  const id = token.slice(PREFIX.length);
  return ANIMAL_AVATARS.find((avatar) => avatar.id === id) ?? null;
}

export function randomAnimalAvatarToken(): string {
  const idx = Math.floor(Math.random() * ANIMAL_AVATARS.length);
  return toAnimalAvatarToken(ANIMAL_AVATARS[idx].id);
}
