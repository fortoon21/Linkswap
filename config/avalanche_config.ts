import { ChainConfig } from "./types";

const config: ChainConfig = {
  coin: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
  //WETH(WEVMOS)
  WETH: "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7",
  //lending address provider
  AAVEV2LendingAddressProvider: "0x0000000000000000000000000000000000000000",

  //flashloan from saddle finance(saddle mad usdt 0x7ff4a56b32ee13d7d4d405887e0ea37d61ed919e / mad usdc 0x51e44FfaD5C2B122C8b635671FCC8139dc636E82 /frax)
  FlashloanSwap: "0x0000000000000000000000000000000000000000",

  Uni2Factories: ["0x9Ad6C38BE94206cA50bb0d90783181662f0Cfa10", "0xefa94de7a4656d787667c749f7e1223d71e9fd88"],
  Uni2Fees: [3000, 3000],

  //UniV3Factory
  UniV3Factory: "0x0000000000000000000000000000000000000000",
  // Saddle Pool Registry
  SaddleRegistry: "0x0000000000000000000000000000000000000000",
  //CurveAddressProvider
  CurveAddressProvider: "0x0000000000000000000000000000000000000000",

  //CurveRegistry
  CurveStableRegistry: "0x0000000000000000000000000000000000000000",
  CurveCryptoRegistry: "0x0000000000000000000000000000000000000000",
  // get curve factory registry from exchange
  // registry -> only factory ele!=address(0) at idx=0
  CurveFactoryRegistry: "0xb17b674D9c5CB2e441F8e196a2f048A81355d031",
  // 2 coins
  CurveCryptoFactoryRegistry: "0x0000000000000000000000000000000000000000",

  //UniV3
  TickLens: "0x0000000000000000000000000000000000000000",

  //Should deploy contracts below
  //Approve
  Approve: "0x0000000000000000000000000000000000000000",
  err: "0x0000000000000000000000000000000000000000",
  //Adapter
  UniV2Adapter: "0x0000000000000000000000000000000000000000",
  UniV3Adapter: "0x0000000000000000000000000000000000000000",
  // for curve
  CurveAdapter: "0x0000000000000000000000000000000000000000",
  // for kinesis swap
  StableSwapNoRegistryAdapter: "0x0000000000000000000000000000000000000000",
  // for saddle swap fork()
  StableSwapAdapter: "0x0000000000000000000000000000000000000000",
  BalancerAdapter: "0x0000000000000000000000000000000000000000",

  //Viewer
  UniV2Viewer: "0x383D35E81fb7eE06FEaa4deF44D63B8C257F6A54",
  UniV3Viewer: "0x0000000000000000000000000000000000000000",
  CurveViewer: "0xE3389f707D395AC2D4867E4091F6bD6e9Fe64b59",
  CurveNoRegistryViewer: "0x0000000000000000000000000000000000000000",
  StableSwapViewer: "0x0000000000000000000000000000000000000000",
  CurveCryptoViewer: "0x0000000000000000000000000000000000000000",
  BalancerViewer: "0x08f5841F806a57d8eDcB168018c15f496bF27BF0",
  TokenViewer: "0x8c41C6BafbF61F6F749Ef9D5CfF2d18399e2539a",

  //Proxy
  RouteProxy: "0x0000000000000000000000000000000000000000",
  ApproveProxy: "0x0000000000000000000000000000000000000000",

  //Tokens
  // WETH is eth, xxWETH is wEvmos(we don't have to calculate in assumption; xxWETH=ooWETH)
  Tokens: {
    WEVMOS: { address: "0xD4949664cD82660AaE99bEdc034a0deA8A0bd517", decimals: 18 },
    OSMO: { address: "0xFA3C22C069B9556A4B2f7EcE1Ee3B467909f4864", decimals: 6 },
    ATOM: { address: "0xC5e00D3b04563950941f7137B5AfA3a534F0D6d6", decimals: 6 },
    DIFF: { address: "0x3f75ceabCDfed1aCa03257Dc6Bdc0408E2b4b026", decimals: 18 },
    xDIFF: { address: "0x75aeE82a16BD1fB98b11879af93AB7CE055f66Da", decimals: 18 },
    GRAV: { address: "0x80b5a32e4f032b2a058b4f29ec95eefeeb87adcd", decimals: 6 },
    gWETH: { address: "0xc03345448969Dd8C00e9E4A85d2d9722d093aF8E", decimals: 18 },
    gUSDC: { address: "0x5FD55A1B9FC24967C4dB09C513C3BA0DFa7FF687", decimals: 6 },
    madDAI: { address: "0x63743ACF2c7cfee65A5E356A4C4A005b586fC7AA", decimals: 18 },
    madWETH: { address: "0x5842C5532b61aCF3227679a8b1BD0242a41752f2", decimals: 18 },
    madWBTC: { address: "0xF80699Dc594e00aE7bA200c7533a07C1604A106D", decimals: 8 },
    madUSDC: { address: "0x51e44FfaD5C2B122C8b635671FCC8139dc636E82", decimals: 6 },
    madUSDT: { address: "0x7FF4a56B32ee13D7D4D405887E0eA37d61Ed919e", decimals: 6 },
    madFRAX: { address: "0x28eC4B29657959F4A5052B41079fe32919Ec3Bd3", decimals: 18 },
    madFXS: { address: "0xd0ec216A38F199B0229AE668a96c3Cd9F9f118A6", decimals: 18 },
    FRAX: { address: "0xE03494D0033687543a80c9B1ca7D6237F2EA8BD8", decimals: 18 },
    FXS: { address: "0xd8176865DD0D672c6Ab4A427572f80A72b4B4A9C", decimals: 18 },
    mulDAI: { address: "0x461d52769884ca6235B685EF2040F47d30C94EB5", decimals: 18 },
    mulWETH: { address: "0x7C598c96D02398d89FbCb9d41Eab3DF0C16F227D", decimals: 18 },
    mulWBTC: { address: "0x332730a4F6E03D9C55829435f10360E13cfA41Ff", decimals: 8 },
    mulUSDC: { address: "0x2C78f1b70Ccf63CDEe49F9233e9fAa99D43AA07e", decimals: 6 },
    mulUSDT: { address: "0xC1Be9a4D5D45BeeACAE296a7BD5fADBfc14602C4", decimals: 6 },
    ceDAI: { address: "0x940dAAbA3F713abFabD79CdD991466fe698CBe54", decimals: 18 },
    ceWETH: { address: "0x153A59d48AcEAbedbDCf7a13F67Ae52b434B810B", decimals: 18 },
    ceWBTC: { address: "0xb98e169C37ce30Dd47Fdad1f9726Fb832191e60b", decimals: 8 },
    ceUSDC: { address: "0xe46910336479F254723710D57e7b683F3315b22B", decimals: 6 },
    ceUSDT: { address: "0xb72A7567847abA28A2819B855D7fE679D4f59846", decimals: 6 },
    ceBUSD: { address: "0x516e6D96896Aea92cE5e78B0348FD997F13802ad", decimals: 18 },
    ceBNB: { address: "0x75364D4F779d0Bd0facD9a218c67f87dD9Aff3b4", decimals: 18 },
    ceAVAX: { address: "0x8006320739fC281da67Ee62eB9b4Ef8ADD5C903a", decimals: 18 },
    ceFTM: { address: "0x729416B1F442f204989f1C9f0d58321F878808eD", decimals: 18 },
    ceAURORA: { address: "0x48421FF1c6B93988138130865C4B7Cce10358271", decimals: 18 },
    CELR: { address: "0xFe6998C5c22936CCa749b14Fcf5F190398cfa8F8", decimals: 18 },
    OAV: { address: "0xBbD37BF85f7474b5bDe689695674faB1888565Ad", decimals: 18 },
    MUSDC: { address: "0xc48Efe267a31b5Af4cFDb50C8457914aadB0b875", decimals: 18 },
    MEVMOS: { address: "0xf1361Dc7DFB724bd29FE7ade0CdF9785F2Bc20E6", decimals: 18 },
    MATOM: { address: "0x9832169B33DC5777D3d28572f35E0a537Ff7A04C", decimals: 18 },
    MOSMOSIS: { address: "0x1dccd8025688e39C72f2539C6f00d77bd6678425", decimals: 18 },
    LHS2: { address: "0x7c21d6A51d6f591A95470f1F262C9c804c4CEAc3", decimals: 18 },
    RHS2: { address: "0xD3607915d934576EcdC389E7DBc641097fd5A0dE", decimals: 18 },
    EMO: { address: "0x181C262b973B22C307C646a67f64B76410D19b6B", decimals: 18 },
    USDC: { address: "0x51e44FfaD5C2B122C8b635671FCC8139dc636E82", decimals: 6 },
    USDT: { address: "0x7FF4a56B32ee13D7D4D405887E0eA37d61Ed919e", decimals: 6 },
    DAI: { address: "0x63743ACF2c7cfee65A5E356A4C4A005b586fC7AA", decimals: 18 },
    WBTC: { address: "0xF80699Dc594e00aE7bA200c7533a07C1604A106D", decimals: 8 },
    WETH: { address: "0x5842C5532b61aCF3227679a8b1BD0242a41752f2", decimals: 18 },
    EVTOMB: { address: "0x8F61F40615b545693dC7Ea6A6836146aCD8e42e9", decimals: 18 },
    EVSHARE: { address: "0x6957b60244954be36BbcF05EC17F0Fe47A228aa9", decimals: 18 },
    EDOGE: { address: "0x046cb616d7a52173e4Da9efF1BFd590550aa3228", decimals: 18 },
    GRDN: { address: "0x0A88F465eA5079C39d88EA796A018604E2C00d56", decimals: 18 },
  },

  BalancerPools: [],
  CurvePools: [],
  UniswapV3Pools: [],
  Deployed: {
    UniV2Viewer: "",
    UniV3Viewer: "",
    CurveViewer: "",
    CurveCryptoViewer: "",
    BalancerViewer: "",
    TokenViewer: "",
    UniV2Adapter: "",
    CurveAdapter: "",
    BalancerAdapter: "",
    RouteProxy: "",
    ApproveProxy: "",
  },
  BalancerPool: undefined,
};

export { config };
