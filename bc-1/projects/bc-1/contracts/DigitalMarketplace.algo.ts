import { Contract } from '@algorandfoundation/tealscript';

export class DigitalMarketplace extends Contract {
  assetId = GlobalStateKey<AssetID>();

  unitaryPrice = GlobalStateKey<uint64>();

  createApplication(assetId: AssetID, unitaryPrice: uint64): void {
    this.assetId.value = assetId;
    this.unitaryPrice.value = unitaryPrice;
  }

  setPrice(unitaryPrice: uint64): void {
    assert(this.txn.sender === this.app.creator);
    this.unitaryPrice.value = unitaryPrice;
  }

  optInToAsset(mbrTxn: PayTxn): void {
    assert(this.txn.sender === this.app.creator);
    verifyPayTxn(mbrTxn, {
      receiver: this.app.address,
      amount: globals.minBalance + globals.assetOptInMinBalance,
    });
    sendAssetTransfer({
      xferAsset: this.assetId.value,
      assetAmount: 0,
      assetReceiver: this.app.address,
    });
  }

  buy(buyerTxn: PayTxn, quantity: uint64): void {
    assert(this.assetId.value.id !== 0, 'AssetID not set');
    assert(this.unitaryPrice.value !== 0, 'Unitary price not set');
    verifyPayTxn(buyerTxn, {
      sender: this.txn.sender,
      receiver: this.app.address,
      amount: this.unitaryPrice.value * quantity,
    });
    sendAssetTransfer({
      xferAsset: this.assetId.value,
      assetAmount: quantity,
      assetReceiver: this.txn.sender,
    });
  }

  deleteApplication(): void {
    assert(this.txn.sender === this.app.creator);

    sendAssetTransfer({
      xferAsset: this.assetId.value,
      assetReceiver: this.app.creator,
      assetAmount: this.app.address.assetBalance(this.assetId.value),
      assetCloseTo: this.app.creator,
    });
    sendPayment({

      amount: this.app.address.balance,
      receiver: this.app.creator,
      closeRemainderTo: this.app.creator,
    });
  }
}
