import { AppMode } from "@/context/AppModeContext";

/**
 * Get the appropriate API endpoint based on the current application mode
 */
export function getApiEndpoint(baseEndpoint: string, mode: AppMode): string {
  if (mode === "emas_muda") {
    // Map of endpoints that have muda variants
    const endpointMap: Record<string, string> = {
      "/api/purchases": "/api/muda-purchases",
      "/api/categories": "/api/muda-categories",
      "/api/incoming-item": "/api/muda-incoming-item",
      "/api/outgoing-items": "/api/muda-outgoing-items",
      "/api/groceries": "/api/muda-groceries",
      "/api/melted-items": "/api/muda-melted-items",
      "/api/washing-items": "/api/muda-washing-items",
      "/api/sales": "/api/muda-sales",
      "/api/daily-summary": "/api/muda-daily-summary",
      "/api/daily-summary/lebur": "/api/muda-daily-summary/lebur",
      "/api/lebur-history": "/api/muda-lebur-history",
      // Note: /api/finance is shared between both modes since they use the same Finance table
    };

    return endpointMap[baseEndpoint] || baseEndpoint;
  }

  return baseEndpoint;
}

/**
 * Get the table prefix based on the current application mode
 */
export function getTablePrefix(mode: AppMode): string {
  return mode === "emas_muda" ? "muda" : "";
}

/**
 * Get the display name for the current mode
 */
export function getModeDisplayName(mode: AppMode): string {
  return mode === "emas_muda" ? "Emas Muda" : "Emas Tua";
}

/**
 * Get the code prefix for items based on the current mode
 */
export function getItemCodePrefix(mode: AppMode): string {
  return mode === "emas_muda" ? "M" : "";
}
