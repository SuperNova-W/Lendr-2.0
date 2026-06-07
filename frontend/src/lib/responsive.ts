import { useWindowDimensions } from 'react-native';

// Width breakpoints (px). Mobile is the implicit base (< md).
export const BREAKPOINTS = { md: 768, lg: 1024, xl: 1280 };

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

  const columns = width >= BREAKPOINTS.xl ? 4 : width >= BREAKPOINTS.lg ? 3 : isTablet ? 2 : 1;
  const contentMaxWidth = isDesktop ? 1200 : isTablet ? 760 : width;

  return { width, height, isTablet, isDesktop, columns, contentMaxWidth };
}
