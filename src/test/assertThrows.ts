import * as assert from "uvu/assert";

export async function assertThrows(
  test: () => void | Promise<void>,
  errorMessage?: string,
): Promise<void> {
  try {
    await test();
  } catch (error) {
    if (errorMessage !== undefined) {
      assert.ok(
        (error.message as string)
          ?.toLowerCase()
          ?.includes?.(errorMessage.toLowerCase()) || // throw new Error()
          (error as string)
            ?.toLowerCase()
            ?.includes?.(errorMessage.toLowerCase()), // Promise.reject
        `message '${errorMessage}' not found in error`,
      );
    } else {
      assert.ok(true);
    }
    return;
  }
  assert.ok(false, "function did not throw");
}
