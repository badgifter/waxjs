"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultTxVerifier = exports.WaxJS = void 0;
const eosjs_1 = require("eosjs");
const WaxSigningApi_1 = require("./WaxSigningApi");
class WaxJS {
    constructor({ rpcEndpoint, tryAutoLogin = true, userAccount, pubKeys, apiSigner, waxSigningURL = "https://all-access.wax.io", waxAutoSigningURL = "https://api-idm.wax.io/v1/accounts/auto-accept/", eosApiArgs = {}, freeBandwidth = true, feeFallback = true, verifyTx = defaultTxVerifier }) {
        this.signingApi = new WaxSigningApi_1.WaxSigningApi(waxSigningURL, waxAutoSigningURL);
        this.rpc = new eosjs_1.JsonRpc(rpcEndpoint);
        this.waxSigningURL = waxSigningURL;
        this.waxAutoSigningURL = waxAutoSigningURL;
        this.apiSigner = apiSigner;
        this.eosApiArgs = eosApiArgs;
        this.freeBandwidth = freeBandwidth;
        this.feeFallback = feeFallback;
        this.verifyTx = verifyTx;
        if (userAccount && Array.isArray(pubKeys)) {
            // login from constructor
            this.receiveLogin({ account: userAccount, keys: pubKeys });
        }
        else {
            // try to auto-login via endpoint
            if (tryAutoLogin) {
                this.signingApi.tryAutologin().then((response) => __awaiter(this, void 0, void 0, function* () {
                    if (response) {
                        this.receiveLogin(yield this.signingApi.login());
                    }
                }));
            }
        }
    }
    get userAccount() {
        return this.user && this.user.account;
    }
    get pubKeys() {
        return this.user && this.user.keys;
    }
    login() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.user) {
                this.receiveLogin(yield this.signingApi.login());
            }
            return this.user.account;
        });
    }
    isAutoLoginAvailable() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.user) {
                return true;
            }
            else if (yield this.signingApi.tryAutologin()) {
                this.receiveLogin(yield this.signingApi.login());
                return true;
            }
            return false;
        });
    }
    receiveLogin(data) {
        this.user = data;
        const signatureProvider = {
            getAvailableKeys: () => __awaiter(this, void 0, void 0, function* () {
                return [
                    ...this.user.keys,
                    ...((this.apiSigner && (yield this.apiSigner.getAvailableKeys())) ||
                        [])
                ];
            }),
            sign: (sigArgs) => __awaiter(this, void 0, void 0, function* () {
                const originalTx = yield this.api.deserializeTransactionWithActions(sigArgs.serializedTransaction);
                const { serializedTransaction, signatures } = yield this.signingApi.signing(originalTx, sigArgs.serializedTransaction, !this.freeBandwidth, this.feeFallback);
                const augmentedTx = yield this.api.deserializeTransactionWithActions(serializedTransaction);
                this.verifyTx(this.user, originalTx, augmentedTx);
                sigArgs.serializedTransaction = serializedTransaction;
                return {
                    serializedTransaction,
                    signatures: [
                        ...signatures,
                        ...((this.apiSigner &&
                            (yield this.apiSigner.sign(sigArgs)).signatures) ||
                            [])
                    ]
                };
            })
        };
        this.api = new eosjs_1.Api(Object.assign(Object.assign({}, this.eosApiArgs), { rpc: this.rpc, signatureProvider }));
        const transact = this.api.transact.bind(this.api);
        // We monkeypatch the transact method to overcome timeouts
        // firing the pop-up which some browsers enforce, such as Safari.
        // By pre-creating the pop-up window we will interact with,
        // we ensure that it is not going to be rejected due to a delayed
        // pop up that would otherwise occur post transaction creation
        this.api.transact = (transaction, namedParams) => __awaiter(this, void 0, void 0, function* () {
            yield this.signingApi.prepareTransaction(transaction);
            return yield transact(transaction, namedParams);
        });
    }
}
exports.WaxJS = WaxJS;
function defaultTxVerifier(user, originalTx, augmentedTx) {
    const { actions: originalActions } = originalTx;
    const { actions: augmentedActions } = augmentedTx;
    if (JSON.stringify(originalActions) !==
        JSON.stringify(augmentedActions.slice(augmentedActions.length - originalActions.length))) {
        throw new Error(`Augmented transaction actions has modified actions from the original.\nOriginal: ${JSON.stringify(originalActions, undefined, 2)}\nAugmented: ${JSON.stringify(augmentedActions, undefined, 2)}`);
    }
    for (const extraAction of augmentedActions.slice(0, augmentedActions.length - originalActions.length)) {
        const userAuthedAction = extraAction.authorization.find((auth) => {
            return auth.actor === user.account;
        });
        if (userAuthedAction) {
            if (extraAction.account === "eosio.token" &&
                extraAction.name === "transfer") {
                const noopAction = augmentedActions[0];
                if (extraAction.data.to === "gasfee.wax" &&
                    extraAction.data.memo.startsWith("WAX fee for ") &&
                    JSON.stringify(noopAction) ===
                        JSON.stringify({
                            account: "boost.wax",
                            name: "noop",
                            authorization: [
                                {
                                    actor: "boost.wax",
                                    permission: "paybw"
                                }
                            ],
                            data: {}
                        })) {
                    continue;
                }
            }
            if (extraAction.account === "eosio" &&
                extraAction.name === "buyrambytes") {
                if (extraAction.data.receiver === user.account) {
                    continue;
                }
            }
            throw new Error(`Augmented transaction actions has an extra action from the original authorizing the user.\nOriginal: ${JSON.stringify(originalActions, undefined, 2)}\nAugmented: ${JSON.stringify(augmentedActions, undefined, 2)}`);
        }
    }
}
exports.defaultTxVerifier = defaultTxVerifier;
