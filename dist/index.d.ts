import { Api, JsonRpc } from "eosjs";
import { SignatureProvider, Transaction } from "eosjs/dist/eosjs-api-interfaces";
import { ILoginResponse } from "./interfaces";
export declare class WaxJS {
    readonly rpc: JsonRpc;
    api: Api;
    user?: ILoginResponse;
    private signingApi;
    private readonly apiSigner;
    private readonly waxSigningURL;
    private readonly waxAutoSigningURL;
    private readonly eosApiArgs;
    private readonly freeBandwidth;
    private readonly feeFallback;
    private readonly verifyTx;
    get userAccount(): string;
    get pubKeys(): string[];
    constructor({ rpcEndpoint, tryAutoLogin, userAccount, pubKeys, apiSigner, waxSigningURL, waxAutoSigningURL, eosApiArgs, freeBandwidth, feeFallback, verifyTx }: {
        rpcEndpoint: string;
        userAccount?: string;
        pubKeys?: string[];
        tryAutoLogin?: boolean;
        apiSigner?: SignatureProvider;
        waxSigningURL?: string;
        waxAutoSigningURL?: string;
        eosApiArgs?: any;
        freeBandwidth?: boolean;
        feeFallback?: boolean;
        verifyTx?: (user: ILoginResponse, originalTx: Transaction, augmentedTx: Transaction) => void;
    });
    login(): Promise<string>;
    isAutoLoginAvailable(): Promise<boolean>;
    private receiveLogin;
}
export declare function defaultTxVerifier(user: ILoginResponse, originalTx: Transaction, augmentedTx: Transaction): void;
