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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockDexRouter = void 0;
// A helper function to simulate network delays
var sleep = function (ms) { return new Promise(function (resolve) { return setTimeout(resolve, ms); }); };
// A fake base price for our tokens to simulate market rates
var basePrice = 100;
var MockDexRouter = /** @class */ (function () {
    function MockDexRouter() {
    }
    // Simulates getting a price quote from the Raydium exchange
    MockDexRouter.prototype.getRaydiumQuote = function (tokenIn, tokenOut, amount) {
        return __awaiter(this, void 0, void 0, function () {
            var price;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, sleep(200)];
                    case 1:
                        _a.sent(); // Simulate network delay
                        price = basePrice * (0.98 + Math.random() * 0.04);
                        console.log("[DEX] Raydium Quote: ".concat(price.toFixed(2)));
                        return [2 /*return*/, { price: price, fee: 0.003, dex: 'Raydium' }];
                }
            });
        });
    };
    // Simulates getting a price quote from the Meteora exchange
    MockDexRouter.prototype.getMeteoraQuote = function (tokenIn, tokenOut, amount) {
        return __awaiter(this, void 0, void 0, function () {
            var price;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, sleep(250)];
                    case 1:
                        _a.sent(); // Simulate slightly different delay
                        price = basePrice * (0.97 + Math.random() * 0.05);
                        console.log("[DEX] Meteora Quote: ".concat(price.toFixed(2)));
                        return [2 /*return*/, { price: price, fee: 0.002, dex: 'Meteora' }];
                }
            });
        });
    };
    // This function compares the quotes and returns the best one
    MockDexRouter.prototype.getBestQuote = function (tokenIn, tokenOut, amount) {
        return __awaiter(this, void 0, void 0, function () {
            var raydiumQuote, meteoraQuote;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log('[DEX] Routing: Fetching quotes...');
                        return [4 /*yield*/, this.getRaydiumQuote(tokenIn, tokenOut, amount)];
                    case 1:
                        raydiumQuote = _a.sent();
                        return [4 /*yield*/, this.getMeteoraQuote(tokenIn, tokenOut, amount)];
                    case 2:
                        meteoraQuote = _a.sent();
                        // For a buy order, you want the lowest price.
                        if (raydiumQuote.price <= meteoraQuote.price) {
                            console.log('[DEX] Decision: Best price found on Raydium.');
                            return [2 /*return*/, raydiumQuote];
                        }
                        else {
                            console.log('[DEX] Decision: Best price found on Meteora.');
                            return [2 /*return*/, meteoraQuote];
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    return MockDexRouter;
}());
exports.MockDexRouter = MockDexRouter;
