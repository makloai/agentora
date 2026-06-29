import type { Manifest, ManifestEntry } from '@agentora/core';
import { describe, expect, it } from 'vitest';
import { doctor } from '../src/index';

function manifest(...actions: Partial<ManifestEntry>[]): Manifest {
  return {
    version: 1,
    actions: actions.map((a) => ({
      name: 'x',
      sideEffects: 'none',
      idempotency: 'none',
      input: {},
      output: {},
      ...a,
    })),
  };
}

const goodRead: Partial<ManifestEntry> = {
  name: 'orders.list',
  description: 'List orders',
  sideEffects: 'read',
};

const goodWrite: Partial<ManifestEntry> = {
  name: 'orders.create',
  description: 'Create an order',
  sideEffects: 'write',
  idempotency: 'always',
  auth: { scopes: ['orders:write'] },
  concurrency: 4,
};

describe('doctor', () => {
  it('flags nothing on a fully-annotated read action', () => {
    const report = doctor(manifest(goodRead));
    expect(report.findings).toEqual([]);
    expect(report.score).toBe(100);
  });

  it('flags nothing on a fully-annotated write action', () => {
    expect(doctor(manifest(goodWrite)).findings).toEqual([]);
  });

  it('errors when a write action declares no idempotency', () => {
    const report = doctor(manifest({ ...goodWrite, idempotency: 'none' }));
    const finding = report.findings.find((f) => f.rule === 'write-idempotency');
    expect(finding?.severity).toBe('error');
  });

  it('warns when a write action has no permission hook', () => {
    const report = doctor(manifest({ ...goodWrite, auth: undefined }));
    const finding = report.findings.find((f) => f.rule === 'write-permission');
    expect(finding?.severity).toBe('warn');
  });

  it('warns when a write action declares unbounded concurrency', () => {
    const report = doctor(manifest({ ...goodWrite, concurrency: undefined }));
    expect(report.findings.some((f) => f.rule === 'write-concurrency')).toBe(true);
  });

  it('warns when an action has no description', () => {
    const report = doctor(manifest({ ...goodRead, description: undefined }));
    expect(report.findings.some((f) => f.rule === 'description')).toBe(true);
  });

  it('scores an empty manifest at 100', () => {
    expect(doctor(manifest()).score).toBe(100);
  });

  it('is monotonic: fixing a problem never lowers the score', () => {
    const bad = doctor(manifest({ ...goodWrite, idempotency: 'none', auth: undefined }));
    const better = doctor(manifest({ ...goodWrite, auth: undefined }));
    const best = doctor(manifest(goodWrite));
    expect(better.score).toBeGreaterThanOrEqual(bad.score);
    expect(best.score).toBeGreaterThanOrEqual(better.score);
    expect(best.score).toBe(100);
  });
});
