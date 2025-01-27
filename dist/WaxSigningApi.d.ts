import { Transaction } from "eosjs/dist/eosjs-api-interfaces";
import { ILoginResponse, ISigningResponse } from "./interfaces";
export declare class WaxSigningApi {
    readonly waxSigningURL: string;
    readonly waxAutoSigningURL: string;
    private waxEventSource;
    private user?;
    private signingWindow?;
    private whitelistedContracts?;
    constructor(waxSigningURL: string, waxAutoSigningURL: string);
    login(): Promise<ILoginResponse>;
    tryAutologin(): Promise<boolean>;
    prepareTransaction(transaction: Transaction): Promise<void>;
    signing(transaction: Transaction, serializedTransaction: Uint8Array, noModify?: boolean, feeFallback?: boolean): Promise<ISigningResponse>;
    private loginViaWindow;
    private loginViaEndpoint;
    private signViaEndpoint;
    private signViaWindow;
    private receiveLogin;
    private receiveSignatures;
    private canAutoSign;
    private isWhitelisted;
}
