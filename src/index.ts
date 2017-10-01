import { Server } from './server';
import { Blockchain } from './blockchain';

const blockchain = new Blockchain();
const server = new Server(blockchain);
server.start();
