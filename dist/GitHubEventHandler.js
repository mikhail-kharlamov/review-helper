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
exports.GitHubEventHandler = void 0;
const ReviewService_1 = require("./ReviewService");
class GitHubEventHandler {
    constructor() {
        this.getDiff = (_a) => __awaiter(this, [_a], void 0, function* ({ context, prNumber }) {
            const result = yield context.octokit.pulls.get(Object.assign(Object.assign({}, context.repo()), { pull_number: prNumber, mediaType: { format: "diff" } }));
            return result.data;
        });
        this.publishChecks = (context, annotations) => __awaiter(this, void 0, void 0, function* () {
            const pr = context.payload.pull_request;
            const checkRun = yield context.octokit.checks.create({
                owner: context.payload.repository.owner.login,
                repo: context.payload.repository.name,
                name: "Diff Analyzer",
                head_sha: pr.head.sha,
                status: "in_progress"
            });
            yield context.octokit.checks.update({
                owner: context.payload.repository.owner.login,
                repo: context.payload.repository.name,
                check_run_id: checkRun.data.id,
                status: "completed",
                conclusion: "neutral",
                output: {
                    title: "Diff Analyzer",
                    summary: "Проверка PR завершена",
                    annotations
                }
            });
        });
        this.onPullRequestSync = (context) => __awaiter(this, void 0, void 0, function* () {
            console.info(`Start processing ${context.pullRequest().pull_number}`);
            const pullRequest = context.payload.pull_request;
            const prNumber = pullRequest.number;
            const diff = yield this.getDiff({ context, prNumber });
            const annotations = yield ReviewService_1.ReviewService.getNumberOfChangedStrings(diff);
            yield this.publishChecks(context, annotations);
        });
    }
}
exports.GitHubEventHandler = GitHubEventHandler;
