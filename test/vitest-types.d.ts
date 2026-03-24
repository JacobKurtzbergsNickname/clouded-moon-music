type Mock<
  T extends (...args: unknown[]) => unknown = (...args: unknown[]) => unknown,
> = import("vitest").Mock<T>;
type Mocked<T> = import("vitest").Mocked<T>;
