export type PatchedMethod<Receiver, Args extends unknown[], Result> = (
  this: Receiver,
  ...args: Args
) => Result;

export interface MethodPatch {
  dispose(): void;
  isCurrent(): boolean;
}

/** Un wrapper desactivado siempre delega, incluso si otro plugin lo conserva. */
export function patchMethod<Receiver = unknown, Args extends unknown[] = unknown[], Result = unknown>(
  target: object,
  key: string,
  handler: (original: PatchedMethod<Receiver, Args, Result>, receiver: Receiver, args: Args) => Result
): MethodPatch {
  const record = target as Record<string, unknown>;
  const descriptor = Object.getOwnPropertyDescriptor(target, key);
  const candidate = record[key];
  if (typeof candidate !== 'function') throw new Error(`Método incompatible: ${key}`);
  // La firma privada la proporciona quien adapta el método, tras comprobar que es invocable.
  const original = candidate as PatchedMethod<Receiver, Args, Result>;
  let active = true;
  const wrapper: PatchedMethod<Receiver, Args, Result> = function (this: Receiver, ...args: Args) {
    return active ? handler(original, this, args) : original.apply(this, args);
  };
  Object.defineProperty(target, key, {
    value: wrapper,
    writable: true,
    configurable: true,
    enumerable: descriptor?.enumerable ?? false
  });
  return {
    isCurrent: () => active && record[key] === wrapper,
    dispose() {
      if (!active) return;
      active = false;
      if (record[key] !== wrapper) return;
      if (descriptor) Object.defineProperty(target, key, descriptor);
      else delete record[key];
    }
  };
}
