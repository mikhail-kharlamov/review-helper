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
exports.ResolveChecker = void 0;
class ResolveChecker {
    constructor(api) {
        this.api = api;
        this.onPullRequestSyncRun = (context) => __awaiter(this, void 0, void 0, function* () {
        });
        this.onReviewRequestedRun = (context) => __awaiter(this, void 0, void 0, function* () {
            console.info("ResolveChecker is running...");
            const comments = yield this.api.getComments(context);
            comments.forEach((comment) => {
                this.api.replyToComment(context, comment.id, {
                    pull_request_review_id: comment.pull_request_review_id,
                    id: comment.id,
                    node_id: comment.node_id,
                    diff_hunk: comment.diff_hunk,
                    path: comment.path,
                    start_line: comment.start_line,
                    end_line: comment.end_line,
                    original_start_line: comment.original_start_line,
                    original_end_line: comment.original_end_line,
                    commit_id: comment.commit_id,
                    original_commit_id: comment.original_commit_id,
                    body: "Probably not resolved yet. Please check."
                });
            });
            yield this.api.publishIssueComment(context, "Please check not resolved comments before you rerequest review.");
        });
    }
}
exports.ResolveChecker = ResolveChecker;
