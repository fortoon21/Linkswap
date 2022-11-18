import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";

import { ChainConfig } from "../config/types";
import type {
  BalancerAdapter,
  CurveAdapter,
  EllipsisAdapter,
  StableSwapAdapter,
  StableSwapNoRegistryAdapter,
  UniV2Adapter,
  UniV3Adapter,
} from "../src/types/SmartRoute/adapter";
import type { RouteProxy } from "../src/types/SmartRoute/proxies";
import type { BalancerViewer, TokenViewer, UniV2Viewer, UniV3Viewer } from "../src/types/Viewer";
import { ICurvePoolInfoViewer } from "../src/types/Viewer/intf";

declare module "mocha" {
  export interface Context {
    config: ChainConfig;
    balancerAdapter: BalancerAdapter;
    curveAdapter: CurveAdapter | undefined;
    ellipsisAdapter: EllipsisAdapter | undefined;
    uniV2Adapter: UniV2Adapter;
    uniV3Adapter: UniV3Adapter;
    stableSwapNoRegistryAdapter: StableSwapNoRegistryAdapter;
    stableSwapAdapter: StableSwapAdapter | undefined;
    balancerViewer: BalancerViewer;
    curveViewers: ICurvePoolInfoViewer[];
    uniV2Viewer: UniV2Viewer;
    uniV3Viewer: UniV3Viewer;
    tokenViewer: TokenViewer;
    routeProxy: RouteProxy;

    signers: Signers;
  }
}

export interface Signers {
  admin: SignerWithAddress;
}
