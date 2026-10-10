import { describe, expect, it, vi } from "vitest";
import { patchMethod, type PatchedMethod } from "../src/patch";

describe("patchMethod", () => {
  it("conserva this y los argumentos y restaura el método al desactivar", () => {
    const target = {
      offset: 4,
      sum(left: number, right: number) { return this.offset + left + right; },
    };
    const original = target.sum;
    const patch = patchMethod<typeof target, [number, number], number>(
      target, "sum", (method, receiver, args) => method.apply(receiver, args) * 2,
    );
    expect(patch.isCurrent()).toBe(true);
    expect(target.sum(1, 2)).toBe(14);
    patch.dispose();
    expect(target.sum).toBe(original);
    expect(target.sum(1, 2)).toBe(7);
    expect(patch.isCurrent()).toBe(false);
    patch.dispose();
    expect(target.sum).toBe(original);
  });

  it("restaura el descriptor original completo", () => {
    const target = {};
    const original = () => "original";
    const descriptor = { value: original, enumerable: true, writable: false, configurable: true };
    Object.defineProperty(target, "read", descriptor);
    const patch = patchMethod(target, "read", () => "patched");
    patch.dispose();
    expect(Object.getOwnPropertyDescriptor(target, "read")).toEqual(descriptor);
  });

  it("elimina el wrapper propio para recuperar un método heredado", () => {
    const prototype = { value() { return 7; } };
    const target = Object.create(prototype) as typeof prototype;
    const patch = patchMethod(target, "value", () => 8);
    expect(Object.hasOwn(target, "value")).toBe(true);
    expect(target.value()).toBe(8);
    patch.dispose();
    expect(Object.hasOwn(target, "value")).toBe(false);
    expect(target.value()).toBe(7);
  });

  it("delega tras desactivarse aunque otro plugin conserve y envuelva el wrapper", () => {
    const target = { value(input: number) { return input * 2; } };
    const handler = vi.fn((
      method: PatchedMethod<typeof target, [number], number>,
      receiver: typeof target,
      args: [number],
    ) => method.apply(receiver, args) + 10);
    const patch = patchMethod(target, "value", handler);
    const preserved = target.value;
    const otherPlugin = (input: number) => preserved.call(target, input) + 100;
    target.value = otherPlugin;
    expect(patch.isCurrent()).toBe(false);
    expect(target.value(3)).toBe(116);
    expect(handler).toHaveBeenCalledTimes(1);
    patch.dispose();
    expect(target.value).toBe(otherPlugin);
    expect(target.value(3)).toBe(106);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("rechaza métodos ausentes o valores que no son funciones", () => {
    expect(() => patchMethod({}, "missing", () => null)).toThrow("Método incompatible: missing");
    expect(() => patchMethod({ value: 42 }, "value", () => null)).toThrow("Método incompatible: value");
  });

  it("conserva las excepciones del método original", () => {
    const failure = new Error("original failure");
    const target = { fail() { throw failure; } };
    const patch = patchMethod(target, "fail", (original, receiver, args) => original.apply(receiver, args));
    expect(() => target.fail()).toThrow(failure);
    patch.dispose();
    expect(() => target.fail()).toThrow(failure);
  });

  it("conserva métodos asíncronos y delega tras desactivarse", async () => {
    const target = { value(input: number) { return Promise.resolve(input * 2); } };
    const original = target.value;
    const patch = patchMethod<typeof target, [number], Promise<number>>(
      target, "value", async (method, receiver, args) => (await method.apply(receiver, args)) + 10,
    );
    const preserved = target.value;
    await expect(target.value(3)).resolves.toBe(16);
    patch.dispose();
    expect(target.value).toBe(original);
    await expect(preserved.call(target, 3)).resolves.toBe(6);
  });
});
