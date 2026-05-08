import { APPLICATION_STATUS } from "@/constants/applicationStatuses";

export const AUTO_SCROLL_EDGE_SIZE = 96;
export const AUTO_SCROLL_MAX_SPEED = 24;

export const APPLICATION_CARD_STYLES_BY_STATUS = {
  [APPLICATION_STATUS.SAVED]: "border-slate-200 bg-white hover:border-slate-300",
  [APPLICATION_STATUS.APPLIED]:
    "border-teal-100 bg-teal-50/50 hover:border-teal-200",
  [APPLICATION_STATUS.SCREEN]:
    "border-teal-200 bg-teal-50 hover:border-teal-300",
  [APPLICATION_STATUS.INTERVIEWING]:
    "border-teal-300 bg-teal-100/70 hover:border-teal-400",
  [APPLICATION_STATUS.OFFER]:
    "border-emerald-300 bg-emerald-100/75 hover:border-emerald-400",
  [APPLICATION_STATUS.ACCEPTED]:
    "border-emerald-400 bg-emerald-200/75 hover:border-emerald-500",
  [APPLICATION_STATUS.REJECTED]:
    "border-rose-200 bg-rose-50/90 hover:border-rose-300",
};
