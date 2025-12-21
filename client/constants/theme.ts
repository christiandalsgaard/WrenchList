import { Platform } from "react-native";

export const Colors = {
  light: {
    text: "#1A1A1A",
    textSecondary: "#666666",
    buttonText: "#FFFFFF",
    tabIconDefault: "#687076",
    tabIconSelected: "#FF6B35",
    link: "#4A90E2",
    primary: "#FF6B35",
    secondary: "#4A90E2",
    accent: "#FFD23F",
    success: "#4CAF50",
    error: "#F44336",
    backgroundRoot: "#FFFFFF",
    backgroundDefault: "#F8F8F8",
    backgroundSecondary: "#F2F2F2",
    backgroundTertiary: "#E6E6E6",
    border: "#E0E0E0",
    cardBackground: "#FFFFFF",
  },
  dark: {
    text: "#ECEDEE",
    textSecondary: "#9BA1A6",
    buttonText: "#FFFFFF",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: "#FF6B35",
    link: "#4A90E2",
    primary: "#FF6B35",
    secondary: "#4A90E2",
    accent: "#FFD23F",
    success: "#4CAF50",
    error: "#F44336",
    backgroundRoot: "#1A1A1A",
    backgroundDefault: "#242424",
    backgroundSecondary: "#2E2E2E",
    backgroundTertiary: "#383838",
    border: "#404040",
    cardBackground: "#242424",
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
  inputHeight: 48,
  buttonHeight: 52,
};

export const BorderRadius = {
  xs: 8,
  sm: 12,
  md: 18,
  lg: 24,
  xl: 30,
  "2xl": 40,
  "3xl": 50,
  full: 9999,
};

export const Typography = {
  h1: {
    fontSize: 32,
    fontWeight: "700" as const,
  },
  h2: {
    fontSize: 28,
    fontWeight: "700" as const,
  },
  h3: {
    fontSize: 24,
    fontWeight: "600" as const,
  },
  h4: {
    fontSize: 20,
    fontWeight: "600" as const,
  },
  body: {
    fontSize: 16,
    fontWeight: "400" as const,
  },
  small: {
    fontSize: 14,
    fontWeight: "400" as const,
  },
  caption: {
    fontSize: 13,
    fontWeight: "400" as const,
  },
  price: {
    fontSize: 20,
    fontWeight: "700" as const,
  },
  link: {
    fontSize: 16,
    fontWeight: "400" as const,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

export const ListingCategories = [
  {
    id: "workshop",
    name: "Workshop/Garage",
    icon: "home" as const,
    description: "Specialized tools & workspace",
  },
  {
    id: "heavy-machinery",
    name: "Heavy Machinery",
    icon: "truck" as const,
    description: "Excavators, loaders & more",
  },
  {
    id: "mid-size-equipment",
    name: "Mid-Size Equipment",
    icon: "settings" as const,
    description: "Lawnmowers, pressure washers",
  },
  {
    id: "power-tools",
    name: "Power Tools",
    icon: "zap" as const,
    description: "Drills, saws, sanders",
  },
  {
    id: "hand-tools",
    name: "Hand Tools",
    icon: "tool" as const,
    description: "Wrenches, hammers, screwdrivers",
  },
];
