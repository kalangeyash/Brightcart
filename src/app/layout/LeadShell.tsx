// Feature list row 4 · Lead shell and global navigation
// Traces to: 01-feature-list row 4 · 03-screen-specs header
// Serves: navigation frame · permanent sync visibility · lead actions

import { useState } from 'react';

import { useQuery } from '@tanstack/react-query';
import { Bell, LogOut, Search, Settings as SettingsIcon, Shield, User } from 'lucide-react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { api } from '@/services';

import { SyncBanner } from './SyncBanner';

export function LeadShell() {
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationCount, setNotificationCount] = useState(3);

  // Queries for shell state
  const syncQuery = useQuery({
    queryKey: ['sync-status', location.search],
    queryFn: () => api.getSyncStatus(),
    refetchInterval: 30_000
  });

  const unassignedQuery = useQuery({
    queryKey: ['unassigned-queue-count', location.search],
    queryFn: () => api.getUnassignedQueue(),
    refetchInterval: 30_000
  });

  const unassignedCount = unassignedQuery.data?.items.length ?? 9;
  const isSyncUnhealthy = syncQuery.data != null && !syncQuery.data.healthy;

  return (
    <div className='flex min-h-screen flex-col bg-[var(--color-parchment)]'>
      {/* Sync Failure Banner (Row 25) */}
      <SyncBanner sync={syncQuery.data} />

      {/* Primary Navigation Bar (Row 4) */}
      <header className='sticky top-0 z-30 border-b border-[var(--color-hairline)] bg-[var(--color-canvas)]'>
        <div className='mx-auto flex h-14 max-w-[1440px] items-center justify-between gap-4 px-6'>
          {/* Brand & Main Nav */}
          <div className='flex items-center gap-6'>
            <Link
              to='/'
              className='flex items-center gap-2 rounded-[var(--radius-control)] px-1 text-base font-bold tracking-tight text-[var(--color-ink)] transition-colors hover:text-[var(--color-primary)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary-ring)] focus-visible:outline-none'
            >
              <img
                src='/favicon/favicon-32x32.png'
                alt='Brightcart logo'
                className='h-6 w-6 object-contain'
              />
              <span>Support Desk</span>
            </Link>

            <nav className='hidden items-center gap-1 md:flex' aria-label='Main Navigation'>
              <NavLink
                to='/'
                end
                className={({ isActive }) =>
                  cn(
                    'rounded-[var(--radius-control)] px-3 py-1.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-[var(--color-primary-ring)] focus-visible:outline-none',
                    isActive
                      ? 'bg-[var(--color-primary-soft)] font-semibold text-[var(--color-primary)]'
                      : 'text-[var(--color-ink-muted)] hover:bg-[var(--color-pearl)] hover:text-[var(--color-ink)]'
                  )
                }
              >
                Team Overview
              </NavLink>

              <NavLink
                to='/unassigned'
                className={({ isActive }) =>
                  cn(
                    'inline-flex items-center gap-1.5 rounded-[var(--radius-control)] px-3 py-1.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-[var(--color-primary-ring)] focus-visible:outline-none',
                    isActive
                      ? 'bg-[var(--color-primary-soft)] font-semibold text-[var(--color-primary)]'
                      : 'text-[var(--color-ink-muted)] hover:bg-[var(--color-pearl)] hover:text-[var(--color-ink)]'
                  )
                }
              >
                <span>Unassigned</span>
                <span className='tabular py-0.2 inline-flex items-center justify-center rounded-full border border-[var(--color-primary)]/20 bg-[var(--color-primary-soft)] px-1.5 text-xs font-semibold text-[var(--color-primary)]'>
                  {unassignedCount}
                </span>
              </NavLink>

              <NavLink
                to='/tickets'
                className={({ isActive }) =>
                  cn(
                    'rounded-[var(--radius-control)] px-3 py-1.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-[var(--color-primary-ring)] focus-visible:outline-none',
                    isActive
                      ? 'bg-[var(--color-primary-soft)] font-semibold text-[var(--color-primary)]'
                      : 'text-[var(--color-ink-muted)] hover:bg-[var(--color-pearl)] hover:text-[var(--color-ink)]'
                  )
                }
              >
                All Tickets
              </NavLink>

              <NavLink
                to='/reports'
                className={({ isActive }) =>
                  cn(
                    'rounded-[var(--radius-control)] px-3 py-1.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-[var(--color-primary-ring)] focus-visible:outline-none',
                    isActive
                      ? 'bg-[var(--color-primary-soft)] font-semibold text-[var(--color-primary)]'
                      : 'text-[var(--color-ink-muted)] hover:bg-[var(--color-pearl)] hover:text-[var(--color-ink)]'
                  )
                }
              >
                Reports
              </NavLink>

              <NavLink
                to='/settings'
                className={({ isActive }) =>
                  cn(
                    'rounded-[var(--radius-control)] px-3 py-1.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-[var(--color-primary-ring)] focus-visible:outline-none',
                    isActive
                      ? 'bg-[var(--color-primary-soft)] font-semibold text-[var(--color-primary)]'
                      : 'text-[var(--color-ink-muted)] hover:bg-[var(--color-pearl)] hover:text-[var(--color-ink)]'
                  )
                }
              >
                Settings
              </NavLink>
            </nav>
          </div>

          {/* Right utility items: Search, Sync status, Notifications, Profile */}
          <div className='flex items-center gap-3'>
            {/* Global Search */}
            <div className='relative hidden w-48 sm:block lg:w-64'>
              <Search className='absolute top-2.5 left-2.5 h-3.5 w-3.5 text-[var(--color-ink-muted)]' />
              <Input
                type='search'
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                }}
                placeholder='Search tickets, order IDs…'
                className='h-8 border-[var(--color-control-line)] bg-[var(--color-parchment)] pl-8 text-xs focus:bg-[var(--color-canvas)]'
              />
            </div>

            {/* Permanent sync timestamp */}
            <div className='hidden flex-col text-right xl:flex'>
              <span className='tabular text-xs font-medium text-[var(--color-ink)]'>
                {isSyncUnhealthy ? 'Sync halted 08:14' : 'Synced 2 min ago'}
              </span>
              <span className='text-[11px] text-[var(--color-ink-muted)]'>
                support@brightcart.in
              </span>
            </div>

            {/* Notification Bell (Row 5) */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type='button'
                  aria-label='View notifications'
                  className='relative rounded-[var(--radius-control)] p-2 text-[var(--color-ink-muted)] hover:bg-[var(--color-pearl)] hover:text-[var(--color-ink)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary-ring)] focus-visible:outline-none'
                >
                  <Bell className='h-4 w-4' />
                  {notificationCount > 0 && (
                    <span className='tabular absolute top-1 right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[var(--color-primary)] px-1 text-[10px] leading-none font-bold text-white'>
                      {notificationCount}
                    </span>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end' className='w-80 shadow-[var(--shadow-overlay)]'>
                <div className='flex items-center justify-between p-3 pb-2'>
                  <DropdownMenuLabel className='p-0 text-xs font-semibold tracking-wider text-[var(--color-ink-muted)] uppercase'>
                    Notifications
                  </DropdownMenuLabel>
                  <button
                    type='button'
                    onClick={() => {
                      setNotificationCount(0);
                    }}
                    className='text-xs font-medium text-[var(--color-primary)] hover:underline'
                  >
                    Mark all read
                  </button>
                </div>
                <DropdownMenuSeparator />
                <div className='max-h-64 overflow-auto py-1'>
                  <DropdownMenuItem className='flex cursor-pointer flex-col items-start gap-1 p-2.5'>
                    <div className='flex w-full items-center justify-between'>
                      <span className='text-xs font-semibold text-[var(--color-ink)]'>
                        #BC-4821 · Ritika Sharma
                      </span>
                      <span className='tabular text-[11px] font-medium text-[var(--color-urgent-ink)]'>
                        52 min left
                      </span>
                    </div>
                    <p className='line-clamp-1 text-xs text-[var(--color-ink-muted)]'>
                      Refund not received — ORD-98213
                    </p>
                  </DropdownMenuItem>

                  <DropdownMenuItem className='flex cursor-pointer flex-col items-start gap-1 p-2.5'>
                    <div className='flex w-full items-center justify-between'>
                      <span className='text-xs font-semibold text-[var(--color-ink)]'>
                        3 tickets unowned
                      </span>
                      <span className='tabular text-[11px] text-[var(--color-ink-muted)]'>
                        since 09:12
                      </span>
                    </div>
                    <p className='line-clamp-1 text-xs text-[var(--color-ink-muted)]'>
                      Unowned over 30 min target threshold
                    </p>
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type='button'
                  aria-label='User profile menu'
                  className='flex items-center gap-2 rounded-[var(--radius-control)] p-1 pl-2 text-left hover:bg-[var(--color-pearl)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary-ring)] focus-visible:outline-none'
                >
                  <div className='hidden flex-col text-right md:flex'>
                    <span className='text-xs font-semibold text-[var(--color-ink)]'>
                      Manoj Patil
                    </span>
                    <span className='text-[11px] text-[var(--color-ink-muted)]'>Support Lead</span>
                  </div>
                  <Avatar className='h-7 w-7 border-[var(--color-hairline)]'>
                    <AvatarFallback className='bg-[var(--color-primary)] text-xs font-medium text-white'>
                      MP
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end' className='w-56 shadow-[var(--shadow-overlay)]'>
                <DropdownMenuLabel className='font-normal'>
                  <div className='flex flex-col space-y-1'>
                    <p className='text-sm font-semibold text-[var(--color-ink)]'>Manoj Patil</p>
                    <p className='text-xs text-[var(--color-ink-muted)]'>manoj.p@brightcart.in</p>
                    <span className='inline-flex items-center gap-1 text-[11px] font-medium text-[var(--color-primary)]'>
                      <Shield className='h-3 w-3' />
                      Support Lead
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to='/settings' className='cursor-pointer gap-2'>
                    <SettingsIcon className='h-4 w-4 text-[var(--color-ink-muted)]' />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to='/' className='cursor-pointer gap-2'>
                    <User className='h-4 w-4 text-[var(--color-ink-muted)]' />
                    <span>Switch view</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className='cursor-pointer gap-2 text-[var(--color-danger)] focus:text-[var(--color-danger)]'>
                  <LogOut className='h-4 w-4' />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Content Area */}
      <main className='mx-auto w-full max-w-[1440px] flex-1 px-6 py-6'>
        <Outlet context={{ sync: syncQuery.data }} />
      </main>
    </div>
  );
}
