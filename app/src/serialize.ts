import { stringify } from "qs";
import { AppState } from "./types";

export function serialize(state: AppState) {
  return stringify(
    { ...state.filters, boundingBox: state.boundingBox.toArray() },
    { arrayFormat: "comma" }
  );
}
