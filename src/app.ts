import { Probot } from "probot";
import { GitHubAPI } from "./GitHubAPI";
import { PRContext } from "./utils/Types";
import { Orchestrator } from "./Orchestrator";
import { ResolveChecker } from "./ResolveChecker";

export = (app: Probot) => {
    const api = new GitHubAPI();
    const resolveChecker = new ResolveChecker(api);
    const orchestrator = new Orchestrator(api, resolveChecker);

    app.on("pull_request.synchronize", async (context: PRContext)=> {
        const config = await context.config("config.yml");

        await orchestrator.onPullRequestSync(context, config);
    });

    app.on("pull_request.review_requested", async (context: PRContext) => {
        console.info("Start ssw")
        const config = await context.config("config.yml");
        console.info(config);
        await orchestrator.onReviewRequested(context, config);
    })
};
