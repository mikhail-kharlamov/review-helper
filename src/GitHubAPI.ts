import type { PullRequest } from "@octokit/webhooks-types";
import {Comment, FileDiffRange, PRContext} from "./utils/Types";


export class GitHubAPI {
    public readonly getDiff = async (
        {context, prNumber}: {context: PRContext, prNumber: number}
    ): Promise<string> => {

        const result = await context.octokit.pulls.get({
            ...context.repo(),
            pull_number: prNumber,
            mediaType: { format: "diff" }
        });
        return result.data as unknown as string;
    }

    public readonly getComments = async (
        context: PRContext
    ): Promise<Comment[]> => {

        const comment_dtos = await context.octokit.pulls.listReviewComments({
            owner: context.payload.repository.owner.login,
            repo: context.payload.repository.name,
            pull_number: context.payload.pull_request.number,
        });

        const comments: Comment[] = [];
        let comment: Comment;
        comment_dtos.data.forEach((comment_dto) => {
            comment = {
                pull_request_review_id: comment_dto.pull_request_review_id,
                id: comment_dto.id,
                node_id: comment_dto.node_id,
                diff_hunk: comment_dto.diff_hunk,
                path: comment_dto.path,
                start_line: comment_dto.start_line ?? comment_dto.line,
                end_line: comment_dto.line,
                original_start_line: comment_dto.original_start_line ?? comment_dto.original_line,
                original_end_line: comment_dto.original_line,
                commit_id: comment_dto.commit_id,
                original_commit_id: comment_dto.original_commit_id,
                body: comment_dto.body
            }
            comments.push(comment);
        });
        return comments;
    }

    public readonly publishChecks = async (
        context: PRContext,
        annotations: FileDiffRange[]
    ): Promise<void> => {

        const pr: PullRequest = context.payload.pull_request;

        const checkRun = await context.octokit.checks.create({
            owner: context.payload.repository.owner.login,
            repo: context.payload.repository.name,
            name: "Diff Analyzer",
            head_sha: pr.head.sha,
            status: "in_progress"
        });

        await context.octokit.checks.update({
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
    }

    public readonly publishComment = async (
        context: PRContext,
        comment: Comment
    ): Promise<void> => {

        const pr: PullRequest = context.payload.pull_request;

        await context.octokit.pulls.createReviewComment({
            owner: context.payload.repository.owner.login,
            repo: context.payload.repository.name,
            pull_number: pr.number,
            commit_id: pr.head.sha,
            path: comment.path,
            line: comment.end_line,
            side: "RIGHT",
            body: comment.body,
        });
    }

    public readonly replyToComment = async (
        context: PRContext,
        parentCommentId: number,
        comment: Comment
    ): Promise<void> => {

        const pr = context.payload.pull_request;

        await context.octokit.pulls.createReviewComment({
            owner: context.payload.repository.owner.login,
            repo: context.payload.repository.name,
            pull_number: pr.number,
            commit_id: pr.head.sha,
            path: comment.path,
            side: "RIGHT",
            body: comment.body,
            in_reply_to: parentCommentId,
        });
    };

    public readonly publishIssueComment = async (
        context: PRContext,
        body: string
    ): Promise<void> => {

        await context.octokit.issues.createComment({
            owner: context.payload.repository.owner.login,
            repo: context.payload.repository.name,
            issue_number: context.payload.pull_request.number,
            body: body,
        });
    }
}
