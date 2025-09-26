import type { Preset } from './engine.d';

export const DEFAULT_WORLDS: Preset[] = [
  {
    name: 'Verdance',
    seed: 'verdance-seed-001',
    description: 'A lush frontier of spirit plants, deep roots, and hidden sects.',
    factions: ['Hollowshade Clan', 'Valebright Court', 'Thornweave Syndicate', 'The Rootspeakers'],
    classes: ['Greenwarden', 'Thorn Knight', 'Sapling Adept', 'Bloomcaller'],
    lore: 'In the heart of the Verdance, ancient spirit plants pulse with ethereal light, their roots forming vast networks beneath the forest floor that whisper secrets across continents. The Hollowshade Clan has learned to walk between shadow and root, using umbral magic to commune with the deepest, oldest growths. They believe the plants hold memories of the world\'s first age, when magic flowed freely through all living things.'
  },
  {
    name: 'Ashenreach',
    seed: 'ashenreach-seed-002',
    description: 'A scorched expanse of ash dunes, ember cults, and bone singers.',
    factions: ['Ember Cult', 'Bonechanters', 'Duskward Nomads', 'The Cindermarch'],
    classes: ['Ashblade', 'Cinder Mystic', 'Dust Ranger', 'Bonechanter'],
    lore: 'The Ashenreach was not always a wasteland. Once, it was the Golden Empire of Solmere, a realm of crystal spires and sun-blessed fields. But the Great Burning came without warning—whether by dragon fire, fallen star, or the Empire\'s own hubris, none can say for certain.'
  },
  {
    name: 'Skyvault',
    seed: 'skyvault-seed-003',
    description: 'Floating citadels and shattered islands drifting in endless skies.',
    factions: ['Stormcaller Guild', 'Voidwing Pirates', 'Celestial Observatory', 'The Windwright Consortium'],
    classes: ['Stormcaller', 'Voidwing', 'Sky Knight', 'Wind Sage'],
    lore: 'When the ancient world shattered in the Sundering, entire continents were cast into the sky, held aloft by veins of raw aetheric force. Now the Skyvault stretches across three layers of heaven.'
  }
];
