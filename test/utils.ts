import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber } from "ethers";

import { IERC20 } from "../src/types";
import { IERC20__factory } from "../src/types/factories/intf/IERC20__factory";

export class NativeBalanceChangeDetector {
  signer: SignerWithAddress;
  balanceBefore: BigNumber | undefined;
  constructor(signer: SignerWithAddress) {
    this.signer = signer;
  }
  async before() {
    this.balanceBefore = await this.signer.getBalance();
  }
  async after() {
    if (!this.balanceBefore) {
      throw new Error(`${this.constructor.name}: call before first`);
    }
    const balanceAfter = await this.signer.getBalance();
    const balanceChange = balanceAfter.sub(this.balanceBefore);
    return balanceChange;
  }
}

export class TokenBalanceChangeDetector {
  signer: SignerWithAddress;
  token: IERC20;
  balanceBefore: BigNumber | undefined;
  constructor(signer: SignerWithAddress, tokenAddr: string) {
    this.signer = signer;
    this.token = IERC20__factory.connect(tokenAddr, signer);
  }
  async before() {
    this.balanceBefore = await this.token.balanceOf(this.signer.address);
  }
  async after() {
    if (!this.balanceBefore) {
      throw new Error(`${this.constructor.name}: call before first`);
    }
    const balanceAfter = await this.token.balanceOf(this.signer.address);
    const balanceChange = balanceAfter.sub(this.balanceBefore);
    return balanceChange;
  }
}
