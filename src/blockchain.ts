import { createHash } from 'crypto';
import { URL } from 'url';
import axios from 'axios';

export interface Block {
  index: number;
  timestamp: number;
  transactions: Transaction[];
  proof: number;
  previousHash: string;
}

export interface Transaction {
  sender: string;
  recipient: string;
  amount: number;
}

export class Blockchain {
  private _chain: Block[];
  private _currentTransactions: Transaction[];
  private _nodes: Set<string>;

  constructor() {
    this._chain = [];
    this._currentTransactions = [];
    this._nodes = new Set();
    this.createBlock(100, '1');
  }

  public createBlock(proof: number, previousHash?: string): Block {
    const block = {
      index: this._chain.length + 1,
      timestamp: Date.now(),
      transactions: this._currentTransactions,
      proof,
      previousHash: previousHash || Blockchain.hash(this.lastBlock)
    };

    this._currentTransactions = [];
    this._chain.push(block);
    return block;
  }

  public createTransaction(transaction: Transaction): number {
    this._currentTransactions.push(transaction);
    return this.lastBlock.index + 1;
  }

  public proofOfWork(lastProof: number): number {
    let proof = 0;
    while (!Blockchain.isValidProof(lastProof, proof)) {
      proof++;
    }
    return proof;
  }

  public registerNode(address: string): void {
    const url = new URL(address);
    this._nodes.add(url.host);
  }

  public async resolveConflicts(): Promise<boolean> {
    let newChain: Block[] = null;
    let maxLength: number = this.chain.length;

    for (let node of this._nodes) {
      console.log(`Checking ${node}`)
      const response = await axios.get(`http://${node}/chain`);
      if (response.status === 200) {
        const length: number = response.data.length;
        const chain: Block[] = response.data.chain;

        if (length > maxLength && Blockchain.isValidChain(chain)) {
          console.log('Found longer chain');
          newChain = chain;
          maxLength = length;
        }
      }
    }

    console.log(newChain);
    if (newChain) {
      console.log('Repalcing chain');
      this._chain = newChain;
      return true;
    }
    return false;
  }

  public static hash(block: Block): string {
    const blockString = JSON.stringify(block);
    return createHash('sha256').update(blockString).digest('hex');
  }

  public static isValidProof(lastProof: number, proof: number): boolean {
    const guess = `${lastProof}${proof}`;
    const hash = createHash('sha256').update(guess).digest('hex');
    const tail = hash.substr(hash.length - 4);
    return tail === '0000';
  }

  public static isValidChain(chain: Block[]): boolean {
    if (chain.length < 2) {
      return true;
    }

    let lastBlock = chain[0];

    for (let index = 1; index < chain.length; index++) {
      let block = chain[index];
      if (block.previousHash !== this.hash(lastBlock)) return false;
      if (!this.isValidProof(lastBlock.proof, block.proof)) return false;
      lastBlock = block;
    }

    return true;
  }

  public get lastBlock(): Block {
    return this._chain[this._chain.length - 1];
  }

  public get chain(): Block[] {
    return this._chain;
  }

  public get nodes(): Set<string> {
    return this._nodes;
  }
}
