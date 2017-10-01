import * as express from 'express';
import * as bodyParser from 'body-parser';
import { Blockchain, Transaction } from './blockchain';

export class Server {
  private app: express.Application;
  private blockchain: Blockchain;

  constructor(blockchain: Blockchain) {
    this.blockchain = blockchain;
    this.app = express();
    this.setup();
    this.setupRoutes();
  }

  public start(): void {
    this.app.listen(3001);
  }

  private setup() {
    this.app.use(bodyParser.json());
  }

  private setupRoutes(): void {
    this.app.get('/mine', (req, res) => this.mine(req, res));
    this.app.post('/transaction', (req, res) => this.createTransaction(req, res));
    this.app.get('/chain', (req, res) => this.getChain(req, res));
    this.app.post('/nodes/register', (req, res) => this.registerNodes(req, res));
    this.app.get('/nodes/resolve', (req, res) => this.consensus(req, res));
  }

  private mine(req: express.Request, res: express.Response): void {
    const lastProof = this.blockchain.lastBlock.proof;
    const proof = this.blockchain.proofOfWork(lastProof);
    this.blockchain.createTransaction({
      sender: '0',
      recipient: '1',
      amount: 1
    });
    const block = this.blockchain.createBlock(proof);
    res.json(Object.assign({
      message: 'New block forged'
    }, block));
  }

  private createTransaction(req: express.Request, res: express.Response): void {
    const index = this.blockchain.createTransaction({
      sender: req.body.sender,
      recipient: req.body.recipient,
      amount: req.body.amount
    });
    res.json({
      message: `Transaction will be added to Block ${index}`
    }).status(201);
  }

  private getChain(req: express.Request, res: express.Response): void {
    res.json({
      chain: this.blockchain.chain,
      length: this.blockchain.chain.length
    });
  }

  private registerNodes(req: express.Request, res: express.Response): void {
    const nodes: string[] = req.body.nodes;
    nodes.forEach((node) => this.blockchain.registerNode(node));
    res.json({
      message: 'New nodes have been added',
      total: this.blockchain.nodes.size
    }).status(201);
  }

  private async consensus(req: express.Request, res: express.Response): Promise<void> {
    const replaced = await this.blockchain.resolveConflicts();
    const message = replaced ? 'Our blockchain was replaced' : 'Our chain is authoritative';
    res.json({
      message,
      chain: this.blockchain.chain
    });
  }
}
