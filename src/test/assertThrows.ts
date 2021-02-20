import * as assert from "uvu/assert";

export async function assertThrows(
  test: () => void | Promise<void>,
  errorMessage?: string,
): Promise<void> {
  try {
    await test();
  } catch (error) {
    if (errorMessage !== undefined) {
      assert.ok((error.message as string).includes(errorMessage));
    } else {
      assert.ok(true);
    }
    return;
  }
  assert.ok(false, "function did not throw");
}
