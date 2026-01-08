import { accountRouter } from "./procedures/account";
import { calendarsRouter } from "./procedures/calendars";

const api = {
  account: accountRouter,
  calendars: calendarsRouter,
};

export { api };
