// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from '../src/App';
import { ErrorBoundary } from '../src/components/ErrorBoundary';
import { CollectionPage } from '../src/pages/CollectionPage';
import { PersonalStateProvider } from '../src/personal-state/context';
import { PersonalStateDatabase, PersonalStateRepository } from '../src/personal-state/repository';
import { MemoryRouter } from 'react-router-dom';

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
  new Response(
    JSON.stringify(
      String(input).includes('listings')
        ? listings
        : String(input).includes('transactions')
          ? []
          : metadata,
    ),
    {
      status: 200,
    },
  );
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
        !String(input).includes('metadata')
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
    expect(screen.getByText(/資料版本 sha256-test/)).toBeTruthy();
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
    expect(await screen.findByText('目前沒有資料')).toBeTruthy();
  });
  it('routes unknown paths back to search within the application shell', async () => {
    window.location.hash = '#/unknown-page';
    vi.stubGlobal('fetch', vi.fn(responseFor));
    render(<App />);
    expect(await screen.findByRole('heading', { name: '找到下一個日常落腳處' })).toBeTruthy();
    expect(screen.getByRole('navigation', { name: '主要導覽' })).toBeTruthy();
  });
  it('marks fixture listings as examples in settings', async () => {
    window.location.hash = '#/settings';
    const fixtureListings = listings.map((listing) => ({
      ...listing,
      sourceListingId: 'fixture-1',
    }));
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL) =>
        Promise.resolve(
          String(input).includes('listings')
            ? new Response(JSON.stringify(fixtureListings), { status: 200 })
            : responseFor(input),
        ),
      ),
    );
    render(<App />);
    expect(await screen.findByRole('heading', { name: '設定與資料狀態' })).toBeTruthy();
    expect(
      await screen.findByText(
        '目前房源資料包含 fixture 範例資料，僅供功能測試，不代表即時來源房源。',
      ),
    ).toBeTruthy();
  });
  it('sorts personal collections by unit price and area', async () => {
    const makeListing = (id: string, unitPrice: number, mainArea: number) => ({
      ...listings[0]!,
      id,
      sourceListingId: id,
      title: id,
      unitPrice,
      mainArea,
    });
    const collectionListings = [
      makeListing('expensive-small', 900_000, 18),
      makeListing('cheap-large', 500_000, 30),
    ];
    const repository = new PersonalStateRepository(
      new PersonalStateDatabase(`collection-${Date.now()}`),
    );
    await repository.set('expensive-small', { favorite: true });
    await repository.set('cheap-large', { favorite: true });
    render(
      <PersonalStateProvider repository={repository}>
        <MemoryRouter>
          <CollectionPage title="收藏" listings={collectionListings} mode="favorite" />
        </MemoryRouter>
      </PersonalStateProvider>,
    );
    await screen.findByRole('link', { name: 'expensive-small' });
    const sort = screen.getByLabelText('排序');
    fireEvent.change(sort, { target: { value: 'UNIT_PRICE_ASC' } });
    const links = screen.getAllByRole('link').map((link) => link.textContent);
    expect(links.slice(0, 2)).toEqual(['cheap-large', 'expensive-small']);
    await repository.close();
  });
  it('searches personal collections by tag and sorts by age', async () => {
    const tagged = {
      ...listings[0]!,
      id: 'newer-home',
      sourceListingId: 'newer-home',
      title: '新房',
      buildingAge: 3,
    };
    const untagged = {
      ...listings[0]!,
      id: 'older-home',
      sourceListingId: 'older-home',
      title: '舊房',
      buildingAge: 20,
    };
    const repository = new PersonalStateRepository(
      new PersonalStateDatabase('tagged-' + Date.now()),
    );
    await repository.set('newer-home', { favorite: true, tags: ['通勤方便'] });
    await repository.set('older-home', { favorite: true });
    render(
      <PersonalStateProvider repository={repository}>
        <MemoryRouter>
          <CollectionPage title="收藏" listings={[untagged, tagged]} mode="favorite" />
        </MemoryRouter>
      </PersonalStateProvider>,
    );
    await screen.findByRole('link', { name: '新房' });
    fireEvent.change(screen.getByLabelText('搜尋清單'), { target: { value: '通勤方便' } });
    expect(screen.getAllByRole('link').map((link) => link.textContent)).toEqual(['新房']);
    fireEvent.change(screen.getByLabelText('搜尋清單'), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText('排序'), { target: { value: 'AGE_ASC' } });
    expect(screen.getAllByRole('link').map((link) => link.textContent)).toEqual(['新房', '舊房']);
    await repository.close();
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
