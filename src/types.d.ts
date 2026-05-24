interface SafariKeyboardNavigationHints {
  DEFAULT_HINT_KEYS: string;
  generateHints(count: number, keys?: string): string[];
  hasPrefixCollision(hints: string[]): boolean;
}
