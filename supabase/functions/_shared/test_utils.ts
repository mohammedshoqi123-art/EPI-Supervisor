/**
 * Test utilities for Supabase Edge Functions.
 * Provides mock factories for requests, Supabase clients, and auth contexts.
 */

// ─── Mock Request Factory ───────────────────────────────────
export function createMockRequest(
  method: string,
  body?: unknown,
  headers: Record<string, string> = {}
): Request {
  const init: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  if (body && method !== 'GET') {
    init.body = JSON.stringify(body);
  }

  return new Request('http://localhost:8000', init);
}

// ─── Mock Supabase Client ───────────────────────────────────
interface MockRow {
  [key: string]: unknown;
}

interface MockQueryBuilder {
  select: (cols?: string) => MockQueryBuilder;
  insert: (data: unknown) => MockQueryBuilder;
  update: (data: unknown) => MockQueryBuilder;
  delete: () => MockQueryBuilder;
  eq: (col: string, val: unknown) => MockQueryBuilder;
  neq: (col: string, val: unknown) => MockQueryBuilder;
  is: (col: string, val: unknown) => MockQueryBuilder;
  gte: (col: string, val: unknown) => MockQueryBuilder;
  lte: (col: string, val: unknown) => MockQueryBuilder;
  order: (col: string, opts?: Record<string, unknown>) => MockQueryBuilder;
  limit: (n: number) => MockQueryBuilder;
  range: (from: number, to: number) => MockQueryBuilder;
  single: () => Promise<{ data: MockRow | null; error: Error | null }>;
  maybeSingle: () => Promise<{ data: MockRow | null; error: Error | null }>;
  then: (
    resolve: (val: { data: MockRow[] | null; error: Error | null }) => void
  ) => void;
}

export function createMockSupabase(options: {
  tables?: Record<string, MockRow[]>;
  rpcResults?: Record<string, unknown>;
  authUser?: { id: string; email: string } | null;
} = {}) {
  const { tables = {}, rpcResults = {}, authUser = null } = options;

  function buildQuery(tableName: string): MockQueryBuilder {
    let filteredRows = [...(tables[tableName] || [])];
    let insertData: unknown = null;
    let updateData: unknown = null;
    let shouldDelete = false;

    const chain: MockQueryBuilder = {
      select: () => chain,
      insert: (data) => {
        insertData = data;
        return chain;
      },
      update: (data) => {
        updateData = data;
        return chain;
      },
      delete: () => {
        shouldDelete = true;
        return chain;
      },
      eq: (col, val) => {
        filteredRows = filteredRows.filter((r) => r[col] === val);
        return chain;
      },
      neq: (col, val) => {
        filteredRows = filteredRows.filter((r) => r[col] !== val);
        return chain;
      },
      is: (col, val) => {
        if (val === null) {
          filteredRows = filteredRows.filter((r) => r[col] === null || r[col] === undefined);
        }
        return chain;
      },
      gte: (_col, _val) => chain,
      lte: (_col, _val) => chain,
      order: () => chain,
      limit: (n) => {
        filteredRows = filteredRows.slice(0, n);
        return chain;
      },
      range: () => chain,
      single: async () => {
        if (insertData) {
          const newRow = { id: crypto.randomUUID(), ...(insertData as MockRow) };
          return { data: newRow, error: null };
        }
        if (updateData) {
          const updated = { ...filteredRows[0], ...(updateData as MockRow) };
          return { data: updated, error: null };
        }
        if (shouldDelete) {
          return { data: filteredRows[0] ?? null, error: null };
        }
        return {
          data: filteredRows.length > 0 ? filteredRows[0] : null,
          error: filteredRows.length === 0 ? new Error('Not found') : null,
        };
      },
      maybeSingle: async () => {
        return {
          data: filteredRows.length > 0 ? filteredRows[0] : null,
          error: null,
        };
      },
      then: (resolve) => {
        if (insertData) {
          const newRow = { id: crypto.randomUUID(), ...(insertData as MockRow) };
          resolve({ data: [newRow], error: null });
        } else if (updateData) {
          resolve({ data: filteredRows.map((r) => ({ ...r, ...(updateData as MockRow) })), error: null });
        } else if (shouldDelete) {
          resolve({ data: filteredRows, error: null });
        } else {
          resolve({ data: filteredRows, error: null });
        }
      },
    };
    return chain;
  }

  return {
    from: (tableName: string) => buildQuery(tableName),
    rpc: async (fnName: string, params?: Record<string, unknown>) => {
      if (rpcResults[fnName] !== undefined) {
        return { data: rpcResults[fnName], error: null };
      }
      return { data: null, error: new Error(`RPC ${fnName} not mocked`) };
    },
    auth: {
      getUser: async () => ({
        data: {
          user: authUser
            ? { id: authUser.id, email: authUser.email, user_metadata: {}, app_metadata: {} }
            : null,
        },
        error: authUser ? null : new Error('Not authenticated'),
      }),
    },
  };
}

// ─── Test Runner ────────────────────────────────────────────
interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  duration: number;
}

export async function runTests(
  tests: Array<{ name: string; fn: () => Promise<void> }>
): Promise<TestResult[]> {
  const results: TestResult[] = [];

  for (const test of tests) {
    const start = performance.now();
    try {
      await test.fn();
      results.push({
        name: test.name,
        passed: true,
        duration: performance.now() - start,
      });
    } catch (e) {
      results.push({
        name: test.name,
        passed: false,
        error: e instanceof Error ? e.message : String(e),
        duration: performance.now() - start,
      });
    }
  }

  return results;
}

export function printResults(results: TestResult[]): void {
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  console.log('\n' + '═'.repeat(60));
  console.log(`  Test Results: ${passed} passed, ${failed} failed, ${results.length} total`);
  console.log('═'.repeat(60));

  for (const r of results) {
    const icon = r.passed ? '✅' : '❌';
    const duration = `${r.duration.toFixed(1)}ms`;
    console.log(`  ${icon} ${r.name} (${duration})`);
    if (r.error) {
      console.log(`     └─ Error: ${r.error}`);
    }
  }

  console.log('═'.repeat(60) + '\n');
}
