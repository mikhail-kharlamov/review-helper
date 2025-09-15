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
const GitHubAPI_1 = require("./GitHubAPI");
const Orchestrator_1 = require("./Orchestrator");
const ResolveChecker_1 = require("./ResolveChecker");
module.exports = (app) => {
    const api = new GitHubAPI_1.GitHubAPI();
    const resolveChecker = new ResolveChecker_1.ResolveChecker(api);
    const orchestrator = new Orchestrator_1.Orchestrator(api, resolveChecker);
    app.on("pull_request.synchronize", (context) => __awaiter(void 0, void 0, void 0, function* () {
        const config = yield context.config("config.yml");
        yield orchestrator.onPullRequestSync(context, config);
    }));
    app.on("pull_request.review_requested", (context) => __awaiter(void 0, void 0, void 0, function* () {
        console.info("Start ssw");
        const config = yield context.config("config.yml");
        console.info(config);
        yield orchestrator.onReviewRequested(context, config);
    }));
};
