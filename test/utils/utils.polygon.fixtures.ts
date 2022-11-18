import { polygonConfig } from "../../config/matic_config";
import { fixtureCommonTokenValidChecker } from "./utils.common.fixtures";

export async function fixturePolygonTokenValidChecker() {
  return await fixtureCommonTokenValidChecker(polygonConfig.tokens.wnative, polygonConfig.uni2Dexes);
}
