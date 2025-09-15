import { Context } from "probot";


export interface FileDiffRange {
    path: string,
    start_line: number
    end_line: number,
    annotation_level: "failure" | "notice" | "warning",
    message: string,
    title: string
}

export interface Comment {
    pull_request_review_id: number | null
    id: number
    node_id: string
    diff_hunk: string
    path: string
    start_line: number | undefined
    end_line: number | undefined
    original_start_line: number | undefined
    original_end_line: number | undefined
    commit_id: string
    original_commit_id: string
    body: string
}

export interface Feature {
    onPullRequestSyncRun: (context: Context) => Promise<void>;
    onReviewRequestedRun: (context: Context) => Promise<void>;
}

export type PRContext = Context<"pull_request">;
