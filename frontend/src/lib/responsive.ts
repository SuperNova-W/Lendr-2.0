import { Platform, useWindowDimensions } from 'react-native';

// Width breakpoints (px). Mobile is the implicit base (< md).
export const BREAKPOINTS = { md: 768, lg: 1024, xl: 1280 };

// Target card width used to decide how many grid columns fit on the web, so the
// grid fills the screen edge-to-edge instead of capping at a fixed column count.
const CARD_TARGET = 250;

export interface Responsive {
  width: number;
  height: number;
  isTablet: boolean;   // >= md
  isDesktop: boolean;  // >= lg
  /** True only on the web at desktop widths — drives the top-nav, full-width layout. */
  isWebDesktop: boolean;
  /** Columns for a card grid at the current width. */
  columns: number;
  /** Max width for page content. Full width on the web; original caps on native. */
  contentMaxWidth: number;
}

// Single source of truth for responsive layout decisions. Uses
// useWindowDimensions so it re-renders on resize (unlike Dimensions.get()).
//
// The web build is a real full-width desktop app: content fills the window and
// grids tile as many columns as fit. Native (iOS/Android) keeps its original
// single-/few-column phone + tablet layout untouched.
export function useResponsive(): Responsive {
  const { width, height } = useWindowDimensions();
  const isTablet = width >= BREAKPOINTS.md;
  const isDesktop = width >= BREAKPOINTS.lg;
  const isWeb = Platform.OS === 'web';
  const isWebDesktop = isWeb && isDesktop;

  const columns = isWeb
    // Web: fill the screen with as many ~250px cards as fit (at least 1).
    ? Math.max(1, Math.floor((width - 24) / CARD_TARGET))
    // Native: original phone/tablet column counts.
    : width >= BREAKPOINTS.xl ? 4 : width >= BREAKPOINTS.lg ? 3 : isTablet ? 2 : 1;

  const contentMaxWidth = isWeb
    // Web: content spans the full window.
    ? width
    // Native: original centered caps on tablets.
    : isDesktop ? 1200 : isTablet ? 760 : width;

  return { width, height, isTablet, isDesktop, isWebDesktop, columns, contentMaxWidth };
}
