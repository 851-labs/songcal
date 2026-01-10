import { accountRouter } from "./procedures/account";
import { appleMusicRouter } from "./procedures/apple-music";
import { calendarsRouter } from "./procedures/calendars";
import { tracksRouter } from "./procedures/tracks";

const api = {
  account: accountRouter,
  appleMusic: appleMusicRouter,
  calendars: calendarsRouter,
  tracks: tracksRouter,
};

export { api };
