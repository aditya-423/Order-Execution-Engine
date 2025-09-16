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
var bullmq_1 = require("bullmq");
var ioredis_1 = require("ioredis");
var dex_service_js_1 = require("./dex.service.js");
var connection = new ioredis_1.Redis({ maxRetriesPerRequest: null });
var publisher = new ioredis_1.Redis(); // A separate connection for publishing updates
var worker = new bullmq_1.Worker('order-processing', function (job) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, orderId, tokenIn, tokenOut, amount, channel, dexRouter, bestQuote, txHash, error_1, errorMessage;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _a = job.data, orderId = _a.orderId, tokenIn = _a.tokenIn, tokenOut = _a.tokenOut, amount = _a.amount;
                console.log("[Worker] Processing order ".concat(orderId, "..."));
                channel = "order-updates:".concat(orderId);
                _b.label = 1;
            case 1:
                _b.trys.push([1, 5, , 6]);
                dexRouter = new dex_service_js_1.MockDexRouter();
                // 1. PENDING status
                publisher.publish(channel, JSON.stringify({ status: 'pending' }));
                // 2. ROUTING status
                publisher.publish(channel, JSON.stringify({ status: 'routing' }));
                return [4 /*yield*/, dexRouter.getBestQuote(tokenIn, tokenOut, amount)];
            case 2:
                bestQuote = _b.sent();
                console.log("[Worker] Routing decision for ".concat(orderId, ": Chose ").concat(bestQuote.dex));
                // 3. BUILDING status (simulated)
                publisher.publish(channel, JSON.stringify({ status: 'building' }));
                return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 500); })];
            case 3:
                _b.sent(); // Simulate building tx
                // 4. SUBMITTED status (simulated)
                publisher.publish(channel, JSON.stringify({ status: 'submitted' }));
                return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 1500); })];
            case 4:
                _b.sent(); // Simulate network time
                txHash = "mock_tx_".concat(Math.random().toString(36).substring(2, 15));
                publisher.publish(channel, JSON.stringify({ status: 'confirmed', txHash: txHash, finalPrice: bestQuote.price }));
                console.log("[Worker] Order ".concat(orderId, " confirmed."));
                return [2 /*return*/, { orderId: orderId, bestQuote: bestQuote }];
            case 5:
                error_1 = _b.sent();
                errorMessage = error_1 instanceof Error ? error_1.message : 'An unknown error occurred';
                publisher.publish(channel, JSON.stringify({ status: 'failed', error: errorMessage }));
                throw error_1; // Re-throw error to mark the job as failed in BullMQ
            case 6: return [2 /*return*/];
        }
    });
}); }, { connection: connection });
worker.on('completed', function (job) { return console.log("[Worker] Completed job ".concat(job.id)); });
worker.on('failed', function (job, err) {
    var _a;
    var jobId = (_a = job === null || job === void 0 ? void 0 : job.id) !== null && _a !== void 0 ? _a : 'unknown';
    console.error("[Worker] Failed job ".concat(jobId, " with error:"), err.message);
});
console.log('[Worker] Worker started...');
