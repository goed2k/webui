import i18n from "@/i18n";

/** 规范要求覆盖的业务错误码 */
export const KNOWN_ERROR_CODES = [
  "UNAUTHORIZED",
  "ENGINE_NOT_RUNNING",
  "ENGINE_ALREADY_RUNNING",
  "TRANSFER_NOT_FOUND",
  "INVALID_ED2K_LINK",
  "SEARCH_ALREADY_RUNNING",
  "SEARCH_NOT_RUNNING",
  "CONFIG_INVALID",
  "STATE_STORE_ERROR",
  "SHARED_FILE_NOT_FOUND",
] as const;

export function errorCodeLabel(code: string): string {
  const key = `errors.codes.${code}`;
  if (i18n.exists(key)) return String(i18n.t(key));
  return code;
}
