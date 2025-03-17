import { atom } from 'recoil';

export const currentTrackState = atom({
  key: 'app.player.currentTrackState',
  default: {
    id: null,
    title: null,
    artist: null,
    album: null,
    cover_image: null,
    duration_ms: 0,
    stream_url: null
  }
});