export type MoodSliders = {
  calm_tense: number;
  organic_synthetic: number;
  entropy: number;
  day_night: number;
  intimate_open: number;
  shape: string;
};

export type SonicProfile = {
  title: string;
  bpm: string;
  texture: string;
  rhythm: string;
  space: string;
  palette: string;
  description: string;
};

export function determineProfile(sliders: MoodSliders): SonicProfile {
  const { calm_tense, organic_synthetic, entropy, day_night, intimate_open, shape } = sliders;

  const getBpm = (val: number) => {
    if (val < 34) return "60-80";
    if (val < 67) return "85-110";
    return "120-145";
  };

  const getTexture = (val: number) => {
    if (val < 34) return "dusty tape saturation";
    if (val < 67) return "hybrid electro-acoustic warmth";
    return "glassy digital sheen";
  };

  const getRhythm = (en: number) => {
    if (en < 34) return "sparse, slow drift";
    if (en < 67) return "syncopated pulses";
    return "chaotic, sprawling polyrhythms";
  };

  const getSpace = (io: number) => {
    if (io < 34) return "close, dry room";
    if (io < 67) return "misty, medium reverb";
    return "cavernous, infinite tail";
  };

  const getPalette = (dn: number, io: number) => {
    if (dn < 50 && io < 50) return "moss and shadow";
    if (dn < 50 && io >= 50) return "deep obsidian and chrome";
    if (dn >= 50 && io < 50) return "sunlit amber haze";
    return "neon cyan and burning white";
  };

  const getTitle = (dn: number, shp: string) => {
    const time = dn < 50 ? "Night" : "Day";
    return `${time} ${shp.charAt(0).toUpperCase() + shp.slice(1)}`;
  };

  const tenseWord = calm_tense < 40 ? "suspended" : calm_tense > 60 ? "heavy" : "-";
  const tension = calm_tense < 40 ? "gentle tension" : "electric tension";
  const orgWord = organic_synthetic < 40 ? "analog" : organic_synthetic > 60 ? "digital" : "hybrid";
  
  const darkFeature = day_night < 50 ? "deep shadows" : "blinding highlights";
  const scale = intimate_open < 50 ? "an intimate proximity" : "a cinematic sense of distance";
  const sentence = `A ${tenseWord === "-" ? tension : tenseWord} ${orgWord} atmosphere with ${darkFeature} and ${scale}.`;

  return {
    title: getTitle(day_night, shape),
    bpm: getBpm(calm_tense),
    texture: getTexture(organic_synthetic),
    rhythm: getRhythm(entropy),
    space: getSpace(intimate_open),
    palette: getPalette(day_night, intimate_open),
    description: sentence.charAt(0).toUpperCase() + sentence.slice(1),
  };
}
