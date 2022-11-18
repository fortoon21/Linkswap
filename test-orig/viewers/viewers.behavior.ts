import { expect } from "chai";

export function fetchTokenViewer(): void {
  it("Fetch WETH metadata", async function () {
    await this.tokenViewer.getTokenMetadata(this.config.WETH);
  });
}

export function fetchUniV2Viewer(): void {
  it("Fetch univ2 pool", async function () {
    for (const uni2 of this.config.Uni2Dexes) {
      const len = await this.uniV2Viewer.allPairsLength(uni2.factory);
      if (len.lte(0)) {
        continue;
      }

      await this.uniV2Viewer.getPairInfo(uni2.factory, 0);
    }
  });
}

export function fetchCurveViewer(): void {
  it("Fetch curve pool", async function () {
    for (const curveViewer of this.curveViewers) {
      const poolAddrs = await curveViewer.pools();
      expect(poolAddrs.length).greaterThan(0);
      await curveViewer.getPoolInfo(poolAddrs[0]);
    }
  });
}

export function fetchBalancerViewer(): void {
  it("Fetch balancer pool", async function () {
    if (!this.config.BalancerPool) {
      return;
    }

    await this.balancerViewer.getPoolInfo(this.config.BalancerPool);
  });
}
