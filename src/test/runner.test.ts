import * as assert from "uvu/assert";

import { sleep } from "../helpers/sleep";

import { assertThrows } from "./assertThrows";
import { describe, it } from "./testRunner";

export async function testRunner(): Promise<void> {
  await describe("Custom test runner", async () => {
    await it("ERROR: should show error on false", async () => {
      assert.ok(false);
    });

    await it("should not show error on true", () => {
      assert.ok(true);
    });

    await it("should wait for async code", async () => {
      await sleep(500);
      assert.ok(true);
    });

    await it("ERROR: should wait for async code then detect false", async () => {
      await sleep(500);
      assert.ok(false);
    });

    await it("should assert throws", async () => {
      const test = async () => {
        throw new Error("some message");
      };
      await assertThrows(test);
    });

    await it("should assert throws with message", async () => {
      const test = async () => {
        throw new Error("some message");
      };
      await assertThrows(test, "some message");
    });

    await it("ERROR: assert throws with wrong message", async () => {
      const test = async () => {
        throw new Error("some message");
      };
      await assertThrows(test, "some other message");
    });

    await it("ERROR: should show error if no error was thrown", async () => {
      const test2 = () => {
        // I don't throw
      };
      await assertThrows(test2);
    });

    await it("ERROR: should show uncaught errors", async () => {
      const test = async () => {
        throw new Error("some message");
      };
      await test();
      assert.ok(true);
    });

    await it("assert.equal", async () => {
      assert.equal(1, 1);
    });

    await it("ERROR: assert.equal", async () => {
      assert.equal(1, 2);
    });

    await it("should compare arrays", async () => {
      assert.equal([1, 0], [1, 0]);
    });

    await it("ERROR: should compare arrays", async () => {
      assert.equal([1, 0], [1, 2]);
    });
  });

  await describe("Test suite that passes", async () => {
    it("should pass this test", async () => {
      assert.ok(true);
    });
  });
}
