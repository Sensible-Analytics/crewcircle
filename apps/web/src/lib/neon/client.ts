import { neon } from '@neondatabase/serverless';

function getSql() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  return neon(connectionString);
}

export async function sql(strings: TemplateStringsArray, ...values: unknown[]) {
  const sqlFn = getSql();
  return sqlFn(strings, ...values);
}

export async function query<T = unknown>(strings: TemplateStringsArray, ...values: unknown[]) {
  const result = await getSql()(strings, ...values);
  return result as T[];
}
