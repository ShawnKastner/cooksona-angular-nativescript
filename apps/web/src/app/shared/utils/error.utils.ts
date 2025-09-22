export function toErrorMessage(
  error: unknown,
  fallbackMessage: string,
): string {
  if (!error) return fallbackMessage;

  if (typeof error === 'string') {
    const trimmed = error.trim();
    return trimmed ? trimmed : fallbackMessage;
  }

  if (error instanceof Error) {
    const trimmed = error.message.trim();
    return trimmed ? trimmed : fallbackMessage;
  }

  if (typeof error === 'object') {
    const asRecord = error as Record<string, unknown>;

    const directMessage = asRecord['message'];
    if (typeof directMessage === 'string' && directMessage.trim()) {
      return directMessage.trim();
    }

    const nestedError = asRecord['error'];
    if (nestedError && nestedError !== error) {
      const nestedMessage = toErrorMessage(nestedError, fallbackMessage);
      if (nestedMessage !== fallbackMessage) {
        return nestedMessage;
      }
    }

    const messages = asRecord['messages'];
    if (Array.isArray(messages)) {
      const joined = messages
        .map((value) =>
          typeof value === 'string' ? value.trim() : toErrorMessage(value, ''),
        )
        .filter(Boolean)
        .join('\n');
      if (joined) return joined;
    }

    const detail = asRecord['detail'] ?? asRecord['reason'];
    if (typeof detail === 'string' && detail.trim()) {
      return detail.trim();
    }
  }

  return fallbackMessage;
}
