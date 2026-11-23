import test from "node:test";
import assert from "node:assert/strict";
import { databaseConnectionString } from "../src/shared/server/database/connection-url.ts";

test("TLS explicita verify-full mantendo a verificação atual e respeita compatibilidade solicitada", () => {
  for (const mode of ["prefer", "require", "verify-ca"]) {
    const result = new URL(
      databaseConnectionString(
        `postgres://fixture:password@db.example.test:5432/catalog?sslmode=${mode}&application_name=gestao`,
      ),
    );
    assert.equal(result.searchParams.get("sslmode"), "verify-full");
    assert.equal(result.searchParams.get("application_name"), "gestao");
    assert.equal(result.hostname, "db.example.test");
  }
  for (const value of [
    "postgresql://localhost/test",
    "postgres://localhost/test?sslmode=verify-full",
    "postgres://localhost/test?sslmode=require&uselibpqcompat=true",
    "postgres://localhost/test?sslmode=disable",
    "fixture",
  ]) {
    assert.equal(databaseConnectionString(` ${value} `), value);
  }
});
