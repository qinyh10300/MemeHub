import { inject, getCurrentInstance } from "vue";

export function useDex() {
  const injected = inject("dex", null);
  if (injected) return injected;

  const instance = getCurrentInstance();
  return instance?.appContext?.config?.globalProperties?.$dex ?? null;
}
