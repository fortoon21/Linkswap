import { bscConfig } from "../../config/bsc_config";
import { fixtureCommonTokenValidChecker } from "./utils.common.fixtures";

export async function fixtureBscTokenValidChecker() {
  return await fixtureCommonTokenValidChecker(bscConfig.tokens.wnative, bscConfig.uni2Dexes);
}
