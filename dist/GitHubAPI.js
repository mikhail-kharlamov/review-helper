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
exports.GitHubAPI = void 0;
class GitHubAPI {
    constructor() {
        this.getDiff = (_a) => __awaiter(this, [_a], void 0, function* ({ context, prNumber }) {
            const result = yield context.octokit.pulls.get(Object.assign(Object.assign({}, context.repo()), { pull_number: prNumber, mediaType: { format: "diff" } }));
            return result.data;
        });
        this.getComments = (context) => __awaiter(this, void 0, void 0, function* () {
            const comment_dtos = yield context.octokit.pulls.listReviewComments({
                owner: context.payload.repository.owner.login,
                repo: context.payload.repository.name,
                pull_number: context.payload.pull_request.number,
            });
            const comments = [];
            let comment;
            comment_dtos.data.forEach((comment_dto) => {
                var _a, _b;
                comment = {
                    pull_request_review_id: comment_dto.pull_request_review_id,
                    id: comment_dto.id,
                    node_id: comment_dto.node_id,
                    diff_hunk: comment_dto.diff_hunk,
                    path: comment_dto.path,
                    start_line: (_a = comment_dto.start_line) !== null && _a !== void 0 ? _a : comment_dto.line,
                    end_line: comment_dto.line,
                    original_start_line: (_b = comment_dto.original_start_line) !== null && _b !== void 0 ? _b : comment_dto.original_line,
                    original_end_line: comment_dto.original_line,
                    commit_id: comment_dto.commit_id,
                    original_commit_id: comment_dto.original_commit_id,
                    body: comment_dto.body
                };
                comments.push(comment);
            });
            return comments;
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
        this.publishComment = (context, comment) => __awaiter(this, void 0, void 0, function* () {
            const pr = context.payload.pull_request;
            yield context.octokit.pulls.createReviewComment({
                owner: context.payload.repository.owner.login,
                repo: context.payload.repository.name,
                pull_number: pr.number,
                commit_id: pr.head.sha,
                path: comment.path,
                line: comment.end_line,
                side: "RIGHT",
                body: comment.body,
            });
        });
        this.replyToComment = (context, parentCommentId, comment) => __awaiter(this, void 0, void 0, function* () {
            const pr = context.payload.pull_request;
            yield context.octokit.pulls.createReviewComment({
                owner: context.payload.repository.owner.login,
                repo: context.payload.repository.name,
                pull_number: pr.number,
                commit_id: pr.head.sha,
                path: comment.path,
                side: "RIGHT",
                body: comment.body,
                in_reply_to: parentCommentId,
            });
        });
        this.publishIssueComment = (context, body) => __awaiter(this, void 0, void 0, function* () {
            yield context.octokit.issues.createComment({
                owner: context.payload.repository.owner.login,
                repo: context.payload.repository.name,
                issue_number: context.payload.pull_request.number,
                body: body,
            });
        });
    }
}
exports.GitHubAPI = GitHubAPI;
