// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import type { Listing } from '../shared/domain';
import { ListingDetailPage } from '../src/pages/ListingDetailPage';
import { PersonalStateDatabase, PersonalStateRepository } from '../src/personal-state/repository';
import { PersonalStateProvider } from '../src/personal-state/context';

const item: Listing = {
  id: '591-sale:detail',
  sourceId: '591-sale',
  sourceListingId: 'detail',
  listingType: 'USED',
  title: '明亮三房',
  totalPrice: 25000000,
  unitPrice: 800000,
  buildingArea: 32,
  mainArea: 22,
  rooms: 3,
  floor: 8,
  totalFloors: 15,
  hasElevator: true,
  hasParking: false,
  status: 'DELISTED',
  firstSeenAt: '2026-01-01T00:00:00.000Z',
  lastSeenAt: '2026-01-02T00:00:00.000Z',
  lastCheckedAt: '2026-01-02T00:00:00.000Z',
  relistCount: 0,
  missingSuccessCount: 0,
  contentHash: 'detail',
  rawDataHash: 'detail',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
};
describe('listing detail', () => {
  it('renders exact values, status, history, event and source link', async () => {
    const repository = new PersonalStateRepository(
      new PersonalStateDatabase(`detail-${Date.now()}`),
    );
    render(
      <PersonalStateProvider repository={repository}>
        <MemoryRouter initialEntries={['/listings/591-sale%3Adetail']}>
          <Routes>
            <Route
              path="/listings/:listingId"
              element={
                <ListingDetailPage
                  listings={[item]}
                  histories={[
                    {
                      id: 'h1',
                      listingId: item.id,
                      totalPrice: 25000000,
                      observedAt: '2026-01-02T00:00:00.000Z',
                    },
                  ]}
                  events={[
                    {
                      id: 'e1',
                      listingId: item.id,
                      eventType: 'RELISTED',
                      occurredAt: '2026-01-02T00:00:00.000Z',
                    },
                  ]}
                />
              }
            />
          </Routes>
        </MemoryRouter>
      </PersonalStateProvider>,
    );
    await waitFor(() => expect(screen.getByRole('heading', { name: '明亮三房' })).toBeTruthy());
    expect(screen.getByText('已下架')).toBeTruthy();
    expect(screen.getAllByText(/25,000,000 元/).length).toBeGreaterThan(0);
    expect(screen.getByText(/重新上架/)).toBeTruthy();
    await repository.close();
  });
  it('renders not found without white screen', async () => {
    const repository = new PersonalStateRepository(
      new PersonalStateDatabase(`missing-${Date.now()}`),
    );
    render(
      <PersonalStateProvider repository={repository}>
        <MemoryRouter initialEntries={['/listings/missing']}>
          <Routes>
            <Route
              path="/listings/:listingId"
              element={<ListingDetailPage listings={[]} histories={[]} events={[]} />}
            />
          </Routes>
        </MemoryRouter>
      </PersonalStateProvider>,
    );
    expect(await screen.findByText('找不到此房源')).toBeTruthy();
    await repository.close();
  });
  it('renders market duration and explicit empty image/price change states', async () => {
    const repository = new PersonalStateRepository(
      new PersonalStateDatabase(`empty-${Date.now()}`),
    );
    render(
      <PersonalStateProvider repository={repository}>
        <MemoryRouter initialEntries={['/listings/591-sale%3Adetail']}>
          <Routes>
            <Route
              path="/listings/:listingId"
              element={<ListingDetailPage listings={[item]} histories={[]} events={[]} />}
            />
          </Routes>
        </MemoryRouter>
      </PersonalStateProvider>,
    );
    await waitFor(() => expect(screen.getByText('上市天數')).toBeTruthy());
    expect(screen.getByText('圖片未提供。')).toBeTruthy();
    expect(screen.getByText('尚無價格變化紀錄。')).toBeTruthy();
    await repository.close();
  });
});
