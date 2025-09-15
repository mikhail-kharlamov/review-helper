import {Feature, FileDiffRange, PRContext} from "./utils/Types";
import type {PullRequest} from "@octokit/webhooks-types";
import {ReviewService} from "./ReviewService";
import {GitHubAPI} from "./GitHubAPI";
import {ResolveChecker} from "./ResolveChecker";

export class Orchestrator {
    public constructor(private readonly api: GitHubAPI, private readonly resolveChecker: ResolveChecker) {}

    public readonly onPullRequestSync = async (
        context: PRContext,
        config: any
    ): Promise<void> => {

        console.info(`Start processing ${context.pullRequest().pull_number}`);

        const features: Array<Feature> = await this.getFeatures(config);
        features.forEach(feature => {
            feature.onPullRequestSyncRun(context)
        })

        const pullRequest: PullRequest = context.payload.pull_request;
        const prNumber: number = pullRequest.number
        const diff: string = await this.api.getDiff({context, prNumber});

        const annotations: FileDiffRange[] = await ReviewService.getNumberOfChangedStrings(diff);

        await this.api.publishChecks(context, annotations);
    }

    public readonly onReviewRequested = async (
        context: PRContext,
        config: any
    ): Promise<void> => {

        console.info(`Review requested processing ${context.pullRequest().pull_number}`);

        const features: Array<Feature> = await this.getFeatures(config);
        features.forEach(feature => feature.onReviewRequestedRun(context));
    }

    private readonly getFeatures = async (
        config: any
    ): Promise<Array<Feature>> => {

        const features: Array<Feature> = [];
        if (config.resolve_checker) {
            features.push(this.resolveChecker);
        }
        return features;
    }
}
