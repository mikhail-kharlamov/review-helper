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
exports.Orchestrator = void 0;
const ReviewService_1 = require("./ReviewService");
class Orchestrator {
    constructor(api, resolveChecker) {
        this.api = api;
        this.resolveChecker = resolveChecker;
        this.onPullRequestSync = (context, config) => __awaiter(this, void 0, void 0, function* () {
            console.info(`Start processing ${context.pullRequest().pull_number}`);
            const features = yield this.getFeatures(config);
            features.forEach(feature => {
                feature.onPullRequestSyncRun(context);
            });
            const pullRequest = context.payload.pull_request;
            const prNumber = pullRequest.number;
            const diff = yield this.api.getDiff({ context, prNumber });
            const annotations = yield ReviewService_1.ReviewService.getNumberOfChangedStrings(diff);
            yield this.api.publishChecks(context, annotations);
        });
        this.onReviewRequested = (context, config) => __awaiter(this, void 0, void 0, function* () {
            console.info(`Review requested processing ${context.pullRequest().pull_number}`);
            const features = yield this.getFeatures(config);
            features.forEach(feature => feature.onReviewRequestedRun(context));
        });
        this.getFeatures = (config) => __awaiter(this, void 0, void 0, function* () {
            const features = [];
            if (config.resolve_checker) {
                features.push(this.resolveChecker);
            }
            return features;
        });
    }
}
exports.Orchestrator = Orchestrator;
