import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "ethers";

import { CurveAdapter, IERC20__factory, IWETH__factory, UniV2Adapter } from "../src/types";
import { IConfig } from "./common_config";
import type { ChainConfig, CurveDex, Oracles, Uni2Dex, Uni3Dex } from "./types";

/* ========================================================
 * new code
 * ======================================================== */
export class PolygonConfig implements IConfig {
  tokens: {
    native: string;
    wnative: string;
    usdc: string;
    usdt: string;
    stmatic: string;
    lpOfCurveUsdcUsdt: string;
    weth: string;
  };
  uni2Pools: {
    poolWnativeUsdc: string;
    poolWnativeUsdt: string;
    poolUsdcUsdt: string;
    poolMeshswapWnativeUsdt: string;
    poolMeshswapUsdcUsdt: string;
    poolMMWnativeUsdt: string;
    poolQuickswapWnativeUsdt: string;
  };
  uni3Pools: {
    poolWnativeUsdc: string;
  };
  curvePools: { poolNativeStmatic: string; poolUsdcUsdt: string };
  // balancerPools: { poolWnativeUsdc: string; poolUsdcUsdt: string };
  balancerPools: { poolWnativeUsdc: string; poolUsdcWeth: string };
  uni2Dexes: Array<Uni2Dex>;
  curveDexes: Array<CurveDex>;

  constructor() {
    this.tokens = {
      native: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
      wnative: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270",
      usdc: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
      usdt: "0xc2132d05d31c914a87c6611c10748aeb04b58e8f",
      stmatic: "0x3a58a54c066fdc0f2d55fc9c89f0415c92ebf3c4",
      lpOfCurveUsdcUsdt: "0xE7a24EF0C5e95Ffb0f6684b813A78F2a3AD7D171",
      weth: "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619",
    };
    this.uni2Pools = {
      poolWnativeUsdc: "0xcd353F79d9FADe311fC3119B841e1f456b54e858",
      poolWnativeUsdt: "0x55FF76BFFC3Cdd9D5FdbBC2ece4528ECcE45047e",
      poolUsdcUsdt: "0x4B1F1e2435A9C96f7330FAea190Ef6A7C8D70001",
      poolMeshswapWnativeUsdt: "0x24af68fF6e3501EAf8b52a9F7935225E524FE617", // meshswap
      poolMeshswapUsdcUsdt: "0x274EBd0A589445d2759E379277984c19dbF83cFD", // meshswap
      poolMMWnativeUsdt: "0xa789324E64268C5385eA7678435Fa83532705B0F", // mm
      poolQuickswapWnativeUsdt: "0x604229c960e5CACF2aaEAc8Be68Ac07BA9dF81c3",
    };
    this.curvePools = {
      poolNativeStmatic: "0xFb6FE7802bA9290ef8b00CA16Af4Bc26eb663a28",
      poolUsdcUsdt: "0x445FE580eF8d70FF569aB36e80c647af338db351",
    };

    this.uni3Pools = {
      poolWnativeUsdc: "0xA374094527e1673A86dE625aa59517c5dE346d32",
    };
    /** =======================================================
     * Balancer:
     *   - 특정 <poolContract> 찾는법:
     *     (1) https://polygon.balancer.fi/# invest에서 metamask를 연결하고 검색함
     *     (2) 그 안에서 pool detail에 contract address 있음
     *   - 특정 <poolContract>의 token address들 찾는법: <valutContract>.getPoolTokens(<poolContract>.getPoolId)
     *   dex app: https://polygon.balancer.fi/#
     *   valut: 0xBA12222222228d8Ba445958a75a0704d566BF2C8
     *   weighted pool factory: 0x8E9aa87E45e92bad84D5F8DD1bff34Fb92637dE9
     * ======================================================== */
    this.balancerPools = {
      poolWnativeUsdc: "0x0297e37f1873d2dab4487aa67cd56b58e2f27875", // from dex app: https://app.balancer.fi/#/polygon/pool/0x0297e37f1873d2dab4487aa67cd56b58e2f27875000100000000000000000002
      // poolUsdcUsdt: "0x06Df3b2bbB68adc8B0e302443692037ED9f91b42", // from dex app: https://app.balancer.fi/#/polygon/pool/0x06df3b2bbb68adc8b0e302443692037ed9f91b42000000000000000000000012
      poolUsdcWeth: "0x0297e37f1873d2dab4487aa67cd56b58e2f27875", // from dex app: https://app.balancer.fi/#/polygon/pool/0x0297e37f1873d2dab4487aa67cd56b58e2f27875000100000000000000000002
    };
    /** =======================================================
     * Univ2:
     *   factory (sushi): 0xc35DADB65012eC5796536bD9864eD8773aBc74C4
     * ======================================================== */
    this.uni2Dexes = [
      {
        factory: "0x7cFB780010e9C861e03bCbC7AC12E013137D47A5", // mmfactory
        fee: 1700,
      },
      {
        factory: "0xc35DADB65012eC5796536bD9864eD8773aBc74C4", // sushiswap
        fee: 3000,
      },
      {
        factory: "0x9F3044f7F9FC8bC9eD615d54845b4577B833282d", // meshswap
        fee: 1000,
      },
      {
        factory: "0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32", // quickswap
        fee: 3000,
      },
    ];
    /** =======================================================
     * Curve:
     *   dex app: https://polygon.curve.fi/
     *   address provider: 0x0000000022D53366457F9d5E68Ec105046FC4383
     * ======================================================== */
    this.curveDexes = [
      {
        forkType: "curve",
        registry: "0x094d12e5b541784701FD8d65F11fc0598FBC6332", // MainRegistry (MR)
        factoryRegistry: "0x722272D36ef0Da72FF51c5A65Db7b870E2e8D4ee", // MainFactoryRegistry (MFR)
        cryptoRegistry: "0x47bB542B9dE58b970bA50c9dae444DDB4c16751a", // CryptoRegistry (CR)
        cryptoFactoryRegistry: "0xE5De15A9C9bBedb4F5EC13B131E61245f2983A69", // CryptoFactoryRegistry (CFR) // (wnative, stmatic)
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

  async depositUsdt(signer: SignerWithAddress, amountIn: ethers.BigNumber, adapter: UniV2Adapter) {
    const usdt = IERC20__factory.connect(this.tokens.usdt, signer);
    const wnative = IWETH__factory.connect(this.tokens.wnative, signer);
    const poolAddr = this.uni2Pools.poolWnativeUsdt;

    await wnative.deposit({ value: amountIn }).then(tx => tx.wait()); // path: signer, token: native -> wnative
    await wnative.transfer(poolAddr, amountIn).then(tx => tx.wait()); // path: signer -> pool, token: wnative
    await adapter.swapExactIn(wnative.address, amountIn, usdt.address, poolAddr, signer.address); // path: pool -> signer, token: wnative -> usdt
  }

  async depositLpOfCurveUsdcUsdt(signer: SignerWithAddress, amountIn: ethers.BigNumber, adapter: CurveAdapter) {
    /* ---------------------------- args ---------------------------- */
    const fromTokenAddr = polygonConfig.tokens.usdc;
    const toTokenAddr = polygonConfig.tokens.lpOfCurveUsdcUsdt;
    const fromToken = IERC20__factory.connect(fromTokenAddr, signer);
    const toToken = IERC20__factory.connect(toTokenAddr, signer);
    const poolAddr = polygonConfig.curvePools.poolUsdcUsdt;

    /* ---------------------------- run ---------------------------- */
    // path: signer -> adapter, token: usdc
    await fromToken.transfer(adapter.address, amountIn).then(tx => tx.wait());

    // path: adapter -> signer, token: usdc -> token
    const receipt = await adapter
      .swapExactIn(fromTokenAddr, amountIn, toTokenAddr, poolAddr, signer.address)
      .then(tx => tx.wait());
  }

  async depositStmatic(signer: SignerWithAddress, amountIn: ethers.BigNumber, adapter: CurveAdapter) {
    /* ---------------------------- args ---------------------------- */
    const toToken = IERC20__factory.connect(polygonConfig.tokens.stmatic, signer);
    const fromTokenAddr = polygonConfig.tokens.native;
    const toTokenAddr = toToken.address;
    const poolAddr = polygonConfig.curvePools.poolNativeStmatic;

    /* ---------------------------- run ---------------------------- */
    // path: signer -> adapter, token: native
    await signer.sendTransaction({ to: adapter.address, value: amountIn, gasLimit: 1000000 });

    // path: adapter -> signer, token: native -> token
    const receipt = await adapter
      .swapExactIn(fromTokenAddr, amountIn, toTokenAddr, poolAddr, signer.address)
      .then(tx => tx.wait());
  }
}

export const polygonConfig = new PolygonConfig();

/* ========================================================
 * original code
 * ======================================================== */
const matic_config = {
  coin: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
  //WETH(WMATIC)
  WETH: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270",

  //lending address provider
  AAVEV2LendingAddressProvider: "0xd05e3E715d945B59290df0ae8eF85c1BdB684744",
  AAVEV3LendingAddressProvider: "0xa97684ead0e402dC232d5A977953DF7ECBaB3CDb", // 치환필요
  FlashloanSwap: "0xa97684ead0e402dC232d5A977953DF7ECBaB3CDb",

  //UniV3Factory
  UniV3Factory: "0x1F98431c8aD98523631AE4a59f267346ea31F984",

  CurveDexes: [
    {
      forkType: "curve",
      registry: "0x094d12e5b541784701FD8d65F11fc0598FBC6332", // MainRegistry (MR)
      factoryRegistry: "0x722272D36ef0Da72FF51c5A65Db7b870E2e8D4ee", // MainFactoryRegistry (MFR)
      cryptoRegistry: "0x47bB542B9dE58b970bA50c9dae444DDB4c16751a", // CryptoRegistry (CR)
      cryptoFactoryRegistry: "0xE5De15A9C9bBedb4F5EC13B131E61245f2983A69", // CryptoFactoryRegistry (CFR) // (wnative, stmatic)
    },
  ],

  //CurveAddressProvider
  CurveAddressProvider: "0x0000000022D53366457F9d5E68Ec105046FC4383",

  //CurveRegistry
  CurveCryptoRegistry: "0x47bB542B9dE58b970bA50c9dae444DDB4c16751a",
  // get curve factory registry from exchange
  // registry -> only factory ele!=address(0) at idx=0
  // 2 coins
  CurveCryptoFactoryRegistry: "0xE5De15A9C9bBedb4F5EC13B131E61245f2983A69",
  //UniV3
  TickLens: "0xbfd8137f7d1516D3ea5cA83523914859ec47F573",

  //Should deploy contracts below
  //Approve
  Approve: "0x14A2E44365e198161769Ca71671A967E63Ca8559",

  //Adapter
  UniV2Adapter: "0xd083c6fF3280cFb473B4f37913C4A0D68C06397a",
  UniV3Adapter: "0xe7A10372A6E422dbd01D19978a63fc1baA6De590",
  CurveAdapter: "0x78A34554406d5E2fd2B422b15679a26cfec2E01b",
  BalancerAdapter: "0x1CC390780132Fad16519661dA3FE53E8d9a008E6",

  //Viewer
  UniV2Viewer: "0xED5EB558fE902611f79E63D1A3A31ca39a88362D",
  UniV3Viewer: "0x544341a3F44B594634EE0F8Ed9E467e1baDb3640",
  CurveViewer: "0x416DEb7401bCb5CE1da7B7654505B29925EF7f17",
  CurveCryptoViewer: "0x44e0CF4e29583EE0027E0a9A45662B629Cd8b240",
  BalancerViewer: "0x6D591FF64297E7Cbb22C6523DF36FC399E72DDcf",
  TokenViewer: "0xeD88594a23Be9f53E5958AEA54437A7719c1fb89",

  //Proxy
  RouteProxy: "0x9A5c7c3E5f504A634462614f3929fcFc561F245c",
  ApproveProxy: "0xb2828A315563fc2A8bcEBc8927b9AcfD40fb98eC",

  //Tokens
  Tokens: {
    renBTC: { address: "0xDBf31dF14B66535aF65AaC99C32e9eA844e14501", decimals: 8 },
    MATIC: { address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee", decimals: 18 },
    AAVE: { address: "0xd6df932a45c0f255f85145f286ea0b292b21c90b", decimals: 18 },
    MUST: { address: "0x9c78ee466d6cb57a4d01fd887d2b5dfb2d46288f", decimals: 18 },
    UNI: { address: "0xb33eaad8d922b1083446dc23f610c2567fb5180f", decimals: 18 },
    USDT: { address: "0xc2132d05d31c914a87c6611c10748aeb04b58e8f", decimals: 6 },
    DAI: { address: "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063", decimals: 18 },
    WBTC: { address: "0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6", decimals: 8 },
    LINK: { address: "0x53e0bca35ec356bd5dddfebbd1fc0fd03fabad39", decimals: 18 },
    SUPER: { address: "0xa1428174f516f527fafdd146b883bb4428682737", decimals: 18 },
    MANA: { address: "0xa1c57f48f0deb89f569dfbe6e2b7f46d33606fd4", decimals: 18 },
    QUICK: { address: "0x831753dd7087cac61ab5644b308642cc1c33dc13", decimals: 18 },
    WMATIC: { address: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270", decimals: 18 },
    COMP: { address: "0x8505b9d2254a7ae468c0e9dd10ccea3a837aef5c", decimals: 18 },
    BTU: { address: "0xfdc26cda2d2440d0e83cd1dee8e8be48405806dc", decimals: 18 },
    $DG: { address: "0x2a93172c8dccbfbc60a39d56183b7279a2f647b4", decimals: 18 },
    AGA: { address: "0x033d942a6b495c4071083f4cde1f17e986fe856c", decimals: 4 },
    AGAr: { address: "0xf84bd51eab957c2e7b7d646a3427c5a50848281d", decimals: 8 },
    ARIA20: { address: "0x46f48fbdedaa6f5500993bede9539ef85f4bee8e", decimals: 18 },
    AZUKI: { address: "0x7cdc0421469398e0f3aa8890693d86c840ac8931", decimals: 18 },
    CEL: { address: "0xd85d1e945766fea5eda9103f918bd915fbca63e6", decimals: 4 },
    CFI: { address: "0xecf8f2fa183b1c4d2a269bf98a54fce86c812d3e", decimals: 18 },
    DMT: { address: "0xd28449bb9bb659725accad52947677cce3719fd7", decimals: 18 },
    DSLA: { address: "0xa0e390e9cea0d0e8cd40048ced9fa9ea10d71639", decimals: 18 },
    ETH: { address: "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619", decimals: 18 },
    GAME: { address: "0x8d1566569d5b695d44a9a234540f68d393cdc40d", decimals: 18 },
    GHST: { address: "0x385eeac5cb85a38a9a07a70c73e0a3271cfb54a7", decimals: 18 },
    HEX: { address: "0x23d29d30e35c5e8d321e1dc9a8a61bfd846d4c5c", decimals: 8 },
    IGG: { address: "0xe6fc6c7cb6d2c31b359a49a33ef08ab87f4de7ce", decimals: 6 },
    MONA: { address: "0x6968105460f67c3bf751be7c15f92f5286fd0ce5", decimals: 18 },
    OM: { address: "0xc3ec80343d2bae2f8e680fdadde7c17e71e114ea", decimals: 18 },
    PICKLE: { address: "0x2b88ad57897a8b496595925f43048301c37615da", decimals: 18 },
    PPDEX: { address: "0x127984b5e6d5c59f81dacc9f1c8b3bdc8494572e", decimals: 18 },
    SDT: { address: "0x361a5a4993493ce00f61c32d4ecca5512b82ce90", decimals: 18 },
    SUSHI: { address: "0x0b3f868e0be5597d5db7feb59e1cadbb0fdda50a", decimals: 18 },
    SX: { address: "0x840195888db4d6a99ed9f73fcd3b225bb3cb1a79", decimals: 18 },
    UBT: { address: "0x7fbc10850cae055b27039af31bd258430e714c62", decimals: 8 },
    VISION: { address: "0x034b2090b579228482520c589dbd397c53fc51cc", decimals: 18 },
    WISE: { address: "0xb77e62709e39ad1cbeebe77cf493745aec0f453a", decimals: 18 },
    WOLF: { address: "0x8f18dc399594b451eda8c5da02d0563c0b2d0f16", decimals: 9 },
    iFARM: { address: "0xab0b2ddb9c7e440fac8e140a89c0dbcbf2d7bbff", decimals: 18 },
    mOCEAN: { address: "0x282d8efce846a88b159800bd4130ad77443fa1a1", decimals: 18 },
    ANY: { address: "0x6ab6d61428fde76768d7b45d8bfeec19c6ef91a8", decimals: 18 },
    GFARM2: { address: "0x7075cab6bcca06613e2d071bd918d1a0241379e2", decimals: 18 },
    Krill: { address: "0x05089c9ebffa4f0aca269e32056b1b36b37ed71b", decimals: 18 },
    PLOT: { address: "0xe82808eaa78339b06a691fd92e1be79671cad8d3", decimals: 18 },
    TEL: { address: "0xdf7837de1f2fa4631d716cf2502f8b230f1dcc32", decimals: 2 },
    amUSDC: { address: "0x1a13f4ca1d028320a707d99520abfefca3998b7f", decimals: 6 },
    amUSDT: { address: "0x60d55f02a771d515e077c9c2403a1ef324885cec", decimals: 6 },
    amWBTC: { address: "0x5c2ed810328349100a66b82b78a1791b101c9d61", decimals: 8 },
    amWETH: { address: "0x28424507fefb6f7f8e9d3860f56504e4e5f5f390", decimals: 18 },
    amWMATIC: { address: "0x8df3aad3a84da6b69a4da8aec3ea40d9091b2ac4", decimals: 18 },
    amAAVE: { address: "0x1d2a0e5ec8e5bbdca5cb219e649b565d8e5c3360", decimals: 18 },
    amDAI: { address: "0x27f8d03b3a2196956ed754badc28d73be8830a6e", decimals: 18 },
    CRV: { address: "0x172370d5cd63279efa6d502dab29171933a610af", decimals: 18 },
    BIFI: { address: "0xfbdd194376de19a88118e84e279b977f165d01b8", decimals: 18 },
    FISH: { address: "0x3a3df212b7aa91aa0402b9035b098891d276572b", decimals: 18 },
    PolyDoge: { address: "0x8a953cfe442c5e8855cc6c61b1293fa648bae472", decimals: 18 },
    IRON: { address: "0xd86b5923f3ad7b585ed81b448170ae026c65ae9a", decimals: 18 },
    TITAN: { address: "0xaaa5b9e6c589642f98a1cda99b9d024b8407285a", decimals: 18 },
    DFYN: { address: "0xc168e40227e4ebd8c1cae80f7a55a4f0e6d66c97", decimals: 18 },
    WOO: { address: "0x1b815d120b3ef02039ee11dc2d33de7aa4a8c603", decimals: 18 },
    WEXpoly: { address: "0x4c4bf319237d98a30a929a96112effa8da3510eb", decimals: 18 },
    QI: { address: "0x580a84c73811e1839f75d86d75d88cca0c241ff4", decimals: 18 },
    miMATIC: { address: "0xa3fa99a148fa48d14ed51d610c367c61876997f1", decimals: 18 },
    OMEN: { address: "0x76e63a3e7ba1e2e61d3da86a87479f983de89a7e", decimals: 18 },
    KNC: { address: "0x1c954e8fe737f99f68fa1ccda3e51ebdb291948c", decimals: 18 },
    BAL: { address: "0x9a71012b13ca4d3d0cdc72a177df3ef03b0e76a3", decimals: 18 },
    ICE_1: { address: "0x4a81f8796e0c6ad4877a51c86693b0de8093f2ef", decimals: 18 },
    PAPR: { address: "0xfbe49330e7b9f58a822788f86c1be38ab902bab1", decimals: 18 },
    PRNTR: { address: "0x03cba0cff3bf727711eae7ef11d152dce3163901", decimals: 18 },
    ETHA: { address: "0x59e9261255644c411afdd00bd89162d09d862e38", decimals: 18 },
    ADDY: { address: "0xc3fdbadc7c795ef1d6ba111e06ff8f16a20ea539", decimals: 18 },
    UST: { address: "0x692597b009d13c4049a947cab2239b7d6517875f", decimals: 18 },
    SNK: { address: "0x689f8e5913c158ffb5ac5aeb83b3c875f5d20309", decimals: 18 },
    IRIS: { address: "0xdab35042e63e93cc8556c9bae482e5415b5ac4b1", decimals: 18 },
    xUSD: { address: "0x3a3e7650f8b9f667da98f236010fbf44ee4b2975", decimals: 18 },
    KOGECOIN: { address: "0x13748d548d95d78a3c83fe3f32604b4796cffa23", decimals: 9 },
    EURS: { address: "0xe111178a87a3bff0c8d18decba5798827539ae99", decimals: 2 },
    XSGD: { address: "0x769434dca303597c8fc4997bf3dab233e961eda2", decimals: 6 },
    TETU: { address: "0x255707b70bf90aa112006e1b07b9aea6de021424", decimals: 18 },
    "1FLR": { address: "0x5f0197ba06860dac7e31258bdf749f92b6a636d4", decimals: 18 },
    APW: { address: "0x6c0ab120dbd11ba701aff6748568311668f63fe0", decimals: 18 },
    DHT: { address: "0x8c92e38eca8210f4fcbf17f0951b198dd7668292", decimals: 18 },
    NACHO: { address: "0xcd86152047e800d67bdf00a4c635a8b6c0e5c4c2", decimals: 18 },
    USV: { address: "0xac63686230f64bdeaf086fe6764085453ab3023f", decimals: 9 },
    INST: { address: "0xf50d05a1402d0adafa880d36050736f9f6ee7dee", decimals: 18 },
    WIXS: { address: "0x1ba17c639bdaecd8dc4aac37df062d17ee43a1b8", decimals: 18 },
    agEUR: { address: "0xe0b52e49357fd4daf2c15e02058dce6bc0057db4", decimals: 18 },
    NFTI: { address: "0xc75ea0c71023c14952f3c7b9101ecbbaa14aa27a", decimals: 18 },
    deUSDC: { address: "0x1ddcaa4ed761428ae348befc6718bcb12e63bfaa", decimals: 6 },
    FRAX: { address: "0x45c32fa6df82ead1e2ef74d17b76547eddfaff89", decimals: 18 },
    FXS: { address: "0x1a3acf6d19267e2d3e7f898f42803e90c9219062", decimals: 18 },
    FODL: { address: "0x5314ba045a459f63906aa7c76d9f337dcb7d6995", decimals: 18 },
    dUSD: { address: "0xbae28251b2a4e621aa7e20538c06dee010bc06de", decimals: 18 },
    REQ: { address: "0xb25e20de2f2ebb4cffd4d16a55c7b395e8a94762", decimals: 18 },
    WARP: { address: "0x3f46a70adb395cddb81ff9bfe3b62adae1b44816", decimals: 9 },
    NFD: { address: "0x0a5926027d407222f8fe20f24cb16e103f617046", decimals: 18 },
    CHP: { address: "0x59b5654a17ac44f3068b3882f298881433bb07ef", decimals: 18 },
    DOG: { address: "0xeee3371b89fc43ea970e908536fcddd975135d8a", decimals: 18 },
    ABI: { address: "0x6d5f5317308c6fe7d6ce16930353a8dfd92ba4d7", decimals: 9 },
    NFTY: { address: "0x8623e66bea0dce41b6d47f9c44e806a115babae0", decimals: 18 },
    ULT: { address: "0xf0059cc2b3e980065a906940fbce5f9db7ae40a7", decimals: 18 },
    RIOT: { address: "0x4ff0b68abc2b9e4e1401e9b691dba7d66b264ac8", decimals: 18 },
    AXIA: { address: "0x49690541e3f6e933a9aa3cffee6010a7bb5b72d7", decimals: 18 },
    SWASH: { address: "0xba3cb8329d442e6f9eb70fafe1e214251df3d275", decimals: 18 },
    VSQ: { address: "0x29f1e986fca02b7e54138c04c4f503dddd250558", decimals: 9 },
    ORE: { address: "0xd52f6ca48882be8fbaa98ce390db18e1dbe1062d", decimals: 18 },
    FNC: { address: "0x7f280dac515121dcda3eac69eb4c13a52392cace", decimals: 18 },
    "ETH2x-FLI-P": { address: "0x3ad707da309f3845cd602059901e39c4dcd66473", decimals: 18 },
    "Yf-DAI": { address: "0x7e7ff932fab08a0af569f93ce65e7b8b23698ad8", decimals: 18 },
    ELK: { address: "0xeeeeeb57642040be42185f49c52f7e9b38f8eeee", decimals: 18 },
    cxETH: { address: "0xfe4546fefe124f30788c4cc1bb9aa6907a7987f9", decimals: 18 },
    GENE: { address: "0x34667ed7c36cbbbf2d5d5c5c8d6eb76a094edb9f", decimals: 18 },
    PGX: { address: "0xc1c93d475dc82fe72dbc7074d55f5a734f8ceeae", decimals: 18 },
    IXT: { address: "0xe06bd4f5aac8d0aa337d13ec88db6defc6eaeefe", decimals: 18 },
    SAND: { address: "0xbbba073c31bf03b8acf7c28ef0738decf3695683", decimals: 18 },
    ICE_2: { address: "0xc6c855ad634dcdad23e64da71ba85b8c51e5ad7c", decimals: 18 },
    SNX: { address: "0x50b728d8d964fd00c2d0aad81718b71311fef68a", decimals: 18 },
    BLOK: { address: "0x229b1b6c23ff8953d663c4cbb519717e323a0a84", decimals: 18 },
    FYN: { address: "0x3b56a704c01d650147ade2b8cee594066b3f9421", decimals: 18 },
    KLIMA: { address: "0x4e78011ce80ee02d2c3e649fb657e45898257815", decimals: 9 },
    AVAX: { address: "0x2c89bbc92bd86f8075d1decc58c7f4e0107f286b", decimals: 18 },
    "ROUTE (PoS)": { address: "0x16eccfdbb4ee1a85a33f3a9b21175cd7ae753db4", decimals: 18 },
    DG: { address: "0xef938b6da8576a896f6e0321ef80996f4890f9c4", decimals: 18 },
    TOWER: { address: "0x2bc07124d8dac638e290f401046ad584546bc47b", decimals: 18 },
    KASTA: { address: "0x235737dbb56e8517391473f7c964db31fa6ef280", decimals: 18 },
    DERC: { address: "0xb35fcbcf1fd489fce02ee146599e893fdcdc60e6", decimals: 18 },
    STACK: { address: "0x980111ae1b84e50222c8843e3a7a038f36fecd2b", decimals: 18 },
    PLA: { address: "0x8765f05adce126d70bcdf1b0a48db573316662eb", decimals: 18 },
    MSU: { address: "0xe8377a076adabb3f9838afb77bee96eac101ffb1", decimals: 18 },
    BANANA: { address: "0x5d47baba0d66083c52009271faf3f50dcc01023c", decimals: 18 },
    TRY: { address: "0xefee2de82343be622dcb4e545f75a3b9f50c272d", decimals: 18 },
    VOXEL: { address: "0xd0258a3fd00f38aa8090dfee343f10a9d4d30d3f", decimals: 18 },
    GAIA: { address: "0x723b17718289a91af252d616de2c77944962d122", decimals: 18 },
    MV: { address: "0xa3c322ad15218fbfaed26ba7f616249f7705d945", decimals: 18 },
    gOHM: { address: "0xd8ca34fd379d9ca3c6ee3b3905678320f5b45195", decimals: 18 },
    $ANRX: { address: "0x554f074d9ccda8f483d1812d4874cbebd682644e", decimals: 18 },
    CHAMP: { address: "0x8f9e8e833a69aa467e42c46cca640da84dd4585f", decimals: 8 },
    ELON: { address: "0xe0339c80ffde91f3e20494df88d4206d86024cdf", decimals: 18 },
    KOM: { address: "0xc004e2318722ea2b15499d6375905d75ee5390b8", decimals: 8 },
    PSP: { address: "0x42d61d766b85431666b39b89c43011f24451bff6", decimals: 18 },
    GNS: { address: "0xe5417af564e4bfda1c483642db72007871397896", decimals: 18 },
    FRM: { address: "0xd99bafe5031cc8b345cb2e8c80135991f12d7130", decimals: 18 },
    REVV: { address: "0x70c006878a5a50ed185ac4c87d837633923de296", decimals: 18 },
    NXTT: { address: "0x0d0b8488222f7f83b23e365320a4021b12ead608", decimals: 18 },
    GFC: { address: "0x071ac29d569a47ebffb9e57517f855cb577dcc4c", decimals: 18 },
    "USD+": { address: "0x236eec6359fb44cce8f97e99387aa7f8cd5cde1f", decimals: 6 },
    ICE_3: { address: "0x4e1581f01046efdd7a1a2cdb0f82cdd7f71f2e59", decimals: 18 },
    BCMC: { address: "0xc10358f062663448a3489fc258139944534592ac", decimals: 18 },
    LUNA: { address: "0x24834bbec7e39ef42f4a75eaf8e5b6486d3f0e57", decimals: 18 },
    UM: { address: "0x3b1a0c9252ee7403093ff55b4a5886d49a3d837a", decimals: 18 },
    GMEE: { address: "0xcf32822ff397ef82425153a9dcb726e5ff61dca7", decimals: 18 },
    USDC: { address: "0x2791bca1f2de4661ed88a30c99a7a9449aa84174", decimals: 6 },
    PDDOLLAR: { address: "0x146e58d34eab0bff7e0a63cfe9332908d680c667", decimals: 18 },
    PDSHARE: { address: "0x3068382885602fc0089aec774944b5ad6123ae60", decimals: 18 },
    DFX: { address: "0xe7804d91dfcde7f776c90043e03eaa6df87e6395", decimals: 18 },
    MCO2: { address: "0xaa7dbd1598251f856c12f63557a4c4397c253cea", decimals: 18 },
    IMX: { address: "0x60bb3d364b765c497c8ce50ae0ae3f0882c5bd05", decimals: 18 },
    CUBO: { address: "0x381d168de3991c7413d46e3459b48a5221e3dfe4", decimals: 18 },
    WELT: { address: "0x23e8b6a3f6891254988b84da3738d2bfe5e703b9", decimals: 18 },
    MVI: { address: "0xfe712251173a2cd5f5be2b46bb528328ea3565e1", decimals: 18 },
    AURUM: { address: "0x34d4ab47bee066f361fa52d792e69ac7bd05ee23", decimals: 18 },
    RAIDER: { address: "0xcd7361ac3307d1c5a46b63086a90742ff44c63b3", decimals: 18 },
    DDAO: { address: "0x90f3edc7d5298918f7bb51694134b07356f7d0c7", decimals: 18 },
    YEL: { address: "0xd3b71117e6c1558c1553305b44988cd944e97300", decimals: 18 },
    DWEB: { address: "0x8839e639f210b80ffea73aedf51baed8dac04499", decimals: 18 },
    MILK: { address: "0x1599fe55cda767b1f631ee7d414b41f5d6de393d", decimals: 18 },
    RAI: { address: "0x00e5646f60ac6fb446f621d146b6e1886f002905", decimals: 18 },
    INSUR: { address: "0x8a0e8b4b0903929f47c3ea30973940d4a9702067", decimals: 18 },
    GRT: { address: "0x5fe2b58c013d7601147dcdd68c143a77499f5531", decimals: 18 },
    POLX: { address: "0x187ae45f2d361cbce37c6a8622119c91148f261b", decimals: 18 },
    MYST: { address: "0x1379e8886a944d2d9d440b3d88df536aea08d9f3", decimals: 18 },
    GEO$: { address: "0xf1428850f92b87e629c6f3a3b75bffbc496f7ba6", decimals: 18 },
    PRXY: { address: "0xab3d689c22a2bb821f50a4ff0f21a7980dcb8591", decimals: 18 },
    NEX: { address: "0xa486c6bc102f409180ccb8a94ba045d39f8fc7cb", decimals: 8 },
    PAR: { address: "0xe2aa7db6da1dae97c5f5c6914d285fbfcc32a128", decimals: 18 },
    MIMO: { address: "0xadac33f543267c4d59a8c299cf804c303bc3e4ac", decimals: 18 },
    CLAM: { address: "0xc250e9987a032acac293d838726c511e6e1c029d", decimals: 9 },
    mSHEESHA: { address: "0x88c949b4eb85a90071f2c0bef861bddee1a7479d", decimals: 18 },
    VHC: { address: "0x51b5619f5180e333d18b6310c8d540aea43a0371", decimals: 18 },
    DYST: { address: "0x39ab6574c289c3ae4d88500eec792ab5b947a5eb", decimals: 18 },
    MESH: { address: "0x82362ec182db3cf7829014bc61e9be8a2e82868a", decimals: 18 },
    NXD: { address: "0x228b5c21ac00155cf62c57bcc704c0da8187950b", decimals: 18 },
    XCAD: { address: "0xa55870278d6389ec5b524553d03c04f5677c061e", decimals: 18 },
    SAFLE: { address: "0x04b33078ea1aef29bf3fb29c6ab7b200c58ea126", decimals: 18 },
    BLANK: { address: "0xf4c83080e80ae530d6f8180572cbbf1ac9d5d435", decimals: 18 },
    TUSD: { address: "0x2e1ad108ff1d8c782fcbbb89aad783ac49586756", decimals: 18 },
    DOGIRA: { address: "0xdda40cdfe4a0090f42ff49f264a831402adb801a", decimals: 9 },
    UNIX: { address: "0x8c4476dfec8e7eedf2de3e9e9461b7c14c828d46", decimals: 18 },
    XGEM: { address: "0x02649c1ff4296038de4b9ba8f491b42b940a8252", decimals: 18 },
    oORC: { address: "0x12c9ffe6538f20a982fd4d17912f0ca00fa82d30", decimals: 18 },
    IQ: { address: "0xb9638272ad6998708de56bbc0a290a1de534a578", decimals: 18 },
    ORBS: { address: "0x614389eaae0a6821dc49062d56bda3d9d45fa2ff", decimals: 18 },
    XZAR: { address: "0x30de46509dbc3a491128f97be0aaf70dc7ff33cb", decimals: 18 },
    PECO: { address: "0xa9536b9c75a9e0fae3b56a96ac8edf76abc91978", decimals: 18 },
    O3: { address: "0xee9801669c6138e84bd50deb500827b776777d28", decimals: 18 },
    LUXY: { address: "0xd4945a3d0de9923035521687d4bf18cc9b0c7c2a", decimals: 18 },
    jEUR: { address: "0x4e3decbb3645551b8a19f0ea1678079fcb33fb4c", decimals: 18 },
    COT: { address: "0x8d520c8e66091cfd6743fe37fbe3a09505616c4b", decimals: 18 },
    MASK: { address: "0x2b9e7ccdf0f4e5b24757c1e1a80e311e34cb10c7", decimals: 18 },
    NITRO: { address: "0x695fc8b80f344411f34bdbcb4e621aa69ada384b", decimals: 18 },
    GET: { address: "0xdb725f82818de83e99f1dac22a9b5b51d3d04dd4", decimals: 18 },
    HOPE: { address: "0xd78c475133731cd54dadcb430f7aae4f03c1e660", decimals: 18 },
    WLD: { address: "0xa936e1f747d14fc30d08272d065c8aef4ab7f810", decimals: 18 },
    DATA: { address: "0x3a9a81d576d83ff21f26f325066054540720fc34", decimals: 18 },
    THX: { address: "0x2934b36ca9a4b31e633c5be670c8c8b28b6aa015", decimals: 18 },
    MASQ: { address: "0xee9a352f6aac4af1a5b9f467f6a93e0ffbe9dd35", decimals: 18 },
    $KMC: { address: "0x44d09156c7b4acf0c64459fbcced7613f5519918", decimals: 18 },
    ADS: { address: "0x598e49f01befeb1753737934a5b11fea9119c796", decimals: 11 },
    CIOTX: { address: "0x300211def2a644b036a9bdd3e58159bb2074d388", decimals: 18 },
    MOD: { address: "0x8346ab8d5ea7a9db0209aed2d1806afa0e2c4c21", decimals: 18 },
    BONDLY: { address: "0x64ca1571d1476b7a21c5aaf9f1a750a193a103c0", decimals: 18 },
    WNT: { address: "0x82a0e6c02b91ec9f6ff943c0a933c03dbaa19689", decimals: 18 },
    CYC: { address: "0xcfb54a6d2da14abecd231174fc5735b4436965d8", decimals: 18 },
    POP: { address: "0xc5b57e9a1e7914fda753a88f24e5703e617ee50c", decimals: 18 },
    FBX: { address: "0xd125443f38a69d776177c2b9c041f462936f8218", decimals: 18 },
    AWX: { address: "0x56a0efefc9f1fbb54fbd25629ac2aa764f1b56f7", decimals: 18 },
    FOX: { address: "0x65a05db8322701724c197af82c9cae41195b0aa8", decimals: 18 },
    GCR: { address: "0xa69d14d6369e414a32a5c7e729b7afbafd285965", decimals: 4 },
    jCHF: { address: "0xbd1463f02f61676d53fd183c2b19282bff93d099", decimals: 18 },
    SALE: { address: "0x8f6196901a4a153d8ee8f3fa779a042f6092d908", decimals: 18 },
    CRBN: { address: "0x89ef0900b0a6b5548ab2ff58ef588f9433b5fcf5", decimals: 18 },
    JPYC: { address: "0x431d5dff03120afa4bdf332c61a6e1766ef37bdb", decimals: 18 },
    WOMBAT: { address: "0x0c9c7712c83b3c70e7c5e11100d33d9401bdf9dd", decimals: 18 },
    LIME: { address: "0x7f67639ffc8c93dd558d452b8920b28815638c44", decimals: 18 },
    MaticX: { address: "0xfa68fb4628dff1028cfec22b4162fccd0d45efb6", decimals: 18 },
    oXRP: { address: "0xcc2a9051e904916047c26c90f41c000d4f273456", decimals: 6 },
    oUSDC: { address: "0x5bef2617ecca9a39924c09017c5f1e25efbb3ba8", decimals: 6 },
    oUSDT: { address: "0x957da9ebbcdc97dc4a8c274dd762ec2ab665e15f", decimals: 6 },
    oDAI: { address: "0x8ece0a50a025a7e13398212a5bed2ded11959949", decimals: 18 },
    oKLAY: { address: "0x0a02d33031917d836bd7af02f9f7f6c74d67805f", decimals: 18 },
    oKSP: { address: "0x3d3b92fe0b4c26b74f8ff13a32dd764f4dfd8b51", decimals: 18 },
    oWBTC: { address: "0xe631ffaa2cf4d91aac3e9589a5d5b390c82a032e", decimals: 8 },
    stMATIC: { address: "0x3A58a54C066FdC0f2D55FC9C89F0415C92eBf3C4", decimals: 18 },
    axlUSDC: { address: "0x750e4C4984a9e0f12978eA6742Bc1c5D248f40ed", decimals: 18 },
    am3CRV: { address: "0xE7a24EF0C5e95Ffb0f6684b813A78F2a3AD7D171", decimals: 18 },
  },

  BalancerPools: [
    "0x0297e37f1873D2DAb4487Aa67cD56B58E2F27875",
    "0x8f9Dd2064eb38E8E40F2aB67bDE27c0e16ea9B08",
    "0x03cD191F589d12b0582a99808cf19851E468E6B5",
    "0x36128D5436d2d70cab39C9AF9CcE146C38554ff0",
    "0xce66904B68f1f070332Cbc631DE7ee98B650b499",
    "0xb204BF10bc3a5435017D3db247f56dA601dFe08A",
  ],

  UniswapV3Pools: [
    "0x45dda9cb7c25131df268515131f647d726f50608",
    "0x167384319b41f7094e62f7506409eb38079abff8",
    "0x50eaedb835021e4a108b7290636d62e9765cc6d7",
    "0x847b64f9d3a95e977d157866447a5c0a5dfa0ee5",
    "0xa374094527e1673a86de625aa59517c5de346d32",
    "0x86f1d8390222a3691c28938ec7404a1661e618e0",
    "0x0e44ceb592acfc5d3f09d996302eb4c499ff8c10",
    "0x3f5228d0e7d75467366be7de2c31d0d098ba2c23",
    "0xf7abb7dee889da4300a82c26f8c0c725c64bd493",
    "0xf5d085c669f63d9983dc57b629b235793d009b0e",
    "0x5645dcb64c059aa11212707fbf4e7f984440a8cf",
    "0xdac8a8e6dbf8c690ec6815e0ff03491b2770255d",
    "0x14d428249aaca553df22b0abb3e09cc186b6734b",
    "0xfe343675878100b344802a6763fd373fdeed07a4",
    "0x8f5b8b73c5168747779e4ef38a80cc90caf358fb",
    "0x88f3c15523544835ff6c738ddb30995339ad57d6",
    "0xfa22d298e3b0bc1752e5ef2849cec1149d596674",
    "0xbd934a7778771a7e2d9bf80596002a214d8c9304",
    "0x254aa3a898071d6a2da0db11da73b02b4646078f",
    "0xeef1a9507b3d505f0062f2be9453981255b503c8",
    "0x3758238a51d82369090364f291b0c1f98d77ab3b",
    "0x67a9fe12fa6082d9d0203c84c6c56d3c4b269f28",
    "0x08b446353ddb5a1695774bd547703879ff253aea",
    "0xc8beca5d0ee2a80f19fbf67e45942ad257923d0f",
    "0x30f5c777ab316e6878d2b71a32274e4c2842327a",
    "0xc1dc5605b242a658adfc7d6e693a50aefb49bbae",
    "0x4f4b7666d46c1d9fd6a1115c22dcb6ba1271da26",
    "0x5f69c2ec01c22843f8273838d570243fd1963014",
    "0x9159a880b930aced1080ed4742818362663c8d46",
    "0x56fcb902bee19a645f9607cd1e1c0737b6358feb",
    "0x3fa147d6309abeb5c1316f7d8a7d8bd023e0cd80",
    "0x357faf5843c7fd7fb4e34fbeabdac16eabe8a5bc",
    "0x27b63daaa4d48e06c8401e441d568d6ba16d9b63",
    "0xcc8d95cde2840fceda80b46ba873b5d1d6b122dc",
    "0x4ccd010148379ea531d6c587cfdd60180196f9b1",
    "0x98b9162161164de1ed182a0dfa08f5fbf0f733ca",
    "0x9b08288c3be4f62bbf8d1c20ac9c5e6f9467d8b7",
    "0xa9077cdb3d13f45b8b9d87c43e11bce0e73d8631",
    "0x3f7cd6c7093d5a783128c926200c1fccb1d36b76",
    "0x4d05f2a005e6f36633778416764e82d1d12e7fbb",
    "0x9913a93c082fdc69f9e7d146b0e4ce9070d5a104",
    "0xbeaf7156ba07c3df8fac42e90188c5a752470db7",
    "0x998b16fe08f436f4b2984cdb01c091d5cdd247e3",
    "0xc4734e5d879102b21c9356676f11cbceaf08477c",
    "0x14653ce9f406ba7f35a7ffa43c81fa7ecd99c788",
    "0x9f32237ae1a240dff3be9458606b246ee2b199c4",
    "0x8e019016e932a356b964e57a16f8b42f9b664b93",
    "0x5b45481edb565bf69617e1055ed70003a568ad9c",
    "0x33f2ae66b4dfaf2f8599f2afc7f7146fb3be0e6c",
    "0x3cc6f5d3cbe52ecf15ccb43d0832ad4f6ef132cf",
  ],

  // MMFactory: "0x7cFB780010e9C861e03bCbC7AC12E013137D47A5",
  // QuickFactory: "0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32",
  // MeshFactory: "0x9F3044f7F9FC8bC9eD615d54845b4577B833282d",
  // SushiFactory: "0xc35DADB65012eC5796536bD9864eD8773aBc74C4",
  Uni2Dexes: [
    {
      factory: "0x7cFB780010e9C861e03bCbC7AC12E013137D47A5",
      fee: 1700,
    },
    {
      factory: "0xc35DADB65012eC5796536bD9864eD8773aBc74C4",
      fee: 3000,
    },
    {
      factory: "0x9F3044f7F9FC8bC9eD615d54845b4577B833282d",
      fee: 1000,
    },
    {
      factory: "0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32",
      fee: 3000,
    },
  ],
  // CurveStableRegistry: "0x094d12e5b541784701fd8d65f11fc0598fbc6332",
  // CurveFactoryRegistry: "0x722272D36ef0Da72FF51c5A65Db7b870E2e8D4ee",
  CurveDexes: [
    {
      forkType: "curve",
      registry: "0x094d12e5b541784701FD8d65F11fc0598FBC6332", // MainRegistry (MR)
      factoryRegistry: "0x722272D36ef0Da72FF51c5A65Db7b870E2e8D4ee", // MainFactoryRegistry (MFR)
      cryptoRegistry: "0x47bB542B9dE58b970bA50c9dae444DDB4c16751a", // CryptoRegistry (CR)
      cryptoFactoryRegistry: "0xE5De15A9C9bBedb4F5EC13B131E61245f2983A69", // CryptoFactoryRegistry (CFR) // (wnative, stmatic)
    },
  ],
  BalancerPool: undefined,
  Uni2Pool: undefined,
  Deployed: {
    UniV2Viewer: "0xd6d432D86a1E87619CECBFD0F29db0D4330B0b40",
    UniV3Viewer: "0x6240A68a73BeF34d6666E9dC84F5470142dA2bA5",
    CurveViewer: "0x528096f2D57b9f163cC7E8Ada01E79194a65263e",
    CurveCryptoViewer: "",
    BalancerViewer: "0xCb654761E680e7f5cA72c42EB745Ba8c557B7Cd7",
    TokenViewer: "0x334dDfD7A045cfcD6B966E07be0Cda6ca18f440e",
    UniV2Adapter: "0x0e54B8248278208e7870238e8a8C3D56051f6aCE",
    UniV3Adapter: "0x2941227ACe8df22E0df857378175F6745BaC7517",
    MeshAdapter: "0x9f02B39591735671CC8BE821f690dbd1e1E7c1AC",
    CurveAdapter: "0x27F9fFBf1EcBbd8F2c1a9fbBFe9CC3497Bbe6f2B",
    BalancerAdapter: "0xf2A3AA9DBe46EC48780d9E422249bDfb50dfF5Ee",
    RouteProxy: "0x2354493a5Fbe799e0c4177501C4bb476DE318176",
    ApproveProxy: "0xfD5e09842bd805F7002F723306ffdd0E11346A34",
    Approve: "0x314F3F21Baa6ceddf82D0B550563737cf367eEa1",
    TokenValidChecker: "0xD6253c20AEBA871cB15Eb606843B9550C4DF4cAc",
  },

  Oracles: [
    { coin: "0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6", oracle: "0xc907E116054Ad103354f2D350FD2514433D57F6f" },
    { coin: "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619", oracle: "0xF9680D99D6C9589e2a93a78A04A279e509205945" },
    {
      coin: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270",
      oracle: "0xAB594600376Ec9fD91F8e885dADF0CE036862dE0",
    },
    { coin: "0xc2132d05d31c914a87c6611c10748aeb04b58e8f", oracle: "0x0A6513e40db6EB1b165753AD52E80663aeA50545" },
    { coin: "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063", oracle: "0x4746DeC9e833A82EC7C2C1356372CcF2cfcD2F3D" },
    { coin: "0x2791bca1f2de4661ed88a30c99a7a9449aa84174", oracle: "0xfE4A8cc5b5B2366C1B58Bea3858e81843581b2F7" },
    { coin: "0x53e0bca35ec356bd5dddfebbd1fc0fd03fabad39", oracle: "0xd9FFdb71EbE7496cC440152d43986Aae0AB76665" },
  ],
};

export { matic_config as config };
