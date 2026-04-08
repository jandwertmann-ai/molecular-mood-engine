import { useEffect, useState } from 'react';
import type { MoodSliders } from '../lib/contentMap';
import './OutputProfile.css';

// A curated pool of poem/literature excerpts mapped to mood quadrants.
// Selection logic: warm+night → melancholic, warm+day → lush,
//                  cold+night → stark, cold+day → expansive.
const EXCERPTS: Record<string, { text: string; source: string }[]> = {
  warm_night: [
    {
      text: "I have wasted my life.\nI should have loved more and I should have been braver.",
      source: "— James Wright",
    },
    {
      text: "Tell me, what is it you plan to do\nwith your one wild and precious life?",
      source: "— Mary Oliver, The Summer Day",
    },
    {
      text: "The world is charged with the grandeur of God.\nIt will flame out, like shining from shook foil.",
      source: "— Gerard Manley Hopkins",
    },
  ],
  warm_day: [
    {
      text: "And I have known the eyes already, known them all—\nthe eyes that fix you in a formulated phrase.",
      source: "— T.S. Eliot, Prufrock",
    },
    {
      text: "What a long strange trip it's been.\nSometimes the light's all shining on me.",
      source: "— Grateful Dead",
    },
    {
      text: "I am large, I contain multitudes.",
      source: "— Walt Whitman, Song of Myself",
    },
  ],
  cold_night: [
    {
      text: "Do not go gentle into that good night.\nRage, rage against the dying of the light.",
      source: "— Dylan Thomas",
    },
    {
      text: "And out of the darkness,\na voice is calling.",
      source: "— Neil Young, After the Gold Rush",
    },
    {
      text: "Two roads diverged in a wood, and I—\nI took the one less traveled by.",
      source: "— Robert Frost",
    },
  ],
  cold_day: [
    {
      text: "To see a world in a grain of sand,\nand a heaven in a wild flower.",
      source: "— William Blake, Auguries of Innocence",
    },
    {
      text: "And miles to go before I sleep,\nand miles to go before I sleep.",
      source: "— Robert Frost, Stopping by Woods",
    },
    {
      text: "Everything is connected.\nNothing is lost. The world is full.",
      source: "— Ursula K. Le Guin",
    },
  ],
};

function pickExcerpt(sliders: MoodSliders) {
  const isWarm = sliders.intimate_open < 50;
  const isNight = sliders.day_night < 50;
  const key = `${isWarm ? 'warm' : 'cold'}_${isNight ? 'night' : 'day'}`;
  const pool = EXCERPTS[key];
  // Deterministic pick from entropy + shape so it changes when things shift
  const idx = Math.floor((sliders.entropy * 0.031 + sliders.calm_tense * 0.013)) % pool.length;
  return pool[Math.abs(idx)];
}

interface Props { sliders: MoodSliders }

export function OutputProfile({ sliders }: Props) {
  const [displayed, setDisplayed] = useState(() => pickExcerpt(sliders));
  const [fading, setFading]       = useState(false);

  useEffect(() => {
    const next = pickExcerpt(sliders);
    if (next.text === displayed.text) return;
    setFading(true);
    const t = setTimeout(() => {
      setDisplayed(next);
      setFading(false);
    }, 280);
    return () => clearTimeout(t);
  }, [sliders.intimate_open, sliders.day_night, sliders.entropy, sliders.calm_tense, sliders.shape]);

  return (
    <div className={`output-profile ${fading ? 'fading' : ''}`}>
      <span className="profile-label">In other words</span>
      <blockquote className="poem-text">
        {displayed.text.split('\n').map((line, i) => (
          <span key={i}>{line}<br /></span>
        ))}
      </blockquote>
      <p className="poem-source">{displayed.source}</p>
    </div>
  );
}
