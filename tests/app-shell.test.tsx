// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from '../src/App';
import { ErrorBoundary } from '../src/components/ErrorBoundary';

const metadata = {
  schemaVersion: 1,
  appDataVersion: 'sha256-test',
  generatedAt: '2026-01-01T00:00:00.000Z',
  counts: { listings: 1, priceHistory: 0, listingEvents: 0, transactions: 0 },
  sources: [],
};
const listings = [
  {
    id: '591-sale:1',
    sourceId: '591-sale',
    sourceListingId: '1',
    listingType: 'USED',
    status: 'ACTIVE',
    firstSeenAt: '2026-01-01T00:00:00.000Z',
    lastSeenAt: '2026-01-01T00:00:00.000Z',
    lastCheckedAt: '2026-01-01T00:00:00.000Z',
    relistCount: 0,
    missingSuccessCount: 0,
    contentHash: 'x',
    rawDataHash: 'x',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
];
const responseFor = (input: RequestInfo | URL) =>
  new Response(JSON.stringify(String(input).includes('listings') ? listings : metadata), {
    status: 200,
  });
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  window.location.hash = '';
});

describe('application shell', () => {
  it('renders the loading and success states', async () => {
    let resolveFetch: ((response: Response) => void) | undefined;
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL) =>
        String(input).includes('listings')
          ? Promise.resolve(responseFor(input))
          : new Promise<Response>((resolve) => {
              resolveFetch = resolve;
            }),
      ),
    );
    render(<App />);
    expect(screen.getByText('正在準備 HomeHunt')).toBeTruthy();
    resolveFetch?.(responseFor('metadata'));
    await waitFor(() => expect(screen.getByText('符合 1 筆')).toBeTruthy());
    expect(screen.getByRole('navigation', { name: '主要導覽' })).toBeTruthy();
  });
  it('renders metadata errors instead of a blank page', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    render(<App />);
    expect(await screen.findByText('公開資料載入失敗')).toBeTruthy();
    expect(screen.getByRole('button', { name: '重新載入' })).toBeTruthy();
  });
  it('renders a hash route placeholder', async () => {
    window.location.hash = '#/favorites';
    vi.stubGlobal('fetch', vi.fn(responseFor));
    render(<App />);
    expect(await screen.findByRole('heading', { name: '收藏' })).toBeTruthy();
  });
  it('contains component crashes in the error boundary', () => {
    const Thrower = () => {
      throw new Error('boom');
    };
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    render(
      <ErrorBoundary>
        <Thrower />
      </ErrorBoundary>,
    );
    expect(screen.getByText('HomeHunt 暫時無法顯示')).toBeTruthy();
  });
});
