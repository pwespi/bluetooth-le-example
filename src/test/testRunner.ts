const initialState = {
  suites: {
    total: 0,
    passed: 0,
  },
  tests: {
    total: 0,
    passed: 0,
  },
  currentSuite: {
    name: "",
    tests: {
      total: 0,
      passed: 0,
    },
  },
  currentTest: {
    name: "",
    assertions: {
      total: 0,
      passed: 0,
    },
  },
  startTime: 0,
};

let state: typeof initialState;

export function initializeTest(): void {
  state = JSON.parse(JSON.stringify(initialState));
  state.startTime = new Date().getTime();
}

export function printResult(): string {
  const result = `Test result: ${state.currentSuite.name}
  Test suites: ${state.suites.passed} / ${state.suites.total} passed
  Tests:       ${state.tests.passed} / ${state.tests.total} passed
  Time:        ${(new Date().getTime() - state.startTime) / 1000} seconds
  Result:      ${
    state.suites.passed === state.suites.total ? "PASSED" : "FAILED"
  }
  `;
  console.log(result);
  return result;
}

export async function describe(
  name: string,
  testSuite: () => void,
): Promise<void> {
  state.currentSuite = JSON.parse(JSON.stringify(initialState.currentSuite));
  state.currentSuite.name = name;
  state.suites.total += 1;

  console.log(name);
  await testSuite();

  if (state.currentSuite.tests.passed === state.currentSuite.tests.total) {
    state.suites.passed += 1;
  }
}

export async function it(
  message: string,
  test: () => void | Promise<void>,
): Promise<void> {
  state.currentTest = JSON.parse(JSON.stringify(initialState.currentTest));
  state.currentTest.name = message;

  state.tests.total += 1;
  state.currentSuite.tests.total += 1;

  try {
    await test();
    console.info(`    √ ${state.currentTest.name}`);
    state.tests.passed += 1;
    state.currentSuite.tests.passed += 1;
  } catch (error) {
    console.error(
      `    × ${state.currentTest.name} - test failed.`,
      error?.message,
    );
  }
}
