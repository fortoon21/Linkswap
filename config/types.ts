type Token = {
  address: string;
  decimals: number;
};

type CoinMap = {
  coin: string;
  oracle: string;
};

export type Oracles = Array<CoinMap>;

export type Uni2Dex = {
  factory: string;
  fee: number;
};

export type CurveDex =
  | {
      forkType: "ellipsis";
      registry: string;
      factoryRegistry: string;
      cryptoRegistry: string;
      cryptoFactoryRegistry: string;
    }
  | {
      forkType: "curve";
      registry: string;
      factoryRegistry: string;
      cryptoRegistry: string;
      cryptoFactoryRegistry: string;
    }
  | {
      forkType: "stableswap";
      registry: string;
    };

export type Uni3Dex = {
  ticklens: string;
};

type CurvePool = {
  swapType: "NativeToToken" | "TokenToToken" | "TokenToNative";
  address: string;
  fromToken: string;
  toToken: string;
};

export type ChainConfig = {
  coin: string;
  WETH: string;
  Uni2Dexes: Array<Uni2Dex>;
  CurveDexes: Array<CurveDex>;
  BalancerPool: string | undefined;
  Uni2Pool: [string, string] | undefined;
  CurvePools: CurvePool[];

  Tokens: {
    [t: string]: Token;
  };

  Deployed: {
    UniV2Viewer: string;
    UniV3Viewer: string;
    CurveViewer: string;
    CurveCryptoViewer: string;
    BalancerViewer: string;
    TokenViewer: string;
    UniV2Adapter: string;
    UniV3Adapter: string;
    CurveAdapter: string;
    BalancerAdapter: string;
    RouteProxy: string;
    ApproveProxy: string;
    Approve: string;
    TokenValidChecker: string;
  };

  Oracles: CoinMap[];

  [other: string]: any;
};
