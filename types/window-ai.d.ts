interface Window {
  ai?: {
    canCreateTextSession: () => Promise<{
      available: "no" | "readily" | "after-user-interaction";
      reason?: string;
    }>;
    createTextSession: () => Promise<{
      prompt: (input: string) => Promise<string>;
      destroy?: () => void;
    }>;
  };
}
