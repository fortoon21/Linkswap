import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "ethers";

import { CurveAdapter, EllipsisAdapter, IERC20__factory, IWETH__factory, UniV2Adapter } from "../src/types";
import { logger } from "../test/logger";
import { IConfig } from "./common_config";
import type { ChainConfig, CurveDex, Uni2Dex, Uni3Dex } from "./types";

/* ========================================================
 * new code
 * ======================================================== */
export class BscConfig implements IConfig {
  tokens: {
    native: string;
    wnative: string;
    usdc: string;
    usdt: string;
    bnbx: string;
    lpOfCurveUsdcUsdt: string;
    lpOfCurveNativeBnbx: string;
    eps3: string;
    busd: string;
    usdd: string;
    arth: string;
  };
  uni2Pools: {
    poolWnativeUsdc: string;
    poolUsdcUsdt: string;
    poolWnativeBusd: string;
    poolWnativeUsdd: string;
  };
  curvePools: {
    poolNativeBnbx: string;
    poolUsdcUsdt: string;
    poolUsddEps3: string;
    poolUsddBusd: string;
    poolBusdArth: string;
  };
  balancerPools: {};
  uni2Dexes: Array<Uni2Dex>;
  curveDexes: Array<CurveDex>;

  constructor() {
    this.tokens = {
      native: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
      wnative: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
      usdc: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
      usdt: "0x55d398326f99059fF775485246999027B3197955",
      bnbx: "0x1bdd3Cf7F79cfB8EdbB955f20ad99211551BA275",
      lpOfCurveUsdcUsdt: "0xaF4dE8E872131AE328Ce21D909C74705d3Aaf452", // ellipsis
      lpOfCurveNativeBnbx: "0x2e9a994c9a2f661ae685e8d08662df00f862f4da", // ellipsis
      eps3: "0xaF4dE8E872131AE328Ce21D909C74705d3Aaf452",
      busd: "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56",
      usdd: "0xd17479997F34dd9156Deef8F95A52D81D265be9c",
      arth: "0x85daB10c3BA20148cA60C2eb955e1F8ffE9eAa79",
    };
    this.uni2Pools = {
      poolWnativeUsdc: "0xd99c7F6C65857AC913a8f880A4cb84032AB2FC5b",
      poolUsdcUsdt: "0xEc6557348085Aa57C72514D67070dC863C0a5A8c",
      poolWnativeBusd: "0x58F876857a02D6762E0101bb5C46A8c1ED44Dc16",
      poolWnativeUsdd: "0xda6B0e7619001Da5Cbd4c113f603CF61Ac7f5250",
    };
    this.curvePools = {
      poolNativeBnbx: "0xA844B2fFEB34AB5878E3B520e87b50F125DA7919", // CR case
      poolUsdcUsdt: "0x160CAed03795365F3A589f10C379FfA7d75d4E76", // case 1-CR (but semantically MR')
      poolUsddEps3: "0xC2cF01F785C587645440ccD488B188945C9505e7", // case 2-MR
      poolUsddBusd: "0x408A61e158D7BC0CD339BC76917b8Ea04739d473", // case 3-CR (but semantically MR'')
      poolBusdArth: "0x21dE718BCB36F649E1A7a7874692b530Aa6f986d", // case 4-CFR
    };
    this.balancerPools = {};
    /** =======================================================
     * Univ2:
     *   factory (pancake): 0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73
     * ======================================================== */
    this.uni2Dexes = [
      {
        factory: "0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73",
        fee: 2500,
      },
      {
        factory: "0x858E3312ed3A876947EA49d572A7C42DE08af7EE",
        fee: 2000,
      },
    ];
    /** =======================================================
     * Curve:
     *   reigstry definition:
     *     MR (main registry)           : Stableswap & Metapool                                    // ex: (usdt, usdc), (3CRV,*usd)
     *     MFR (main factory registry)  : Factory is permissionless with stable assets             // ex: (*usd, *usd)
     *     CR (crypto registry)         : native(should be converted to wnative address), *USD     // ex: (wnative, *usd)
     *     CFR (crypto factory registry): Factory is permissionless with crypto assets             // ex:
     *   search:
     *     from bsc scanner deploy history: https://bscscan.com/address/0xabc00210a691ce0f3d7d0602d7d84aea4d91cdfd
     *     from ellipsis official doc: https://docs.ellipsis.finance/dev/ellipsis-registry
     *       address provider: 0x31D236483A15F9B9dD60b36D4013D75e9dbF852b
     *       registry: 0x266Bb386252347b03C7B6eB37F950f476D7c3E63 // MR?
     *       exchanger: 0xdd9227B12596e6F91f31ECD2502856A5df5F6E25 //
     *     from address provider:
     *       main registry(metaRegistry): 0x3E15311B75656342a3Ade8C46F8D6c60bFa41009 // MR // <-- address provider
     *       exchanger: 0xC0cD22471F7E923b10672A98793F68f041f607EB // <-- address provider
     *     from ellipsis github:
     *       factoryRegistry: "0xf65BEd27e96a367c61e0E06C54e14B16b84a5870", // MFR // <-- https://github.com/ellipsis-finance/stableswap-factory
     *       metaRegistry:"0x3E15311B75656342a3Ade8C46F8D6c60bFa41009", // MR // https://github.com/ellipsis-finance/registry
     *   pool:
     *     poolMR' = 0x160CAed03795365F3A589f10C379FfA7d75d4E76 (usdc, usdt)
     *     poolMR = 0xC2cF01F785C587645440ccD488B188945C9505e7 (meta pool: usdd, 3eps)
     *     poolCR = 0xA844B2fFEB34AB5878E3B520e87b50F125DA7919 (native, bnbx)
     *     poolCR + poolMR'' = 0x408A61e158D7BC0CD339BC76917b8Ea04739d473 (busd, usdd 2pool) # semantic: MR
     *     poolCFR = 0x21dE718BCB36F649E1A7a7874692b530Aa6f986d (busd, arth)
     *   rule:
     *     isCR = CR.get_underlying_coins[CR.get_meta_n_coins[1]-1] != address(0)
     *     isMR = CR.get_underlying_coins[CR.get_meta_n_coins[1]-1] == address(0)
     *     isCFR = CR.get_meta_n_coins[1] == 1 && MR.get_meta_n_coins[1] == 1
     *     isCFR = !isMR && !isCR
     *     1) pool = MR에 속함
     *       isMR = // true
     *       isCR = // false
     *       isCFR = MR.get_n_coins(pool) == 0 && CR.get_n_coins(pool) == 0 // false
     *     2) pool = CR에 속함
     *       isMR = // false
     *       isCR = // true
     *       isCFR = MR.get_n_coins(pool) == 0 && CR.get_n_coins(pool) == 0 // false
     *     3) pool = CFR에 속함
     *       isMR = // false
     *       isCR = // false
     *       isCFR = MR.get_n_coins(pool) == 0 && CR.get_n_coins(pool) == 0 // true
     * ======================================================== */
    this.curveDexes = [
      {
        forkType: "ellipsis",
        /* ========================================================
         * new code
         * ======================================================== */
        registry: "0x266Bb386252347b03C7B6eB37F950f476D7c3E63", // MR
        factoryRegistry: "0xf65BEd27e96a367c61e0E06C54e14B16b84a5870", // MFR
        cryptoRegistry: "0xAB38213cB4400f19b1b28bfc4f8B00792AC164A7", // CR
        cryptoFactoryRegistry: "0x41871A4c63d8Fae4855848cd1790ed237454A5C4", // CFR
        /* ========================================================
         * original code
         * ======================================================== */
        // registry: "0x266Bb386252347b03C7B6eB37F950f476D7c3E63", // main
        // cryptoRegistry: "0xAB38213cB4400f19b1b28bfc4f8B00792AC164A7", // crypto pool found from address provider (0x31D236483A15F9B9dD60b36D4013D75e9dbF852b) // can find (native, bnbx)
        // cryptoFactoryRegistry : "0x41871A4c63d8Fae4855848cd1790ed237454A5C4"
      },
    ];
  }

  async depositUsdc(signer: SignerWithAddress, amountIn: ethers.BigNumber, adapter: UniV2Adapter) {
    const usdc = IERC20__factory.connect(this.tokens.usdc, signer);
    const wnative = IWETH__factory.connect(this.tokens.wnative, signer);
    const poolAddr = this.uni2Pools.poolWnativeUsdc;

    await wnative.deposit({ value: amountIn }).then(tx => tx.wait()); // path: signer, token: native -> wnative
    await wnative.transfer(poolAddr, amountIn).then(tx => tx.wait()); // path: signer -> pool, token: wnative
    await adapter.swapExactIn(wnative.address, amountIn, usdc.address, poolAddr, signer.address); // path: pool -> signer, token: wnative -> usdc
  }

  async depositBusd(signer: SignerWithAddress, amountIn: ethers.BigNumber, adapter: UniV2Adapter) {
    const busd = IERC20__factory.connect(this.tokens.busd, signer);
    const wnative = IWETH__factory.connect(this.tokens.wnative, signer);
    const poolAddr = this.uni2Pools.poolWnativeBusd;

    await wnative.deposit({ value: amountIn }).then(tx => tx.wait()); // path: signer, token: native -> wnative
    await wnative.transfer(poolAddr, amountIn).then(tx => tx.wait()); // path: signer -> pool, token: wnative
    await adapter.swapExactIn(wnative.address, amountIn, busd.address, poolAddr, signer.address); // path: pool -> signer, token: wnative -> busd
  }

  async depositUsdd(signer: SignerWithAddress, amountIn: ethers.BigNumber, adapter: UniV2Adapter) {
    const usdd = IERC20__factory.connect(this.tokens.usdd, signer);
    const wnative = IWETH__factory.connect(this.tokens.wnative, signer);
    const poolAddr = this.uni2Pools.poolWnativeUsdd;

    await wnative.deposit({ value: amountIn }).then(tx => tx.wait()); // path: signer, token: native -> wnative
    await wnative.transfer(poolAddr, amountIn).then(tx => tx.wait()); // path: signer -> pool, token: wnative
    await adapter.swapExactIn(wnative.address, amountIn, usdd.address, poolAddr, signer.address); // path: pool -> signer, token: wnative -> usdd
  }

  async depositBnbx(signer: SignerWithAddress, amountIn: ethers.BigNumber, adapter: EllipsisAdapter) {
    /* ---------------------------- args ---------------------------- */
    const toToken = IERC20__factory.connect(bscConfig.tokens.bnbx, signer);
    const fromTokenAddr = bscConfig.tokens.native;
    const toTokenAddr = toToken.address;
    const poolAddr = bscConfig.curvePools.poolNativeBnbx;

    /* ---------------------------- run ---------------------------- */
    // path: signer -> adapter, token: native
    await signer.sendTransaction({ to: adapter.address, value: amountIn, gasLimit: 1000000 });

    // path: adapter -> signer, token: native -> token
    const receipt = await adapter
      .swapExactIn(fromTokenAddr, amountIn, toTokenAddr, poolAddr, signer.address)
      .then(tx => tx.wait());
  }

  async depositLpOfUsdcUsdt(signer: SignerWithAddress, amountIn: ethers.BigNumber, adapter: EllipsisAdapter) {
    /* ---------------------------- args ---------------------------- */
    const fromTokenAddr = bscConfig.tokens.usdc;
    const toTokenAddr = bscConfig.tokens.lpOfCurveUsdcUsdt;
    const fromToken = IERC20__factory.connect(fromTokenAddr, signer);
    const toToken = IERC20__factory.connect(toTokenAddr, signer);
    const poolAddr = bscConfig.curvePools.poolUsdcUsdt;

    /* ---------------------------- run ---------------------------- */
    // path: signer -> adapter, token: fromToken
    await fromToken.transfer(adapter.address, amountIn);

    // path: adapter -> signer, token: fromToken -> toToken
    const receipt = await adapter
      .swapExactIn(fromTokenAddr, amountIn, toTokenAddr, poolAddr, signer.address)
      .then(tx => tx.wait());
  }

  //@TODO
  async depositLpOfCurveNativeBnbx(signer: SignerWithAddress, amountIn: ethers.BigNumber, adapter: EllipsisAdapter) {
    /* ---------------------------- args ---------------------------- */
    const fromTokenAddr = bscConfig.tokens.native;
    const toTokenAddr = bscConfig.tokens.lpOfCurveNativeBnbx;
    const toToken = IERC20__factory.connect(toTokenAddr, signer);
    const poolAddr = bscConfig.curvePools.poolNativeBnbx;

    /* ---------------------------- run ---------------------------- */
    // path: signer -> adapter, token: native
    await signer.sendTransaction({ to: adapter.address, value: amountIn, gasLimit: 1000000 });

    // path: pool -> signer, token: fromToken -> toTOken
    const receipt = await adapter
      .swapExactIn(fromTokenAddr, amountIn, toTokenAddr, poolAddr, signer.address)
      .then(tx => tx.wait());
  }
}

export const bscConfig = new BscConfig();

/* ========================================================
 * original code
 * ======================================================== */
const config: ChainConfig = {
  coin: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
  //WETH(WEVMOS)
  WETH: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
  //lending address provider
  AAVEV2LendingAddressProvider: "0x0000000000000000000000000000000000000000",
  VALASLendingAddressProvider: "0x0736B3dAdDe5B78354BF7F7faaFAcEE82B1851b9",

  FlashloanSwap: "0x0736B3dAdDe5B78354BF7F7faaFAcEE82B1851b9",

  Uni2Dexes: [
    {
      factory: "0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73",
      fee: 2500,
    },
    {
      factory: "0x858E3312ed3A876947EA49d572A7C42DE08af7EE",
      fee: 2000,
    },
  ],

  //UniV3Factory
  UniV3Factory: "0x0000000000000000000000000000000000000000",
  // Saddle Pool Registry
  SaddleRegistry: "0x9c560A6879E4D3a8a88C8f6f39ebf028Ad7860Ab",

  CurveDexes: [
    /* ========================================================
     * original code
     * ======================================================== */
    // {
    //   forkType: "ellipsis",
    //   registry: "0x266Bb386252347b03C7B6eB37F950f476D7c3E63",
    // },
    /* ========================================================
     * new code
     * ======================================================== */
    {
      forkType: "ellipsis",
      registry: "0x266Bb386252347b03C7B6eB37F950f476D7c3E63", // MR
      factoryRegistry: "0xf65BEd27e96a367c61e0E06C54e14B16b84a5870", // MFR
      cryptoRegistry: "0xAB38213cB4400f19b1b28bfc4f8B00792AC164A7", // CR
      cryptoFactoryRegistry: "0x41871A4c63d8Fae4855848cd1790ed237454A5C4", // CFR
    },
  ],

  //UniV3
  TickLens: "0x0000000000000000000000000000000000000000",

  //Should deploy contracts below
  //Approve
  Approve: "0x1D29C0819A6Bc066C859F6CDB05A0C7a4E00B9dd",
  err: "0xc75406f11cF2E638830f1f2822BC3ff12cAA0186",
  //Adapter
  UniV2Adapter: "0xcC59a96DDBd08bDA63163b0C4046326796cBE56c",
  UniV3Adapter: "0x0000000000000000000000000000000000000000",
  // for curve
  CurveAdapter: "0x0000000000000000000000000000000000000000",
  // for kinesis swap
  StableSwapNoRegistryAdapter: "0xAA6c5F0B52D66bFBde1A0C8dcB478D9e50A53190",
  // for saddle swap fork()
  StableSwapAdapter: "0xEcD4f5288971886cB29899A278c7A36e823D9025",
  BalancerAdapter: "0x0000000000000000000000000000000000000000",

  //Viewer
  UniV2Viewer: "0xE5406aeb878a341656E8c6A2E16d0b07728F5977",
  UniV3Viewer: "0x0000000000000000000000000000000000000000",
  CurveViewer: "0x0000000000000000000000000000000000000000",
  CurveNoRegistryViewer: "0x0000000000000000000000000000000000000000",
  StableSwapViewer: "0x7B0A49EcDE59e2943489bA8Bfb285c3b31611423",
  CurveCryptoViewer: "0x0000000000000000000000000000000000000000",
  BalancerViewer: "0x0000000000000000000000000000000000000000",
  TokenViewer: "0xEfbA9791DfDf14844a3Cb2b31F28365F8123193a",

  //Proxy
  RouteProxy: "0xc553acAC773b2eC504e578c7eB4d8f1261E32e21",
  ApproveProxy: "0xCb654761E680e7f5cA72c42EB745Ba8c557B7Cd7",

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
  // stable swap
  SaddlePools: [
    "0x1275203FB58Fc25bC6963B13C2a1ED1541563aF0",
    "0x21d4365834B7c61447e142ef6bCf01136cBD01c6",
    "0x81272C5c573919eF0C719D6d63317a4629F161da",
  ],
  // Only base pools(saddle)
  KinesisSaddlePools: ["0x49b97224655AaD13832296b8f6185231AFB8aaCc", "0xbBD5a7AE45a484BD8dAbdfeeeb33E4b859D2c95C"],
  UniswapV3Pools: [],
  Deployed: {
    UniV2Viewer: "",
    UniV3Viewer: "",
    CurveViewer: "",
    CurveCryptoViewer: "",
    BalancerViewer: "",
    TokenViewer: "",
    UniV2Adapter: "0x1CC390780132Fad16519661dA3FE53E8d9a008E6",
    CurveAdapter: "",
    BalancerAdapter: "",
    RouteProxy: "0xe346a7B589de9643D7bd4e23Ab7846456fD6e98E",
    Approve: "0x70CF1f365DcFE8672E2A2bCCd3BDAEEE408B9a90",
    ApproveProxy: "0xaf957563450b124655Af816c1D947a647bac62D1",
    TokenValidChecker: "0x2A04a1F10ae7c8DE951602690489f6b0DEd4f08a",
  },
  BalancerPool: undefined,
  Uni2Pool: ["0x0eD7e52944161450477ee417DE9Cd3a859b14fD0", "0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82"],
  CurvePools: [
    {
      swapType: "NativeToToken",
      address: "0xA844B2fFEB34AB5878E3B520e87b50F125DA7919", // BNB -> BNBX
      fromToken: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
      toToken: "0x1bdd3Cf7F79cfB8EdbB955f20ad99211551BA275",
    },
  ],
  Oracles: [
    { coin: "0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c", oracle: "0x264990fbd0A4796A3E3d8E37C4d5F87a3aCa5Ebf" },
    { coin: "0x2170Ed0880ac9A755fd29B2688956BD959F933F8", oracle: "0x9ef1B8c0E4F7dc8bF5719Ea496883DC6401d5b2e" },
    { coin: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c", oracle: "0x0567F2323251f0Aab15c8dFb1967E4e8A7D42aeE" },
    { coin: "0x55d398326f99059fF775485246999027B3197955", oracle: "0xB97Ad0E74fa7d920791E90258A6E2085088b4320" },
    { coin: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d", oracle: "0x51597f405303C4377E36123cBc172b13269EA163" },
    { coin: "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56", oracle: "0xcBb98864Ef56E9042e7d2efef76141f15731B82f" },
    { coin: "0x14016E85a25aeb13065688cAFB43044C2ef86784", oracle: "0xa3334A9762090E827413A7495AfeCE76F41dFc06" },
    { coin: "0xF8A0BF9cF54Bb92F17374d9e9A321E6a111a51bD", oracle: "0xca236E327F629f9Fc2c30A4E95775EbF0B89fac8" },
  ],
};

export { config };
