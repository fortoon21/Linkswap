import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";

import { BscConfig } from "../config/bsc_config";
import { PolygonConfig } from "../config/matic_config";
// import { ChainConfig } from "../config/types";
import { Approve, ApproveProxy } from "../src/types";
import type {
  BalancerAdapter,
  CurveAdapter,
  EllipsisAdapter,
  StableSwapAdapter,
  StableSwapNoRegistryAdapter,
  TrashUniV2Adapter,
  UniV2Adapter,
  UniV3Adapter,
} from "../src/types/SmartRoute/adapter";
import type { RouteProxy } from "../src/types/SmartRoute/proxies";
import { TokenValidChecker } from "../src/types/Util/TokenValidChecker.sol";
import type { BalancerViewer, TokenViewer, UniV2Viewer, UniV3Viewer } from "../src/types/Viewer";
import { ICurveCryptoPoolInfoViewer, ICurvePoolInfoViewer } from "../src/types/Viewer/intf";

export interface BscContext {
  config: BscConfig;
  signers: Signers;
  balancerAdapter: BalancerAdapter;
  curveAdapter: CurveAdapter | undefined;
  ellipsisAdapter: EllipsisAdapter | undefined;
  uniV2Adapter: UniV2Adapter;
  uniV3Adapter: UniV3Adapter;
  stableSwapNoRegistryAdapter: StableSwapNoRegistryAdapter;
  stableSwapAdapter: StableSwapAdapter | undefined;
  balancerViewer: BalancerViewer;
  curveViewers: ICurvePoolInfoViewer[];
  curveCryptoViewers: ICurveCryptoPoolInfoViewer[];
  uniV2Viewer: UniV2Viewer;
  uniV3Viewer: UniV3Viewer;
  tokenViewer: TokenViewer;
  routeProxy: RouteProxy;
  approveProxy: ApproveProxy;
  approve: Approve;
}

export interface BscUtilContext {
  config: BscConfig;
  signers: Signers;
  tokenValidChecker: TokenValidChecker;
  routeProxy: RouteProxy;
  uniV2Adapter: UniV2Adapter;
  trashUniV2Adapter: TrashUniV2Adapter;
}

export interface PolygonContext {
  config: PolygonConfig;
  signers: Signers;
  balancerAdapter: BalancerAdapter;
  curveAdapter: CurveAdapter | undefined;
  uniV2Adapter: UniV2Adapter;
  trashUniV2Adapter: TrashUniV2Adapter;
  uniV3Adapter: UniV3Adapter;
  stableSwapNoRegistryAdapter: StableSwapNoRegistryAdapter;
  stableSwapAdapter: StableSwapAdapter | undefined;
  balancerViewer: BalancerViewer;
  curveViewers: ICurvePoolInfoViewer[];
  curveCryptoViewers: ICurveCryptoPoolInfoViewer[];
  uniV2Viewer: UniV2Viewer;
  uniV3Viewer: UniV3Viewer;
  tokenViewer: TokenViewer;
  routeProxy: RouteProxy;
  approveProxy: ApproveProxy;
  approve: Approve;
}

export interface PolygonUtilContext {
  config: PolygonConfig;
  signers: Signers;
  tokenValidChecker: TokenValidChecker;
  routeProxy: RouteProxy;
  uniV2Adapter: UniV2Adapter;
  trashUniV2Adapter: TrashUniV2Adapter;
}

declare module "mocha" {
  export interface Context {
    bsc: BscContext;
    bscUtil: BscUtilContext;
    polygon: PolygonContext;
    polygonUtil: PolygonUtilContext;
  }
}

export interface Signers {
  admin: SignerWithAddress;
}
