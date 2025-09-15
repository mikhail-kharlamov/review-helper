import { PRContext, Feature, Comment } from "./utils/Types";
import { GitHubAPI } from "./GitHubAPI";

export class ResolveChecker implements Feature {
    public constructor(private readonly api: GitHubAPI) {}

    public readonly onPullRequestSyncRun = async (
        context: PRContext
    ): Promise<void> => {

    }

    public onReviewRequestedRun = async (
        context: PRContext
    ): Promise<void> => {

        console.info("ResolveChecker is running...");

        const comments: Comment[] = await this.api.getComments(context);
        comments.forEach((comment: Comment) => {
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
            })
        });

        await this.api.publishIssueComment(context, "Please check not resolved comments before you rerequest review.");
    }
}
