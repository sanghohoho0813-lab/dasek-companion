import type { AxThemeId } from './types';

/** Unified v4.1 Canonical 7 Theme — 각 6 Core Token */
export const AX_THEMES: { id: AxThemeId; name: string; colors: [string, string, string, string, string, string] }[] = [
  { id: 'deep-navy', name: '01 Deep Navy Blue', colors: ['#0B1830', '#2457D6', '#1687A7', '#17A889', '#E7C873', '#DCE8F7'] },
  { id: 'navy-gold', name: '02 Navy Gold', colors: ['#111A2D', '#2847A7', '#A37A28', '#D0A84B', '#F0D995', '#EFE8D7'] },
  { id: 'emerald-gold', name: '03 Emerald Gold', colors: ['#11332B', '#0E7663', '#2C9277', '#B4862A', '#E8CE88', '#E2F0EA'] },
  { id: 'forest-sage', name: '04 Forest Sage', colors: ['#17352C', '#356E58', '#73977E', '#A58E4D', '#D9D2AA', '#E5ECE5'] },
  { id: 'deep-teal', name: '05 Deep Teal', colors: ['#08323A', '#087A83', '#1597A3', '#D2704C', '#E9B59B', '#DDEDEF'] },
  { id: 'onyx-gold', name: '06 Onyx Gold', colors: ['#15171C', '#343942', '#6A717C', '#B89032', '#E0C76F', '#E6E8EC'] },
  { id: 'pure-white', name: '07 Pure White', colors: ['#FFFFFF', '#171B20', '#343B44', '#6B7680', '#D47A4A', '#FAFAF8'] },
];
