import { useWindowDimensions } from 'react-native';

// Width breakpoints (px). Mobile is the implicit base (< md).
export const BREAKPOINTS = { md: 768, lg: 1024, xl: 1280 };

// Single, app-wide max width for page content. Every screen caps + centers its
// root at this width on the web so the layout reads as one uniform column on a
// gray backdrop instead of each screen sizing itself differently. On phones the
// screen is always narrower than this, so the cap is inert and native layout is
// unchanged.
export const SHELL_MAX = 760;

export interface Responsive {
  width: number;
  height: number;
  isTablet: boolean;   // >= md
  isDesktop: boolean;  // >= lg
  /** Columns for a card grid at the current width. */
  columns: number;
  /** Max width for centered page content on wide screens. */
  contentMaxWidth: number;
}

// Single source of truth for responsive layout decisions. Uses
// useWindowDimensions so it re-renders on resize (unlike Dimensions.get()).
export function useResponsive(): Responsive {
  const { width, height } = useWindowDimensions();
  const isTablet = width >= BREAKPOINTS.md;
  const isDesktop = width >= BREAKPOINTS.lg;

  // Grids tile within the shell, not the full window — so a wide desktop shows a
  // tidy 2-up grid in the centered column rather than 3–4 cards spread edge to
  // edge. Phones (effective width < 600) stay single-column.
  const effectiveWidth = Math.min(width, SHELL_MAX);
  const columns = effectiveWidth >= 600 ? 2 : 1;
  // One uniform content width everywhere. Capped to the window on narrow phones.
  const contentMaxWidth = Math.min(SHELL_MAX, width);

  return { width, height, isTablet, isDesktop, columns, contentMaxWidth };
}
