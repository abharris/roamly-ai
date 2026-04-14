// ─── COLOR TOKENS ────────────────────────────────────────────────────────────

export const Colors = {
  // Brand — Primary midnight navy (headers, buttons, active nav, chips)
  primary:       '#2D3250',
  primaryLight:  '#E1F5EE',   // teal-light — selected states, secondary button bg
  primaryDark:   '#222640',   // dark navy hover
  primaryBorder: '#9FE1CB',   // light teal for text/icons on dark (#2D3250) backgrounds

  // Teal — accent only (tags, progress fills, borders, active dot, success)
  teal:       '#1D9E75',
  tealLight:  '#E1F5EE',
  tealDark:   '#0F6E56',

  // Amber — highlight only (stars, AI features, ratings, map pins)
  accent:       '#EF9F27',
  accentLight:  '#FAEEDA',
  accentDark:   '#854F0B',

  // Sky Blue — secondary info (links, info badges)
  secondary:       '#378ADD',
  secondaryLight:  '#E6F1FB',
  secondaryDark:   '#185FA5',

  // Backgrounds — neutral, no green tint
  bg:           '#F8F9FA',
  bgAlt:        '#F0F2F5',
  segmentTrack: '#EEEFF1',   // segmented control track background
  white:        '#FFFFFF',

  // Cards
  card:         '#FFFFFF',
  cardBorder:   '#E8EAED',   // neutral gray — replaces teal card border

  // Icon tiles — default (non-category)
  iconTileBg:   '#F0F4FF',   // soft blue-gray
  iconTileText: '#2D3250',   // navy

  // Text
  textPrimary:   '#1a1a2e',  // near-black with cool undertone
  textSecondary: '#6B7280',
  textMuted:     '#B4B2A9',
  textDisabled:  '#D3D1C7',
  textOnDark:    '#FFFFFF',

  // Borders & dividers — neutral
  border:      '#E8EAED',
  borderLight: '#F0F2F5',
  divider:     '#EAECEF',

  // Semantic
  error:        '#E24B4A',
  errorLight:   '#FDECEA',
  errorDark:    '#991B1B',
  success:      '#1D9E75',   // = teal
  successLight: '#E1F5EE',
  warning:      '#EF9F27',   // = amber
  warningLight: '#FAEEDA',

  // Category — Nature / Outdoors (teal)
  natureBg:   '#E1F5EE',
  natureText: '#0F6E56',

  // Category — Food / Restaurant (amber)
  foodBg:   '#FAEEDA',
  foodText: '#854F0B',

  // Category — Coffee / Cafe (sky)
  coffeeBg:   '#E6F1FB',
  coffeeText: '#185FA5',

  // Category — Bar / Nightlife (pink)
  barBg:   '#FBEAF0',
  barText: '#993556',

  // Category — Hotel (sky)
  hotelBg:   '#E6F1FB',
  hotelText: '#185FA5',

  // Category — Activity (purple)
  activityBg:   '#EDE9FE',
  activityText: '#5B21B6',

  // Category — Shop (teal)
  shopBg:   '#E1F5EE',
  shopText: '#0F6E56',

  // Category — Transport (amber)
  transportBg:   '#FAEEDA',
  transportText: '#854F0B',

  // Deprecated aliases — kept for backward compat
  mint:          '#E1F5EE',
  primaryLight2: '#A8D9C8',
  amber:         '#EF9F27',
  amberLight:    '#FAEEDA',
  sky:           '#378ADD',
  skyLight:      '#E6F1FB',
  pink:          '#D4537E',
  pinkLight:     '#FBEAF0',
  purple:        '#6D28D9',
  purpleLight:   '#EDE9FE',
  green:         '#047857',
  greenLight:    '#D1FAE5',
  orange:        '#C2410C',
  orangeLight:   '#FFEDD5',
};

// ─── TYPOGRAPHY TOKENS ───────────────────────────────────────────────────────

export const Fonts = {
  // Plus Jakarta Sans — headings, names, UI labels
  displayBold:     'PlusJakartaSans_800ExtraBold',
  displaySemiBold: 'PlusJakartaSans_700Bold',
  displayMedium:   'PlusJakartaSans_600SemiBold',

  // Inter — body text, descriptions, addresses
  body:         'Inter_400Regular',
  bodyMedium:   'Inter_500Medium',
  bodySemiBold: 'Inter_600SemiBold',

  // DM Mono — tags, chips, labels, nav, metadata
  mono:       'DMMono_400Regular',
  monoMedium: 'DMMono_500Medium',
};

export const FontSizes = {
  hero:    28,
  title:   22,
  heading: 20,
  subhead: 17,
  body:    15,
  small:   13,
  xs:      12,
  label:   11,
  navTab:   9,
};

export const LetterSpacing = {
  tight:  -0.5,
  normal:  0,
  wide:    0.5,
  wider:   0.8,
  widest:  1.2,
};

// ─── SPACING & SIZING TOKENS ─────────────────────────────────────────────────

export const Spacing = {
  screenH:  20,
  cardGap:  10,
  sectionV: 16,
  xs:        4,
  sm:        8,
  md:       12,
  lg:       16,
  xl:       20,
  xxl:      28,
};

export const Radius = {
  card:   14,
  pill:   100,
  icon:   10,
  chip:   20,
  input:  12,
  modal:  20,
  avatar: 999,
};

// ─── SHADOWS ─────────────────────────────────────────────────────────────────

export const Shadows = {
  card: {
    shadowColor:   '#1A1A2E',
    shadowOpacity:  0.06,
    shadowOffset:   { width: 0, height: 2 },
    shadowRadius:   6,
    elevation:      2,
  },
  float: {
    shadowColor:   '#1A1A2E',
    shadowOpacity:  0.14,
    shadowOffset:   { width: 0, height: 4 },
    shadowRadius:   12,
    elevation:      6,
  },
};
